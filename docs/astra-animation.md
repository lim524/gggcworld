# Astra idle animation pilot

## Asset

- File: public/assets/astra-idle-v1.webp
- Built-in image generation was used with the user-provided Astra reference sheet.
- RGBA PNG, 1254 × 1254, exact 2 × 2 layout; each source cell is 627 × 627.
- Original generated alpha is preserved. No background reconstruction or palette edits.
- Frames: neutral, inhale, eyes closed, neutral settling.
- One shared image is decoded and reused by the page's sprite elements.

## Production prompt / constraints

Create exactly one transparent four-frame idle pixel sprite sheet in a 2 × 2 equal-cell grid, based on the small chibi Astra sprite in the provided reference. Preserve silver-white mint-tinted long hair, green eyes, gold halo with a star, green-and-gold headphones, white/emerald/gold mage coat, boots, and small magic book. Crisp low-resolution chibi pixel style. Four subtle states in reading order: neutral eyes open, tiny inhale with hair lift, gentle blink eyes closed, neutral hair settling. Same front-facing angle and scale, feet planted, no walking. Generous transparent gutters, no text, no dividers, no painted checkerboard, no ground plane or shadows.

## Playback

public/astra.js defines the reusable <astra-sprite> element. It draws one source cell at a time to a canvas. Frame-specific foot anchors measured from alpha correct the source sheet's horizontal and vertical displacement. This is real four-frame playback, not a single static image bobbing in CSS.

Frame times: 1500 ms, 600 ms, 140 ms, 600 ms. The blink is deliberately shorter than the idle poses. The image has subtle generated detail differences between poses; the pilot is for visual review, not a final hand-retouched game sprite.

Animation pauses offscreen and when the page is hidden, and initializes paused for prefers-reduced-motion. The lab allows manual playback, frame selection, background changes, and playback speed. The floating companion can be collapsed or paused. No API calls are used.

## Where to review

- / : community banner and bottom-right pilot companion
- /sprite-lab.html : larger animation and frame comparison controls

Only Astra is animated in this pilot. This does not alter the selected faction, authentication, or inventory. The floating pilot is explicitly labeled as a test. The permanent faction decision for real accounts remains a separate planned server feature.
