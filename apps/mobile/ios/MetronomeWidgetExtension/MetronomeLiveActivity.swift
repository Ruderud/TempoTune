import ActivityKit
import WidgetKit
import SwiftUI
import AppIntents

private struct TimeSignatureButton<I: AppIntent>: View {
  let label: String
  let current: String
  let intent: I

  var isSelected: Bool { label == current }

  var body: some View {
    Button(intent: intent) {
      Text(label)
        .font(.system(size: 13, weight: isSelected ? .bold : .medium, design: .rounded))
        .frame(width: 36, height: 28)
        .background(isSelected ? .white.opacity(0.3) : .white.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 6))
    }
    .buttonStyle(.plain)
  }
}

struct MetronomeLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: MetronomeAttributes.self) { context in
      // MARK: - Lock Screen Banner
      VStack(spacing: 10) {
        HStack(spacing: 12) {
          // BPM display
          VStack(alignment: .leading, spacing: 2) {
            Text("\(context.state.bpm)")
              .font(.system(size: 36, weight: .bold, design: .rounded))
              .monospacedDigit()
            Text("BPM")
              .font(.caption)
              .foregroundStyle(.secondary)
          }

          Spacer()

          // Controls: -10 -1 ▶/⏸ +1 +10
          HStack(spacing: 6) {
            Button(intent: DecreaseBpm10Intent()) {
              Text("-10")
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .frame(width: 36, height: 32)
                .background(.white.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }
            .buttonStyle(.plain)

            Button(intent: DecreaseBpmIntent()) {
              Image(systemName: "minus")
                .font(.system(size: 14, weight: .semibold))
                .frame(width: 32, height: 32)
                .background(.white.opacity(0.12))
                .clipShape(Circle())
            }
            .buttonStyle(.plain)

            Button(intent: ToggleMetronomeIntent()) {
              Image(systemName: context.state.isPlaying ? "pause.fill" : "play.fill")
                .font(.system(size: 16))
                .frame(width: 38, height: 38)
                .background(.white.opacity(0.2))
                .clipShape(Circle())
            }
            .buttonStyle(.plain)

            Button(intent: IncreaseBpmIntent()) {
              Image(systemName: "plus")
                .font(.system(size: 14, weight: .semibold))
                .frame(width: 32, height: 32)
                .background(.white.opacity(0.12))
                .clipShape(Circle())
            }
            .buttonStyle(.plain)

            Button(intent: IncreaseBpm10Intent()) {
              Text("+10")
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .frame(width: 36, height: 32)
                .background(.white.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }
            .buttonStyle(.plain)
          }
        }

        // Time signature selector
        HStack(spacing: 6) {
          TimeSignatureButton(label: "2/4", current: context.state.timeSignature, intent: SetTimeSig2_4Intent())
          TimeSignatureButton(label: "3/4", current: context.state.timeSignature, intent: SetTimeSig3_4Intent())
          TimeSignatureButton(label: "4/4", current: context.state.timeSignature, intent: SetTimeSig4_4Intent())
          TimeSignatureButton(label: "6/8", current: context.state.timeSignature, intent: SetTimeSig6_8Intent())
          Spacer()
        }
      }
      .padding(.horizontal, 20)
      .padding(.vertical, 16)
      .activityBackgroundTint(.black.opacity(0.7))
      .activitySystemActionForegroundColor(.white)

    } dynamicIsland: { context in
      DynamicIsland {
        // MARK: - Expanded Region
        DynamicIslandExpandedRegion(.leading) {
          VStack(alignment: .leading, spacing: 2) {
            Text("\(context.state.bpm)")
              .font(.system(size: 32, weight: .bold, design: .rounded))
              .monospacedDigit()
            Text("BPM")
              .font(.caption2)
              .foregroundStyle(.secondary)
          }
          .padding(.leading, 4)
        }

        DynamicIslandExpandedRegion(.trailing) {
          HStack(spacing: 6) {
            Button(intent: DecreaseBpmIntent()) {
              Image(systemName: "minus.circle.fill")
                .font(.title3)
            }
            .buttonStyle(.plain)

            Button(intent: ToggleMetronomeIntent()) {
              Image(systemName: context.state.isPlaying ? "pause.circle.fill" : "play.circle.fill")
                .font(.title2)
            }
            .buttonStyle(.plain)

            Button(intent: IncreaseBpmIntent()) {
              Image(systemName: "plus.circle.fill")
                .font(.title3)
            }
            .buttonStyle(.plain)
          }
          .padding(.trailing, 4)
        }

        DynamicIslandExpandedRegion(.bottom) {
          Text(context.state.timeSignature)
            .font(.caption)
            .foregroundStyle(.secondary)
        }
      } compactLeading: {
        // MARK: - Compact Leading: BPM number
        Text("\(context.state.bpm)")
          .font(.system(.body, design: .rounded, weight: .bold))
          .monospacedDigit()
      } compactTrailing: {
        // MARK: - Compact Trailing: Play state icon
        Image(systemName: context.state.isPlaying ? "metronome.fill" : "metronome")
          .font(.body)
      } minimal: {
        // MARK: - Minimal: BPM number only
        Text("\(context.state.bpm)")
          .font(.system(.caption, design: .rounded, weight: .bold))
          .monospacedDigit()
      }
    }
  }
}
