import Foundation
import AVFoundation
import React

@objc(PitchDetectorModule)
class PitchDetectorModule: RCTEventEmitter {
  private var audioEngine: AVAudioEngine?
  private var isListening = false
  private let sampleRate: Double = 44100
  private let bufferSize: AVAudioFrameCount = 4096
  private let yinThreshold: Float = 0.15
  private let yinProbabilityThreshold: Float = 0.1
  private let referenceFrequency: Double = 440.0

  private let noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

  override static func requiresMainQueueSetup() -> Bool { false }

  override func supportedEvents() -> [String]! {
    ["onPitchDetected", "onPitchError"]
  }

  @objc func startListening() {
    guard !isListening else { return }

    let session = AVAudioSession.sharedInstance()
    do {
      try session.setCategory(.playAndRecord, mode: .measurement, options: [.defaultToSpeaker, .allowBluetooth])
      try session.setPreferredSampleRate(sampleRate)
      try session.setActive(true)
    } catch {
      sendEvent(withName: "onPitchError", body: ["message": error.localizedDescription])
      return
    }

    audioEngine = AVAudioEngine()
    guard let audioEngine = audioEngine else { return }

    let inputNode = audioEngine.inputNode
    let format = inputNode.outputFormat(forBus: 0)

    inputNode.installTap(onBus: 0, bufferSize: bufferSize, format: format) { [weak self] buffer, _ in
      self?.processAudioBuffer(buffer)
    }

    do {
      try audioEngine.start()
      isListening = true
    } catch {
      sendEvent(withName: "onPitchError", body: ["message": error.localizedDescription])
    }
  }

  @objc func stopListening() {
    guard isListening else { return }
    audioEngine?.inputNode.removeTap(onBus: 0)
    audioEngine?.stop()
    audioEngine = nil
    isListening = false
  }

  // MARK: - YIN Pitch Detection

  private func processAudioBuffer(_ buffer: AVAudioPCMBuffer) {
    guard let channelData = buffer.floatChannelData?[0] else { return }
    let frameCount = Int(buffer.frameLength)
    guard frameCount >= Int(bufferSize) else { return }

    let audioData = Array(UnsafeBufferPointer(start: channelData, count: Int(bufferSize)))
    guard let result = yinDetect(audioData) else { return }

    let note = frequencyToNote(result.frequency)

    sendEvent(withName: "onPitchDetected", body: [
      "frequency": result.frequency,
      "probability": result.probability,
      "name": note.name,
      "octave": note.octave,
      "cents": note.cents,
    ])
  }

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

    // Step 1: Difference function
    for tau in 0..<halfBuffer {
      for i in 0..<halfBuffer {
        let delta = audioData[i] - audioData[i + tau]
        yinBuffer[tau] += delta * delta
      }
    }

    // Step 2: Cumulative mean normalized difference
    yinBuffer[0] = 1
    var runningSum: Float = 0
    for tau in 1..<halfBuffer {
      runningSum += yinBuffer[tau]
      yinBuffer[tau] = (yinBuffer[tau] * Float(tau)) / runningSum
    }

    // Step 3: Absolute threshold
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

    // Step 4: Parabolic interpolation
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
}
