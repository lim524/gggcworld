# Four commander idle animations

Astra, Serin, Lumi and Nox use four-frame 2 x 2 sheets, all 1254 x 1254 with 627px cells. The three new generated assets preserve their reference designs and alpha transparency, encoded as quality-90 WebP for the website. Original generation outputs are retained separately from runtime assets. WebP encoding is lossy for colour, with alpha preserved.

## Runtime assets

- public/assets/serin-idle-v1.webp
- public/assets/lumi-idle-v1.webp
- public/assets/nox-idle-v1.webp

`public/astra.js` defines the backward-compatible `<astra-sprite>` and reusable `<faction-sprite faction="serin">`. Each faction's sheet is loaded and decoded once, on first use. The canvas uses measured frame anchors and one fixed scale per character. Frames are idle, inhale, blink, settle (1500/600/140/600ms). Animation sleeps offscreen and in hidden tabs and initializes paused for reduced motion. The map's motion button controls all four map sprites. Browser-local profile selection updates the floating commander; map selection only previews dialogue.

The hero, world map, and floating commander use these assets. `/sprite-lab.html?faction=serin` (also lumi/nox/astra) supports character selection, individual frames, speed, and light/dark backgrounds.

## Generation method and prompts

Built-in image generation, one reference-based transparent sheet per character. Shared prompt: create one square transparent four-frame sheet in an exact 2x2 grid, full body in each cell; match the reference character, costume, accessories and pixel art style; front-facing fixed pose and scale; neutral, subtle inhale, eyes-closed blink, relaxed neutral; planted feet and ample transparent gutters; no labels, dividers, ground shadow, painted checkerboard or cropping.

- Serin: preserve peach-blond long hair, amber eyes, orange/gold ornaments and ring, orange/white/black/gold scholar outfit and book.
- Lumi: preserve pale silver-blue hair, blue eyes and round ornaments/headphones, halo, white/navy/gold outfit, blue boots and digital magic staff.
- Nox: preserve silver-lavender hair, pink-purple eyes, black/magenta futuristic outfit, dark boots, headphones and asymmetrical accessories.

Generated details differ slightly between frames, including some hair and clothing. These remain reviewable idle animation drafts, not hand-authored walking cycles.

## Validation

JS syntax checks passed. Desktop browser QA verified all three character selections in the lab, explicit blink-frame controls for Serin and Nox, four map canvas sprites, faction dialogue selection and the map pause control. No website-origin console errors were observed. New mobile-device verification and Cloudflare deployment success have not been confirmed.


## V2: eight-frame idle loops

Default playback now uses `public/assets/{astra,serin,lumi,nox}-idle-v2.webp`. V1 assets and player configuration are retained. The lab offers 4-frame and 8-frame versions (`version=1` or `version=2`) for each character. Website playback defaults to V2.

Eight states: neutral, inhale, inhale peak, exhale, half-closed eyes, closed eyes, half-open eyes, neutral. Frame durations are 1100, 180, 220, 220, 65, 95, 65, 550 milliseconds; the blink sequence stays short and the neutral poses hold longer. Frame count, manual controls, labels, and wraparound derive from the selected sheet.

The sheets are new consistent eight-frame variants based on each V1 sheet. They do not splice newly generated art between the old four frames. Astra and Serin use a 4x2 landscape layout; Nox uses a 4x2 square layout; Lumi uses a 2x4 portrait layout to keep the staff and floating companion separated. Runtime source rectangles follow measured transparent gutters rather than assuming an integer grid. All frames have measured foot anchors and per-frame scales to hold a common foot baseline and figure height. This reduces positional jitter but cannot eliminate differences in generated hair, face or clothing details.

Production prompt additions: exactly eight full-body frames, preserve existing character and costume, fixed pose and feet, no leaning or jumping; tiny breathing and hair-tip changes; neutral/inhale/peak/exhale/half-close/blink/half-open/neutral sequence; true transparency and generous gutters. Lumi was regenerated in portrait 2x4 after the landscape attempt overlapped accessories. New sheets were generated with the built-in image tool and encoded as quality-85 WebP with alpha preserved. Originals remain unchanged.
