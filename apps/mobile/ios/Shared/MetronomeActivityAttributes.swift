import ActivityKit
import Foundation

struct MetronomeAttributes: ActivityAttributes {
  struct ContentState: Codable, Hashable {
    var bpm: Int
    var isPlaying: Bool
    var timeSignature: String // "4/4"
  }
}
