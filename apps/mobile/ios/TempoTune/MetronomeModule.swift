import Foundation
import AVFoundation
import ActivityKit
import React

@objc(MetronomeModule)
class MetronomeModule: RCTEventEmitter {

  // MARK: - Singleton (for App Intents access)

  static var instance: MetronomeModule?

  // MARK: - State

  private var audioEngine: AVAudioEngine?
  private var sourceNode: AVAudioSourceNode?
  private var isPlaying = false
  private var bpm: Double = 120
  private var beatsPerMeasure: Int = 4
  private var beatDenominator: Int = 4
  private var accentFirst: Bool = true
  private var currentBeat: Int = 0
  private var lastBeatAtMonotonicMs: Double = 0

  // MARK: - Audio render state (accessed from audio thread)

  private let sampleRate: Double = 44100
  private let toneDuration: Double = 0.05 // 50ms sine wave
  private var sampleTime: Int64 = 0
  private var samplesPerBeat: Int64 = 0
  private var nextBeatAt: Int64 = 0
  private var beatCounter: Int = 0

  // Pre-rendered tone buffers
  private var accentTone: [Float] = []
  private var normalTone: [Float] = []

  // MARK: - Live Activity

  private var currentActivity: Activity<MetronomeAttributes>?

  // MARK: - RCTEventEmitter

  private var hasListeners = false

  override static func requiresMainQueueSetup() -> Bool { false }

  override init() {
    super.init()
    Self.instance = self
    observeDarwinNotifications()
    observeAudioInterruptions()
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleAppWillEnterForeground),
      name: UIApplication.willEnterForegroundNotification,
      object: nil
    )
  }

  override func supportedEvents() -> [String]! {
    ["onMetronomeTick", "onMetronomeStateChanged"]
  }

  override func startObserving() { hasListeners = true }
  override func stopObserving() { hasListeners = false }

  var isCurrentlyPlayingForRhythm: Bool { isPlaying }
  var currentBpmForRhythm: Double { bpm }
  var currentBeatsPerMeasureForRhythm: Int { beatsPerMeasure }
  var currentBeatAtMonotonicMsForRhythm: Double { lastBeatAtMonotonicMs }

  // MARK: - Exported Methods

  @objc func start(_ bpm: Double, beatsPerMeasure: Int, accentFirst: Bool) {
    self.bpm = bpm
    self.beatsPerMeasure = beatsPerMeasure
    self.accentFirst = accentFirst
    self.currentBeat = 0
    self.sampleTime = 0
    self.nextBeatAt = 0
    self.beatCounter = 0
    self.samplesPerBeat = Int64(sampleRate * 60.0 / bpm)

    preRenderTones()
    setupAudioSession()
    setupAudioEngine()

    isPlaying = true
    startLiveActivity()
    emitStateChanged()
  }

  @objc func stop() {
    teardownAudioEngine()

    isPlaying = false
    currentBeat = 0

    endLiveActivity()
    emitStateChanged()
  }

  @objc func setBpm(_ bpm: Double) {
    self.bpm = bpm
    self.samplesPerBeat = Int64(sampleRate * 60.0 / bpm)
    if isPlaying {
      updateLiveActivity()
    }
    emitStateChanged()
  }

  @objc func setTimeSignature(_ beatsPerMeasure: Int) {
    self.beatsPerMeasure = beatsPerMeasure
    self.currentBeat = 0
    if isPlaying {
      updateLiveActivity()
    }
  }

  // MARK: - Pre-render tone buffers

  private func preRenderTones() {
    let frames = Int(sampleRate * toneDuration)
    let fadeSamples = Int(sampleRate * 0.005)
    accentTone = renderTone(freq: 1000.0, frames: frames, fadeSamples: fadeSamples)
    normalTone = renderTone(freq: 800.0, frames: frames, fadeSamples: fadeSamples)
  }

  private func renderTone(freq: Double, frames: Int, fadeSamples: Int) -> [Float] {
    var buf = [Float](repeating: 0, count: frames)
    for i in 0..<frames {
      let envelope: Float
      if i < fadeSamples {
        envelope = Float(i) / Float(fadeSamples)
      } else if i > frames - fadeSamples {
        envelope = Float(frames - i) / Float(fadeSamples)
      } else {
        envelope = 1.0
      }
      buf[i] = Float(sin(2.0 * .pi * freq * Double(i) / sampleRate)) * 0.8 * envelope
    }
    return buf
  }

  // MARK: - Audio Session

  private func setupAudioSession() {
    let session = AVAudioSession.sharedInstance()
    do {
      let currentCategory = session.category
      if currentCategory == .playAndRecord {
        try session.setActive(true)
      } else {
        try session.setCategory(.playback, mode: .default, options: [])
        try session.setActive(true)
      }
    } catch {
      NSLog("[MetronomeModule] Audio session error: \(error.localizedDescription)")
    }
  }

  // MARK: - Audio Engine (AVAudioSourceNode render callback)

  private func setupAudioEngine() {
    teardownAudioEngine()

    let engine = AVAudioEngine()
    let format = AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 1)!

    let node = AVAudioSourceNode(format: format) { [weak self] _, _, frameCount, bufferList -> OSStatus in
      guard let self = self else { return noErr }

      let ablPointer = UnsafeMutableAudioBufferListPointer(bufferList)
      guard let data = ablPointer[0].mData?.assumingMemoryBound(to: Float.self) else { return noErr }

      let frames = Int(frameCount)
      let spb = self.samplesPerBeat
      let bpMeasure = self.beatsPerMeasure
      let accent = self.accentFirst
      let toneLen = self.accentTone.count

      guard spb > 0, toneLen > 0 else {
        for i in 0..<frames { data[i] = 0.0 }
        return noErr
      }

      var newBeatDetected = false
      var detectedBeatIndex = 0
      var detectedIsAccent = false

      for i in 0..<frames {
        let cs = self.sampleTime + Int64(i)

        // Advance beats while current sample is past the next beat boundary
        while cs >= self.nextBeatAt + spb {
          self.nextBeatAt += spb
          self.beatCounter += 1
        }

        let posInTone = Int(cs - self.nextBeatAt)
        if posInTone >= 0 && posInTone < toneLen {
          let beatIdx = self.beatCounter % bpMeasure
          let isAcc = accent && beatIdx == 0
          data[i] = isAcc ? self.accentTone[posInTone] : self.normalTone[posInTone]

          if posInTone == 0 {
            newBeatDetected = true
            detectedBeatIndex = beatIdx
            detectedIsAccent = isAcc
          }
        } else {
          data[i] = 0.0
        }
      }

      self.sampleTime += Int64(frames)

      if newBeatDetected {
        let beatIdx = detectedBeatIndex
        let isAcc = detectedIsAccent
        DispatchQueue.main.async { [weak self] in
          guard let self = self else { return }
          self.currentBeat = beatIdx
          self.emitTick(beatIndex: beatIdx, isAccent: isAcc)
        }
      }

      return noErr
    }

    engine.attach(node)
    engine.connect(node, to: engine.mainMixerNode, format: format)

    do {
      try engine.start()
    } catch {
      NSLog("[MetronomeModule] Engine start error: \(error.localizedDescription)")
    }

    sourceNode = node
    audioEngine = engine
  }

  private func teardownAudioEngine() {
    audioEngine?.stop()
    if let node = sourceNode {
      audioEngine?.detach(node)
    }
    sourceNode = nil
    audioEngine = nil
  }

  // MARK: - Tick Emission

  private func emitTick(beatIndex: Int, isAccent: Bool) {
    guard hasListeners else { return }
    let beatAtMonotonicMs = Self.monotonicNowMs()
    lastBeatAtMonotonicMs = beatAtMonotonicMs
    sendEvent(withName: "onMetronomeTick", body: [
      "beatIndex": beatIndex,
      "isAccent": isAccent,
      "timestamp": beatAtMonotonicMs,
      "beatAtMonotonicMs": beatAtMonotonicMs,
    ])
  }

  private static func monotonicNowMs() -> Double {
    var info = mach_timebase_info_data_t()
    mach_timebase_info(&info)
    let nanos = mach_absolute_time() * UInt64(info.numer) / UInt64(info.denom)
    return Double(nanos) / 1_000_000.0
  }

  // MARK: - Live Activity (ActivityKit)

  private func startLiveActivity() {
    guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }

    let attributes = MetronomeAttributes()
    let state = MetronomeAttributes.ContentState(
      bpm: Int(bpm),
      isPlaying: true,
      timeSignature: "\(beatsPerMeasure)/\(beatDenominator)"
    )

    do {
      let content = ActivityContent(state: state, staleDate: nil)
      currentActivity = try Activity.request(
        attributes: attributes,
        content: content,
        pushType: nil
      )
    } catch {
      NSLog("[MetronomeModule] Live Activity start error: \(error.localizedDescription)")
    }
  }

  private func updateLiveActivity() {
    guard let activity = currentActivity else { return }
    let state = MetronomeAttributes.ContentState(
      bpm: Int(bpm),
      isPlaying: isPlaying,
      timeSignature: "\(beatsPerMeasure)/\(beatDenominator)"
    )
    Task {
      let content = ActivityContent(state: state, staleDate: nil)
      await activity.update(content)
    }
  }

  private func endLiveActivity() {
    guard let activity = currentActivity else { return }
    let state = MetronomeAttributes.ContentState(
      bpm: Int(bpm),
      isPlaying: false,
      timeSignature: "\(beatsPerMeasure)/\(beatDenominator)"
    )
    Task {
      let content = ActivityContent(state: state, staleDate: nil)
      await activity.end(content, dismissalPolicy: .immediate)
    }
    currentActivity = nil
  }

  // MARK: - Event Emission

  private func emitStateChanged() {
    syncToSharedState()
    if hasListeners {
      sendEvent(withName: "onMetronomeStateChanged", body: [
        "isPlaying": isPlaying,
        "bpm": bpm,
        "beatsPerMeasure": beatsPerMeasure,
      ])
    }
  }

  // MARK: - Shared State Sync (App Groups)

  private func syncToSharedState() {
    MetronomeSharedState.bpm = Int(bpm)
    MetronomeSharedState.isPlaying = isPlaying
    MetronomeSharedState.timeSignature = "\(beatsPerMeasure)/\(beatDenominator)"
  }

  // MARK: - Darwin Notification Observer (Widget → Main App IPC)

  private func observeDarwinNotifications() {
    let center = CFNotificationCenterGetDarwinNotifyCenter()
    let observer = Unmanaged.passUnretained(self).toOpaque()
    CFNotificationCenterAddObserver(
      center,
      observer,
      { _, observer, _, _, _ in
        guard let observer = observer else { return }
        let module = Unmanaged<MetronomeModule>.fromOpaque(observer).takeUnretainedValue()
        module.handleWidgetAction()
      },
      MetronomeSharedState.darwinNotificationName,
      nil,
      .deliverImmediately
    )
  }

  private func handleWidgetAction() {
    guard let action = MetronomeSharedState.consumeAction() else { return }
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }
      switch action {
      case .increaseBpm:
        self.setBpm(min(self.bpm + 1, 300))
      case .decreaseBpm:
        self.setBpm(max(self.bpm - 1, 20))
      case .increaseBpm10:
        self.setBpm(min(self.bpm + 10, 300))
      case .decreaseBpm10:
        self.setBpm(max(self.bpm - 10, 20))
      case .toggle:
        if self.isPlaying {
          self.stop()
        } else {
          self.start(self.bpm, beatsPerMeasure: self.beatsPerMeasure, accentFirst: self.accentFirst)
        }
      case .setTimeSig2_4:
        self.beatDenominator = 4
        self.setTimeSignature(2)
        self.emitStateChanged()
      case .setTimeSig3_4:
        self.beatDenominator = 4
        self.setTimeSignature(3)
        self.emitStateChanged()
      case .setTimeSig4_4:
        self.beatDenominator = 4
        self.setTimeSignature(4)
        self.emitStateChanged()
      case .setTimeSig6_8:
        self.beatDenominator = 8
        self.setTimeSignature(6)
        self.emitStateChanged()
      }
    }
  }

  // MARK: - Audio Session Interruption Handling

  private func observeAudioInterruptions() {
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleAudioInterruption),
      name: AVAudioSession.interruptionNotification,
      object: nil
    )
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleMediaServicesReset),
      name: AVAudioSession.mediaServicesWereResetNotification,
      object: nil
    )
  }

  @objc private func handleAudioInterruption(notification: Notification) {
    guard let info = notification.userInfo,
          let typeValue = info[AVAudioSessionInterruptionTypeKey] as? UInt,
          let type = AVAudioSession.InterruptionType(rawValue: typeValue) else { return }

    switch type {
    case .began:
      NSLog("[MetronomeModule] Audio interruption began")
    case .ended:
      guard let optionsValue = info[AVAudioSessionInterruptionOptionKey] as? UInt else { return }
      let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
      if options.contains(.shouldResume) && isPlaying {
        NSLog("[MetronomeModule] Resuming after interruption")
        setupAudioSession()
        setupAudioEngine()
      }
    @unknown default:
      break
    }
  }

  @objc private func handleAppWillEnterForeground(notification: Notification) {
    // Re-sync state to WebView when app returns to foreground
    // (BPM/time signature may have changed via Live Activity while in background)
    // Small delay to ensure WebView is ready to receive messages
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { [weak self] in
      self?.emitStateChanged()
    }
  }

  @objc private func handleMediaServicesReset(notification: Notification) {
    NSLog("[MetronomeModule] Media services reset")
    if isPlaying {
      setupAudioSession()
      setupAudioEngine()
    }
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
    let center = CFNotificationCenterGetDarwinNotifyCenter()
    CFNotificationCenterRemoveEveryObserver(center, Unmanaged.passUnretained(self).toOpaque())
  }
}
