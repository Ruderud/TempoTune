# TempoTune Web Landing Design

## Design intent

A precise, calm practice instrument for musicians. The page should feel like a modern studio tool: purposeful, measured, and technically credible. Avoid generic SaaS gradients, loud marketing claims, stock photography, glass everywhere, or fake platform badges.

## Brand

- Product: TempoTune
- Mark: use the existing dark rounded-square app icon with a teal metronome needle.
- Voice: concise Korean, factual, encouraging without hype.
- Primary action: open the web metronome.
- Secondary action: open the web tuner.

## Color tokens

Light:

- primary `#1d7874`
- canvas `#fcfaf3`
- deep canvas `#f4f1de`
- surface `#ffffff`
- strong text `#071e22`
- secondary text `#355763`
- muted text `#61767e`
- border `#cad7d3`

Dark:

- primary `#58b09c`
- canvas `#0c252b`
- deep canvas `#071e22`
- surface `#16323f`
- strong text `#f4f1de`
- secondary text `#cfe8e6`
- muted text `#90aba8`
- border `#274857`

Use teal as the only decorative accent. Use warm ivory and deep blue-green for contrast.

## Typography

- Space Grotesk for brand, Latin labels, and large measurements.
- Noto Sans KR fallback for Korean.
- Hero: 72px desktop / 44px mobile, 1.05 line height, tight tracking.
- Section headings: 48px desktop / 34px mobile.
- Body: 16–18px with relaxed line height.
- Smallest visible text: 12px.
- Keep Korean words intact; never split a syllabic word across lines.

## Layout

- Maximum content width 1240px.
- Desktop hero: two columns, copy on the left and a product interface composition on the right.
- Mobile hero: one column; show the interface composition below CTAs.
- Large section rhythm: 120–144px desktop, 80–96px mobile.
- Cards: 20–28px radius, thin border, minimal shadow.
- All primary touch targets at least 44px.

## Landing structure

1. Sticky header with brand, Features, Accuracy, and Open app.
2. Hero with eyebrow “Precision practice tools”, Korean headline, two real CTAs, and a dual metronome/tuner UI preview.
3. Proof rail: 6-hour metronome drift regression, 35–1400Hz tuner range, 5-cent in-tune contract.
4. Four tool cards: metronome, tuner, rhythm practice, settings.
5. Accuracy section explaining absolute scheduling and low-note detection in plain Korean.
6. Final web CTA and minimal footer with only real links.

## Product preview

Build with HTML/CSS rather than a stock image. Use a dark instrument panel containing:

- a metronome panel with “120 BPM”, 4/4 beat dots, a teal play control, and subtle timing ticks;
- a tuner panel with “A4”, “440.0 Hz”, a centered teal needle, and a -50 / 0 / +50 scale;
- small status labels such as “LIVE” and “IN TUNE”.

It must resemble the actual operational UI without implying unavailable controls.

## Icons

- Use the existing app icon for the logo.
- Use Lucide only for interface and feature icons.
- Absolute 2px stroke, rounded line style, 20/24px default.
- Mapping: Timer = metronome, AudioLines = tuner, Activity = rhythm, SlidersHorizontal = settings.
- No platform brand icons, social icons, emoji, or mixed filled/outline families.

## Content constraints

Use only verified claims:

- four current tools: metronome, tuner, rhythm practice, settings;
- web and iOS/Android hybrid architecture;
- metronome 123 BPM / 6-hour regression with less than 0.001ms accumulated phase error;
- tuner 35–1400Hz analysis range and 5-cent acceptance contract.

Do not mention pricing, login, cloud sync, one million users, desktop native apps, app stores, polyrhythm, or a 0.1-cent guarantee.

## Accessibility and motion

- Visible `:focus-visible` ring using primary.
- Semantic headings, links, and labels.
- Contrast targets WCAG AA.
- Reduce decorative motion under `prefers-reduced-motion`.
- No horizontal overflow at 390px.
