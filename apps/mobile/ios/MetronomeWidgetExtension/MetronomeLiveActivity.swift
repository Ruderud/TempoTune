import ActivityKit
import WidgetKit
import SwiftUI
import AppIntents

// MARK: - Reusable Components

private struct TimeSignatureButton<I: AppIntent>: View {
  let label: String
  let current: String
  let intent: I

  var isSelected: Bool { label == current }

  var body: some View {
    Button(intent: intent) {
      Text(label)
        .font(.system(size: 11, weight: .semibold))
        .foregroundStyle(isSelected ? .white : .white.opacity(0.4))
        .frame(maxWidth: .infinity)
        .padding(.vertical, 6)
        .background(isSelected ? .white.opacity(0.1) : .clear)
        .overlay(
          RoundedRectangle(cornerRadius: 8)
            .stroke(.white.opacity(isSelected ? 0.2 : 0.1), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
    .buttonStyle(.plain)
  }
}

private struct CircleControlButton<I: AppIntent, Label: View>: View {
  let intent: I
  @ViewBuilder let label: Label

  var body: some View {
    Button(intent: intent) {
      label
        .frame(width: 36, height: 36)
        .background(.white.opacity(0.05))
        .overlay(Circle().stroke(.white.opacity(0.1), lineWidth: 1))
        .clipShape(Circle())
    }
    .buttonStyle(.plain)
  }
}

struct MetronomeLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: MetronomeAttributes.self) { context in
      // MARK: - Lock Screen Banner
      VStack(spacing: 0) {
        // "TEMPO" label
        Text("TEMPO")
          .font(.system(size: 9, weight: .medium))
          .tracking(2)
          .foregroundStyle(.white.opacity(0.3))
          .padding(.bottom, 2)

        // BPM display
        HStack(alignment: .firstTextBaseline, spacing: 2) {
          Text("\(context.state.bpm)")
            .font(.system(size: 32, weight: .semibold))
            .tracking(-0.9)
            .monospacedDigit()
            .foregroundStyle(.white)
          Text("BPM")
            .font(.system(size: 17))
            .foregroundStyle(.white.opacity(0.4))
        }
        .padding(.bottom, 12)

        // Time signature selector
        HStack(spacing: 8) {
          TimeSignatureButton(label: "2/4", current: context.state.timeSignature, intent: SetTimeSig2_4Intent())
          TimeSignatureButton(label: "3/4", current: context.state.timeSignature, intent: SetTimeSig3_4Intent())
          TimeSignatureButton(label: "4/4", current: context.state.timeSignature, intent: SetTimeSig4_4Intent())
          TimeSignatureButton(label: "6/8", current: context.state.timeSignature, intent: SetTimeSig6_8Intent())
        }
        .padding(.bottom, 14)

        // Controls row
        HStack(spacing: 0) {
          CircleControlButton(intent: DecreaseBpm10Intent()) {
            Text("-10")
              .font(.system(size: 10, weight: .bold))
              .foregroundStyle(.white.opacity(0.8))
          }

          Spacer(minLength: 0)

          CircleControlButton(intent: DecreaseBpmIntent()) {
            Image(systemName: "minus")
              .font(.system(size: 12, weight: .medium))
              .foregroundStyle(.white.opacity(0.8))
          }

          Spacer(minLength: 0)

          Button(intent: ToggleMetronomeIntent()) {
            Image(systemName: context.state.isPlaying ? "pause.fill" : "play.fill")
              .font(.system(size: 15, weight: .semibold))
              .foregroundStyle(.black)
              .frame(maxWidth: .infinity)
              .frame(height: 44)
              .background(.white)
              .clipShape(Capsule())
          }
          .buttonStyle(.plain)

          Spacer(minLength: 0)

          CircleControlButton(intent: IncreaseBpmIntent()) {
            Image(systemName: "plus")
              .font(.system(size: 12, weight: .medium))
              .foregroundStyle(.white.opacity(0.8))
          }

          Spacer(minLength: 0)

          CircleControlButton(intent: IncreaseBpm10Intent()) {
            Text("+10")
              .font(.system(size: 10, weight: .bold))
              .foregroundStyle(.white.opacity(0.8))
          }
        }
      }
      .padding(.horizontal, 20)
      .padding(.vertical, 16)
      .activityBackgroundTint(Color(red: 20/255, green: 24/255, blue: 26/255).opacity(0.85))
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
