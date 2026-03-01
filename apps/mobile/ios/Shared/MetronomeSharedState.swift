import ActivityKit
import Foundation

/// Shared state between main app and widget extension via App Groups.
/// Widget intents write pending actions here, then post a Darwin notification
/// so the main app's MetronomeModule picks them up.
enum MetronomeSharedState {
  static let suiteName = "group.com.rud.tempotune"
  private static let bpmKey = "metronome_bpm"
  private static let isPlayingKey = "metronome_isPlaying"
  private static let timeSignatureKey = "metronome_timeSignature"
  private static let pendingActionKey = "metronome_pendingAction"
  static let darwinNotificationName = "com.rud.tempotune.metronome.action" as CFString

  enum Action: String {
    case increaseBpm       // +1
    case decreaseBpm       // -1
    case increaseBpm10     // +10
    case decreaseBpm10     // -10
    case toggle
    case setTimeSig2_4
    case setTimeSig3_4
    case setTimeSig4_4
    case setTimeSig6_8
  }

  static var defaults: UserDefaults? {
    UserDefaults(suiteName: suiteName)
  }

  static var bpm: Int {
    get { defaults?.integer(forKey: bpmKey).nonZero ?? 120 }
    set { defaults?.set(newValue, forKey: bpmKey) }
  }

  static var isPlaying: Bool {
    get { defaults?.bool(forKey: isPlayingKey) ?? false }
    set { defaults?.set(newValue, forKey: isPlayingKey) }
  }

  static var timeSignature: String {
    get { defaults?.string(forKey: timeSignatureKey) ?? "4/4" }
    set { defaults?.set(newValue, forKey: timeSignatureKey) }
  }

  /// Write a pending action and notify the main app via Darwin notification center.
  static func postAction(_ action: Action) {
    defaults?.set(action.rawValue, forKey: pendingActionKey)
    defaults?.synchronize()
    CFNotificationCenterPostNotification(
      CFNotificationCenterGetDarwinNotifyCenter(),
      CFNotificationName(darwinNotificationName),
      nil, nil, true
    )
  }

  /// Consume the pending action (returns nil if none).
  static func consumeAction() -> Action? {
    guard let raw = defaults?.string(forKey: pendingActionKey) else { return nil }
    defaults?.removeObject(forKey: pendingActionKey)
    return Action(rawValue: raw)
  }

  /// Update BPM in shared state and immediately refresh all Live Activities.
  /// Called from App Intents to bypass the Darwin notification round-trip for UI updates.
  static func updateBpmAndRefreshUI(_ newBpm: Int) {
    bpm = newBpm
    defaults?.synchronize()
    refreshLiveActivities()
  }

  /// Refresh all running Live Activities with current shared state.
  static func refreshLiveActivities() {
    let state = MetronomeAttributes.ContentState(
      bpm: bpm,
      isPlaying: isPlaying,
      timeSignature: timeSignature
    )
    let content = ActivityContent(state: state, staleDate: nil)
    Task {
      for activity in Activity<MetronomeAttributes>.activities {
        await activity.update(content)
      }
    }
  }
}

private extension Int {
  /// Returns self if non-zero, otherwise nil (for UserDefaults default-value handling).
  var nonZero: Int? { self == 0 ? nil : self }
}
