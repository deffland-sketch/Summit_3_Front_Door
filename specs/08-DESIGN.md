# Spec 8: Design

Summit 3.0 Front Door · Working draft v1 · October 20, 2026

The front door should feel like Summit's own: calm, warm, clear on a phone. It is a student's page first. Nothing on it reads as a dashboard to be managed.

## Brand Tokens

| Token | Hex | Use |
|---|---|---|
| indigo | #4b4b96 | Primary, headings, the pathway line |
| teal | #508278 | Headings (alternate), practice and feedback, positive flags |
| orange | #f6aa40 | Highlights, guidance, calls to action |
| peach | #ffd2b4 | Soft backgrounds |
| light-blue | #96d2dc | Independent work, accents |
| brown | #503c2d | Dark sections, high-contrast panels |
| red | #e6553c | Presentation and performance; sparingly for alerts |
| tan-grey | #96a0ab | Wellbeing and community, neutral |
| mint | #ebf5f0 | Section backgrounds |
| black, white | #000000, #ffffff | Body text; text on dark |

Tints from the brand guide (two per color) are allowed for alternating rows and subtle backgrounds, never for text on white. Never pair red with teal, tan grey, or light blue; light blue with orange or tan grey; brown with indigo.

## Experience Type Colors (Fixed)

| Type | Color |
|---|---|
| DI Direct instruction | indigo |
| PF Practice and feedback | teal |
| DD Discussion and dialogue | orange |
| IW Independent work and creation | light-blue |
| PP Presentation and performance | red |
| RG Reflection and goal-setting | peach (with brown text) |
| RW Real-world experience | brown |
| WC Wellbeing and community | tan-grey |

Each slot card carries its type color as a 4px left edge and a small label. Protected time is a solid tan-grey tint with no type label.

## Typography

Arimo from Google Fonts, with a system sans fallback. Arimo Bold for headings and screen titles in title case, teal or indigo. Arimo Regular for body in black, sentence case. No all-caps, no letter-spacing, no gradients or effects on type. Base 16px on phone, 17px on desktop; line height 1.5.

## Layout

- Phone first. The student's Today is a single column of slot cards with the current slot pinned at top. My Week is five narrow columns on desktop, a swipeable day on phone.
- Adult screens are two-pane on desktop (list, detail) and stacked on phone.
- Max content width 1100px. 8px spacing scale. Cards with 12px radius, 1px black at 8% border, no shadows heavier than 1px.
- Dark mode via prefers-color-scheme and a student toggle; tokens redefined under `[data-theme="dark"]`.

## Accessibility

- Every interactive element has an accessible name. Color never carries meaning alone: the type label and the entry word (Required, Recommended, Your choice) are always present.
- Reduced motion respected; no motion essential to understanding.
- Text size setting (default, large, larger) scales the whole app.
- Keyboard reachable throughout; focus visible in orange.
- Spanish strings live alongside English with the same keys.

## Voice in the Interface

- Second person, plain words: "Where to be now," "Why this is yours," "What moved today."
- Asset language only. Flags read "Needs a nudge," "Ready for validation," "Grew this week." Never "behind," "failing," "at risk."
- One line of why on every placed slot, written as a sentence a student would say to a friend.
- No em-dashes. No "not X but Y."

## Components to Build Once

SlotCard, WeekGrid, OutcomeBand (score against level expectation as a band), EvidenceList, LessonMap, TouchpointChip, FlagDot, OfferingPicker (ranked options), WhyLine, ProtectedBlock, DisplayBoard (large type, rooms only), SandboxControls (the demo driver's panel).
