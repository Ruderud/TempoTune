import AppIntents
import Foundation

struct IncreaseBpmIntent: AppIntent {
  static var title: LocalizedStringResource = "Increase BPM"
  static var description: IntentDescription = "Increase metronome BPM by 1"

  func perform() async throws -> some IntentResult {
    let newBpm = min(MetronomeSharedState.bpm + 1, 300)
    MetronomeSharedState.updateBpmAndRefreshUI(newBpm)
    MetronomeSharedState.postAction(.increaseBpm)
    return .result()
  }
}

struct DecreaseBpmIntent: AppIntent {
  static var title: LocalizedStringResource = "Decrease BPM"
  static var description: IntentDescription = "Decrease metronome BPM by 1"

  func perform() async throws -> some IntentResult {
    let newBpm = max(MetronomeSharedState.bpm - 1, 20)
    MetronomeSharedState.updateBpmAndRefreshUI(newBpm)
    MetronomeSharedState.postAction(.decreaseBpm)
    return .result()
  }
}

struct IncreaseBpm10Intent: AppIntent {
  static var title: LocalizedStringResource = "Increase BPM by 10"
  static var description: IntentDescription = "Increase metronome BPM by 10"

  func perform() async throws -> some IntentResult {
    let newBpm = min(MetronomeSharedState.bpm + 10, 300)
    MetronomeSharedState.updateBpmAndRefreshUI(newBpm)
    MetronomeSharedState.postAction(.increaseBpm10)
    return .result()
  }
}

struct DecreaseBpm10Intent: AppIntent {
  static var title: LocalizedStringResource = "Decrease BPM by 10"
  static var description: IntentDescription = "Decrease metronome BPM by 10"

  func perform() async throws -> some IntentResult {
    let newBpm = max(MetronomeSharedState.bpm - 10, 20)
    MetronomeSharedState.updateBpmAndRefreshUI(newBpm)
    MetronomeSharedState.postAction(.decreaseBpm10)
    return .result()
  }
}

struct SetTimeSig2_4Intent: AppIntent {
  static var title: LocalizedStringResource = "Set 2/4 Time"
  static var description: IntentDescription = "Set time signature to 2/4"

  func perform() async throws -> some IntentResult {
    MetronomeSharedState.timeSignature = "2/4"
    MetronomeSharedState.refreshLiveActivities()
    MetronomeSharedState.postAction(.setTimeSig2_4)
    return .result()
  }
}

struct SetTimeSig3_4Intent: AppIntent {
  static var title: LocalizedStringResource = "Set 3/4 Time"
  static var description: IntentDescription = "Set time signature to 3/4"

  func perform() async throws -> some IntentResult {
    MetronomeSharedState.timeSignature = "3/4"
    MetronomeSharedState.refreshLiveActivities()
    MetronomeSharedState.postAction(.setTimeSig3_4)
    return .result()
  }
}

struct SetTimeSig4_4Intent: AppIntent {
  static var title: LocalizedStringResource = "Set 4/4 Time"
  static var description: IntentDescription = "Set time signature to 4/4"

  func perform() async throws -> some IntentResult {
    MetronomeSharedState.timeSignature = "4/4"
    MetronomeSharedState.refreshLiveActivities()
    MetronomeSharedState.postAction(.setTimeSig4_4)
    return .result()
  }
}

struct SetTimeSig6_8Intent: AppIntent {
  static var title: LocalizedStringResource = "Set 6/8 Time"
  static var description: IntentDescription = "Set time signature to 6/8"

  func perform() async throws -> some IntentResult {
    MetronomeSharedState.timeSignature = "6/8"
    MetronomeSharedState.refreshLiveActivities()
    MetronomeSharedState.postAction(.setTimeSig6_8)
    return .result()
  }
}

struct ToggleMetronomeIntent: AppIntent {
  static var title: LocalizedStringResource = "Toggle Metronome"
  static var description: IntentDescription = "Start or stop the metronome"

  func perform() async throws -> some IntentResult {
    MetronomeSharedState.postAction(.toggle)
    return .result()
  }
}
