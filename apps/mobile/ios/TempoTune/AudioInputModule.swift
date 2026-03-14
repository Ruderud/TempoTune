import Foundation
import AVFoundation
import React

@objc(AudioInputModule)
class AudioInputModule: RCTEventEmitter {

  private var audioEngine: AVAudioEngine?
  private var isCapturing = false
  private var sampleRate: Double = 44100
  private let bufferSize: AVAudioFrameCount = 2048
  private var hasListeners = false
  private var selectedInputPort: AVAudioSessionPortDescription?
  private var enablePitchDetection = true
  private var enableRhythmDetection = false
  private var qaSampleSource: QaSampleSource?
  private var qaSampleWorkItem: DispatchWorkItem?
  private var lastRhythmOnsetAtMs: Double = 0
  private var fluxHistory: [Float] = []
  private var previousEnergy: [Float]?

  private let rhythmRmsThreshold: Float = 0.02
  private let rhythmFluxThresholdMultiplier: Float = 1.5
  private let rhythmRefractoryMs: Double = 80
  private let rhythmAdaptiveWindowSize = 10

  // MARK: - RCTEventEmitter

  override static func requiresMainQueueSetup() -> Bool { false }

  override func supportedEvents() -> [String]! {
    [
      "onAudioInputDevicesResponse",
      "onSelectedAudioInputDeviceResponse",
      "onAudioInputStateChanged",
      "onAudioInputRouteChanged",
      "onPitchDetected",
      "onRhythmHitDetected",
      "onAudioInputError",
    ]
  }

  override func startObserving() { hasListeners = true }
  override func stopObserving() { hasListeners = false }

  // MARK: - Device Enumeration

  @objc func listInputDevices() {
    let session = AVAudioSession.sharedInstance()
    let inputs = session.availableInputs ?? []
    let devices = inputs.map { port -> [String: Any] in
      return [
        "id": port.uid,
        "label": port.portName,
        "transport": Self.classifyTransport(port.portType),
        "platformKind": port.portType.rawValue,
        "channelCount": port.channels?.count ?? 1,
        "sampleRates": [44100, 48000],
        "isDefault": port.uid == session.currentRoute.inputs.first?.uid,
        "isAvailable": true,
      ]
    }

    guard hasListeners else { return }
    sendEvent(withName: "onAudioInputDevicesResponse", body: ["devices": devices])
  }

  @objc func getSelectedInputDevice() {
    let session = AVAudioSession.sharedInstance()
    let currentInput = session.currentRoute.inputs.first

    let device: [String: Any]? = currentInput.map { port in
      [
        "id": port.uid,
        "label": port.portName,
        "transport": Self.classifyTransport(port.portType),
        "platformKind": port.portType.rawValue,
        "channelCount": port.channels?.count ?? 1,
        "sampleRates": [44100, 48000],
        "isDefault": true,
        "isAvailable": true,
      ]
    }

    guard hasListeners else { return }
    sendEvent(withName: "onSelectedAudioInputDeviceResponse", body: ["device": device as Any])
  }

  @objc func selectInputDevice(_ deviceId: String) {
    let session = AVAudioSession.sharedInstance()
    guard let input = session.availableInputs?.first(where: { $0.uid == deviceId }) else {
      emitError("Device not found: \(deviceId)")
      return
    }

    do {
      try session.setPreferredInput(input)
      selectedInputPort = input
    } catch {
      emitError("Failed to select device: \(error.localizedDescription)")
    }
  }

  @objc func configureAnalyzers(_ config: NSDictionary) {
    if let enablePitch = config["enablePitch"] as? Bool {
      enablePitchDetection = enablePitch
    }
    if let enableRhythm = config["enableRhythm"] as? Bool {
      enableRhythmDetection = enableRhythm
    }
    if !enableRhythmDetection {
      resetRhythmDetector()
    }
  }

  @objc func setQaSampleSource(_ config: NSDictionary) {
    guard let rawUrl = config["url"] as? String else {
      qaSampleSource = nil
      return
    }

    let url = rawUrl.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !url.isEmpty else {
      qaSampleSource = nil
      return
    }

    let loop = config["loop"] as? Bool ?? true
    qaSampleSource = QaSampleSource(url: url, loop: loop)
  }

  @objc func clearQaSampleSource() {
    qaSampleSource = nil
  }

  // MARK: - Capture

  @objc func startCapture(_ config: NSDictionary) {
    guard !isCapturing else { return }

    emitStateChanged("starting")

    let deviceId = config["deviceId"] as? String
    enablePitchDetection = config["enablePitch"] as? Bool ?? true
    enableRhythmDetection = config["enableRhythm"] as? Bool ?? false
    resetRhythmDetector()

    if let qaSampleSource {
      startQaSampleCapture(sampleSource: qaSampleSource)
      return
    }

    let session = AVAudioSession.sharedInstance()
    do {
      try session.setCategory(.playAndRecord, mode: .measurement, options: [.defaultToSpeaker, .allowBluetooth])
      try session.setPreferredSampleRate(sampleRate)
      try session.setPreferredIOBufferDuration(0.005)
      try? session.setPreferredInputNumberOfChannels(1)

      // Select device if specified
      if let deviceId = deviceId,
         let input = session.availableInputs?.first(where: { $0.uid == deviceId }) {
        try session.setPreferredInput(input)
        selectedInputPort = input
      }

      try session.setActive(true)
    } catch {
      emitStateChanged("error", errorMessage: error.localizedDescription)
      return
    }

    audioEngine = AVAudioEngine()
    guard let audioEngine = audioEngine else { return }

    let inputNode = audioEngine.inputNode
    let format = inputNode.outputFormat(forBus: 0)
    sampleRate = format.sampleRate

    inputNode.installTap(onBus: 0, bufferSize: bufferSize, format: format) { [weak self] buffer, time in
      guard let self = self else { return }
      if self.enablePitchDetection {
        self.processPitchDetection(buffer, time: time)
      }
      if self.enableRhythmDetection {
        self.processRhythmDetection(buffer)
      }
    }

    do {
      try audioEngine.start()
      isCapturing = true

      let monotonicMs = Self.monotonicNowMs()
      emitStateChanged("running", extra: [
        "deviceId": deviceId ?? session.currentRoute.inputs.first?.uid ?? "",
        "sampleRate": sampleRate,
        "channelCount": 1,
        "startedAtMonotonicMs": monotonicMs,
      ])
    } catch {
      emitStateChanged("error", errorMessage: error.localizedDescription)
    }

    observeRouteChanges()
  }

  @objc func stopCapture() {
    guard isCapturing else { return }
    isCapturing = false

    qaSampleWorkItem?.cancel()
    qaSampleWorkItem = nil
    audioEngine?.inputNode.removeTap(onBus: 0)
    audioEngine?.stop()
    audioEngine = nil
    resetRhythmDetector()

    emitStateChanged("idle")
  }

  // MARK: - Pitch Detection (reuses YIN from PitchDetectorModule)

  private let yinThreshold: Float = 0.15
  private let yinProbabilityThreshold: Float = 0.1
  private let referenceFrequency: Double = 440.0
  private var detectionSequence: UInt64 = 0
  private let noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
  private struct QaSampleSource {
    let url: String
    let loop: Bool
  }

  private struct WavSample {
    let sampleRate: Double
    let channelCount: Int
    let samples: [Float]
  }

  private func processPitchDetection(_ buffer: AVAudioPCMBuffer, time: AVAudioTime) {
    guard let channelData = buffer.floatChannelData?[0] else { return }
    let frameCount = Int(buffer.frameLength)
    guard frameCount >= Int(bufferSize) else { return }

    let audioData = Array(UnsafeBufferPointer(start: channelData, count: Int(bufferSize)))
    guard let result = yinDetect(audioData) else { return }

    let monotonicMs = Self.monotonicNowMs()
    detectionSequence += 1

    let note = frequencyToNote(result.frequency)

    guard hasListeners else { return }
    sendEvent(withName: "onPitchDetected", body: [
      "frequency": result.frequency,
      "confidence": result.probability,
      "name": note.name,
      "octave": note.octave,
      "cents": note.cents,
      "detectedAtMonotonicMs": monotonicMs,
      "debugSeq": detectionSequence,
      "debugSource": "native",
    ])
  }

  private func processPitchDetection(_ audioData: [Float]) {
    guard enablePitchDetection else { return }
    guard let result = yinDetect(audioData) else { return }

    let monotonicMs = Self.monotonicNowMs()
    detectionSequence += 1
    let note = frequencyToNote(result.frequency)

    guard hasListeners else { return }
    sendEvent(withName: "onPitchDetected", body: [
      "frequency": result.frequency,
      "confidence": result.probability,
      "name": note.name,
      "octave": note.octave,
      "cents": note.cents,
      "detectedAtMonotonicMs": monotonicMs,
      "debugSeq": detectionSequence,
      "debugSource": "native",
    ])
  }

  private func processRhythmDetection(_ buffer: AVAudioPCMBuffer) {
    guard let channelData = buffer.floatChannelData?[0] else { return }
    let frameCount = Int(buffer.frameLength)
    guard frameCount >= Int(bufferSize) else { return }

    let audioData = Array(UnsafeBufferPointer(start: channelData, count: Int(bufferSize)))
    guard let onsetAtMonotonicMs = detectOnset(audioData) else { return }

    guard let metronome = MetronomeModule.instance else { return }
    guard metronome.isCurrentlyPlayingForRhythm else { return }

    let bpm = metronome.currentBpmForRhythm
    let lastBeatAtMonotonicMs = metronome.currentBeatAtMonotonicMsForRhythm
    guard bpm > 0, lastBeatAtMonotonicMs > 0 else { return }

    let beatIntervalMs = 60000.0 / bpm
    let nearestBeatAtMonotonicMs =
      lastBeatAtMonotonicMs
      + Foundation.round((onsetAtMonotonicMs - lastBeatAtMonotonicMs) / beatIntervalMs) * beatIntervalMs
    let offsetMs = onsetAtMonotonicMs - nearestBeatAtMonotonicMs
    let absOffsetMs = abs(offsetMs)
    let status: String
    if absOffsetMs <= 50 {
      status = "on-time"
    } else if offsetMs < 0 {
      status = "early"
    } else {
      status = "late"
    }
    let confidence = max(0.0, 1.0 - absOffsetMs / 200.0)

    guard hasListeners else { return }
    sendEvent(withName: "onRhythmHitDetected", body: [
      "detectedAtMonotonicMs": onsetAtMonotonicMs,
      "nearestBeatAtMonotonicMs": nearestBeatAtMonotonicMs,
      "offsetMs": offsetMs,
      "status": status,
      "confidence": confidence,
      "source": "unknown",
    ])
  }

  private func processRhythmDetection(_ audioData: [Float]) {
    guard enableRhythmDetection else { return }
    guard let onsetAtMonotonicMs = detectOnset(audioData) else { return }

    guard let metronome = MetronomeModule.instance else { return }
    guard metronome.isCurrentlyPlayingForRhythm else { return }

    let bpm = metronome.currentBpmForRhythm
    let lastBeatAtMonotonicMs = metronome.currentBeatAtMonotonicMsForRhythm
    guard bpm > 0, lastBeatAtMonotonicMs > 0 else { return }

    let beatIntervalMs = 60000.0 / bpm
    let nearestBeatAtMonotonicMs =
      lastBeatAtMonotonicMs
      + Foundation.round((onsetAtMonotonicMs - lastBeatAtMonotonicMs) / beatIntervalMs) * beatIntervalMs
    let offsetMs = onsetAtMonotonicMs - nearestBeatAtMonotonicMs
    let absOffsetMs = abs(offsetMs)
    let status: String
    if absOffsetMs <= 50 {
      status = "on-time"
    } else if offsetMs < 0 {
      status = "early"
    } else {
      status = "late"
    }
    let confidence = max(0.0, 1.0 - absOffsetMs / 200.0)

    guard hasListeners else { return }
    sendEvent(withName: "onRhythmHitDetected", body: [
      "detectedAtMonotonicMs": onsetAtMonotonicMs,
      "nearestBeatAtMonotonicMs": nearestBeatAtMonotonicMs,
      "offsetMs": offsetMs,
      "status": status,
      "confidence": confidence,
      "source": "unknown",
    ])
  }

  private func startQaSampleCapture(sampleSource: QaSampleSource) {
    isCapturing = true

    var workItem: DispatchWorkItem?
    workItem = DispatchWorkItem { [weak self] in
      guard let self, let workItem else { return }

      do {
        let sample = try self.loadWavSample(from: sampleSource.url)
        self.sampleRate = sample.sampleRate

        let monotonicMs = Self.monotonicNowMs()
        self.emitStateChanged("running", extra: [
          "deviceId": "qa-sample",
          "sampleRate": sample.sampleRate,
          "channelCount": sample.channelCount,
          "startedAtMonotonicMs": monotonicMs,
        ])

        self.processQaSampleLoop(sample: sample, loop: sampleSource.loop, workItem: workItem)
      } catch {
        self.emitStateChanged("error", errorMessage: error.localizedDescription)
        self.isCapturing = false
      }
    }

    qaSampleWorkItem = workItem
    if let workItem {
      DispatchQueue.global(qos: .userInitiated).async(execute: workItem)
    }
  }

  private func processQaSampleLoop(sample: WavSample, loop: Bool, workItem: DispatchWorkItem) {
    let frameDurationNs = UInt64((Double(bufferSize) / sample.sampleRate) * 1_000_000_000.0)
    var cursor = 0
    var nextFrameAt = DispatchTime.now().uptimeNanoseconds

    while isCapturing && !workItem.isCancelled {
      if cursor >= sample.samples.count, loop {
        cursor = 0
        resetRhythmDetector()
      }

      var frame = [Float](repeating: 0, count: Int(bufferSize))
      let remaining = max(0, sample.samples.count - cursor)
      let copyCount = min(Int(bufferSize), remaining)
      if copyCount > 0 {
        frame.replaceSubrange(0..<copyCount, with: sample.samples[cursor..<(cursor + copyCount)])
        cursor += copyCount
      }

      processPitchDetection(frame)
      processRhythmDetection(frame)

      nextFrameAt += frameDurationNs
      let now = DispatchTime.now().uptimeNanoseconds
      if nextFrameAt > now {
        usleep(useconds_t((nextFrameAt - now) / 1_000))
      }
    }
  }

  // MARK: - Route Change Observation

  private func observeRouteChanges() {
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleRouteChange),
      name: AVAudioSession.routeChangeNotification,
      object: nil
    )
  }

  @objc private func handleRouteChange(notification: Notification) {
    guard hasListeners else { return }
    // Re-enumerate devices on route change
    let session = AVAudioSession.sharedInstance()
    let inputs = session.availableInputs ?? []
    let devices = inputs.map { port -> [String: Any] in
      [
        "id": port.uid,
        "label": port.portName,
        "transport": Self.classifyTransport(port.portType),
        "platformKind": port.portType.rawValue,
        "channelCount": port.channels?.count ?? 1,
        "sampleRates": [44100, 48000],
        "isDefault": port.uid == session.currentRoute.inputs.first?.uid,
        "isAvailable": true,
      ]
    }
    sendEvent(withName: "onAudioInputRouteChanged", body: ["devices": devices])
  }

  // MARK: - Helpers

  private static func monotonicNowMs() -> Double {
    var info = mach_timebase_info_data_t()
    mach_timebase_info(&info)
    let nanos = mach_absolute_time() * UInt64(info.numer) / UInt64(info.denom)
    return Double(nanos) / 1_000_000.0
  }

  private static func classifyTransport(_ portType: AVAudioSession.Port) -> String {
    switch portType {
    case .usbAudio: return "usb"
    case .bluetoothA2DP, .bluetoothLE, .bluetoothHFP: return "bluetooth"
    case .headphones, .headsetMic: return "wired"
    case .builtInMic: return "built-in"
    default: return "unknown"
    }
  }

  private func emitStateChanged(_ status: String, errorMessage: String? = nil, extra: [String: Any]? = nil) {
    guard hasListeners else { return }
    var body: [String: Any] = [
      "status": status,
      "timestampSource": "monotonic",
    ]
    if let err = errorMessage { body["errorMessage"] = err }
    if let extra = extra {
      for (k, v) in extra { body[k] = v }
    }
    sendEvent(withName: "onAudioInputStateChanged", body: body)
  }

  private func emitError(_ message: String) {
    guard hasListeners else { return }
    sendEvent(withName: "onAudioInputError", body: ["message": message])
  }

  private func resetRhythmDetector() {
    lastRhythmOnsetAtMs = 0
    fluxHistory.removeAll(keepingCapacity: true)
    previousEnergy = nil
  }

  private func detectOnset(_ audioData: [Float]) -> Double? {
    let nowMs = Self.monotonicNowMs()
    if nowMs - lastRhythmOnsetAtMs < rhythmRefractoryMs {
      return nil
    }

    let rms = computeRms(audioData)
    if rms < rhythmRmsThreshold {
      return nil
    }

    let energy = computeEnergy(audioData)
    let flux = computeEnergyFlux(energy)
    fluxHistory.append(flux)
    if fluxHistory.count > rhythmAdaptiveWindowSize {
      fluxHistory.removeFirst(fluxHistory.count - rhythmAdaptiveWindowSize)
    }

    let meanFlux = fluxHistory.isEmpty
      ? 0
      : fluxHistory.reduce(0, +) / Float(fluxHistory.count)
    let threshold = meanFlux * rhythmFluxThresholdMultiplier
    previousEnergy = energy

    if flux > threshold && flux > 0 {
      lastRhythmOnsetAtMs = nowMs
      return nowMs
    }

    return nil
  }

  private func computeRms(_ audioData: [Float]) -> Float {
    guard !audioData.isEmpty else { return 0 }
    let sum = audioData.reduce(Float(0)) { partial, sample in
      partial + sample * sample
    }
    return sqrt(sum / Float(audioData.count))
  }

  private func computeEnergy(_ audioData: [Float]) -> [Float] {
    let step = 4
    let count = audioData.count / step
    var energy = [Float](repeating: 0, count: count)
    for i in 0..<count {
      let base = i * step
      var value: Float = 0
      for j in 0..<step {
        let sample = audioData[base + j]
        value += sample * sample
      }
      energy[i] = value
    }
    return energy
  }

  private func computeEnergyFlux(_ currentEnergy: [Float]) -> Float {
    guard let previousEnergy, previousEnergy.count == currentEnergy.count else {
      return 0
    }

    var flux: Float = 0
    for i in currentEnergy.indices {
      let diff = currentEnergy[i] - previousEnergy[i]
      if diff > 0 {
        flux += diff
      }
    }
    return flux
  }

  // MARK: - YIN

  private struct PitchResult {
    let frequency: Double
    let probability: Double
  }

  private struct NoteInfo {
    let name: String
    let octave: Int
    let cents: Int
  }

  private func yinDetect(_ audioData: [Float]) -> PitchResult? {
    let halfBuffer = audioData.count / 2
    var yinBuffer = [Float](repeating: 0, count: halfBuffer)

    for tau in 0..<halfBuffer {
      for i in 0..<halfBuffer {
        let delta = audioData[i] - audioData[i + tau]
        yinBuffer[tau] += delta * delta
      }
    }

    yinBuffer[0] = 1
    var runningSum: Float = 0
    for tau in 1..<halfBuffer {
      runningSum += yinBuffer[tau]
      yinBuffer[tau] = (yinBuffer[tau] * Float(tau)) / runningSum
    }

    var tauEstimate = -1
    for tau in 2..<halfBuffer {
      if yinBuffer[tau] < yinThreshold {
        var t = tau
        while t + 1 < halfBuffer && yinBuffer[t + 1] < yinBuffer[t] {
          t += 1
        }
        tauEstimate = t
        break
      }
    }

    guard tauEstimate != -1 else { return nil }

    let betterTau: Double
    if tauEstimate > 0 && tauEstimate < halfBuffer - 1 {
      let s0 = Double(yinBuffer[tauEstimate - 1])
      let s1 = Double(yinBuffer[tauEstimate])
      let s2 = Double(yinBuffer[tauEstimate + 1])
      let adjustment = (s2 - s0) / (2 * (2 * s1 - s2 - s0))
      betterTau = Double(tauEstimate) + adjustment
    } else {
      betterTau = Double(tauEstimate)
    }

    let frequency = sampleRate / betterTau
    let probability = 1.0 - Double(yinBuffer[tauEstimate])

    guard probability >= Double(yinProbabilityThreshold) else { return nil }
    guard frequency >= 20 && frequency <= 5000 else { return nil }

    return PitchResult(frequency: frequency, probability: probability)
  }

  private func frequencyToNote(_ frequency: Double) -> NoteInfo {
    let semitones = 12.0 * log2(frequency / referenceFrequency)
    let roundedSemitones = Int(semitones.rounded())
    let cents = Int(((semitones - Double(roundedSemitones)) * 100).rounded())

    let midiNote = 69 + roundedSemitones
    let octave = midiNote / 12 - 1
    let noteIndex = ((midiNote % 12) + 12) % 12
    let name = noteNames[noteIndex]

    return NoteInfo(name: name, octave: octave, cents: cents)
  }

  private func loadWavSample(from urlString: String) throws -> WavSample {
    guard let url = URL(string: urlString) else {
      throw NSError(domain: "AudioInputModule", code: 1, userInfo: [
        NSLocalizedDescriptionKey: "Invalid QA sample URL: \(urlString)",
      ])
    }

    let data = try Data(contentsOf: url)
    return try parseWav(data)
  }

  private func parseWav(_ data: Data) throws -> WavSample {
    guard data.count >= 44 else {
      throw NSError(domain: "AudioInputModule", code: 2, userInfo: [
        NSLocalizedDescriptionKey: "QA sample is too small to be a WAV file",
      ])
    }

    guard ascii(data, offset: 0, count: 4) == "RIFF",
          ascii(data, offset: 8, count: 4) == "WAVE" else {
      throw NSError(domain: "AudioInputModule", code: 3, userInfo: [
        NSLocalizedDescriptionKey: "QA sample must be a RIFF/WAVE file",
      ])
    }

    var fmtOffset: Int?
    var fmtSize = 0
    var dataOffset: Int?
    var dataSize = 0
    var offset = 12

    while offset + 8 <= data.count {
      let chunkId = ascii(data, offset: offset, count: 4)
      let chunkSize = Int(readUInt32LE(data, offset + 4))
      let chunkDataOffset = offset + 8

      switch chunkId {
      case "fmt ":
        fmtOffset = chunkDataOffset
        fmtSize = chunkSize
      case "data":
        dataOffset = chunkDataOffset
        dataSize = chunkSize
      default:
        break
      }

      let paddedChunkSize = chunkSize + (chunkSize & 1)
      offset = chunkDataOffset + paddedChunkSize
    }

    guard let fmtOffset, let dataOffset, fmtSize >= 16 else {
      throw NSError(domain: "AudioInputModule", code: 4, userInfo: [
        NSLocalizedDescriptionKey: "QA sample is missing fmt/data WAV chunks",
      ])
    }

    let audioFormat = Int(readUInt16LE(data, fmtOffset))
    let channelCount = Int(readUInt16LE(data, fmtOffset + 2))
    let sampleRate = Double(readUInt32LE(data, fmtOffset + 4))
    let bitsPerSample = Int(readUInt16LE(data, fmtOffset + 14))

    guard audioFormat == 1, bitsPerSample == 16, channelCount > 0 else {
      throw NSError(domain: "AudioInputModule", code: 5, userInfo: [
        NSLocalizedDescriptionKey: "QA sample must be a 16-bit PCM WAV file",
      ])
    }

    let frameCount = dataSize / (channelCount * 2)
    var samples = [Float]()
    samples.reserveCapacity(frameCount)

    var sampleOffset = dataOffset
    for _ in 0..<frameCount {
      var mixed: Float = 0
      for _ in 0..<channelCount {
        let raw = Int16(bitPattern: readUInt16LE(data, sampleOffset))
        mixed += Float(raw) / 32768.0
        sampleOffset += 2
      }
      samples.append(mixed / Float(channelCount))
    }

    return WavSample(sampleRate: sampleRate, channelCount: 1, samples: samples)
  }

  private func ascii(_ data: Data, offset: Int, count: Int) -> String {
    guard offset + count <= data.count else { return "" }
    return String(data: data.subdata(in: offset..<(offset + count)), encoding: .ascii) ?? ""
  }

  private func readUInt16LE(_ data: Data, _ offset: Int) -> UInt16 {
    guard offset + 2 <= data.count else { return 0 }
    return data.subdata(in: offset..<(offset + 2)).withUnsafeBytes {
      UInt16(littleEndian: $0.load(as: UInt16.self))
    }
  }

  private func readUInt32LE(_ data: Data, _ offset: Int) -> UInt32 {
    guard offset + 4 <= data.count else { return 0 }
    return data.subdata(in: offset..<(offset + 4)).withUnsafeBytes {
      UInt32(littleEndian: $0.load(as: UInt32.self))
    }
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
  }
}
