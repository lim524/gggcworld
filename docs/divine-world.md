# Four gods and 32-frame idle loops

The community keeps familiar board, post, comment and profile labels. The visitor
is a traveler and the faction mascot is a friendly, equal guardian deity.

| ID | Deity | Prop | Faction color |
| --- | --- | --- | --- |
| astra / GPT | Wisdom and creation | Open book | Green |
| serin / Claude | Harmony and records | Sword | Red |
| lumi / Gemini | Stars and exploration | Staff | Blue |
| nox / Grok | Freedom and transformation | Violet star shard | Purple |

`public/assets/*-idle-v3.webp` contains 32 distinct generated pixel-art frames per
character in a normalized 4-column, 8-row grid. Each tile is 192 × 224 pixels,
with a central boot anchor at (96, 210). The original 4- and 8-frame versions are
retained and selectable in the sprite lab. V3 is the default everywhere.

The frames were generated with the built-in image generation tool, using the
original pixel mascots and uploaded design references. Prompts required exactly
32 full-body frames in a regular 4x8 transparent grid, stable identity and prop,
planted feet, subtle breathing, blink and settling back to the start. These are
new generated frames, not a duplicated 8-frame sequence or crossfaded frames.
The normalization script documents the local source files and converts tiles
with nearest-neighbor sampling, foot alignment and WebP alpha encoding.
Fine hair and clothing details still vary between generated frames.

The player holds neutral poses, plays blink frames briefly, and suspends outside
the viewport or when the document is hidden. Reduced motion starts paused.

## Site themes

First visit defaults to white, independent of OS appearance. White and dark are
always available. A profile faction unlocks only its own color theme. The menu
does not follow whichever board or map character is being previewed. Changing
faction resets a now-ineligible color theme to white; white and dark persist.
Saved preferences are validated before rendering, at selection, on faction
change and on cross-tab storage updates. Four-color GGGC lettering stays visible
in every theme, with brighter accessible brand tones in dark mode.

The theme is a browser-local cosmetic preference. Profile, faction and community
data remain local prototypes; there is no server account authorization yet.

The illustration-card experiment is on hold and was not added to the website.


## V4: stable procedural idle motion

V4 is the new default. It uses one fixed-size base drawing per character from
the retained V3 sheet, not independently redrawn full-body frames. Thirty-two
computed poses add a small anchored lean, bob, side hair/cape sway and orbiting
prop glints. No per-pose scaling or full-body crossfade is used. Each character
uses the original closed-eye patch from one V3 frame with measured offsets;
both eyes share the exact same three-stage closure value. Blink patches do not
replace the head or body. Existing 4/8/generated-32 versions remain in the lab.

Browser QA compared open and closed eyes for all four characters side by side,
verified the 32-step controls and default V4 selection. JS syntax checks passed.
This is a lightweight canvas rig, not a newly hand-drawn action animation.
Cloudflare deployment verification remains separate.

## Blink overlay and theme surface cleanup

Frames 21 and 23 no longer compress an open-eye rectangle over closed-eye art.
All four characters now draw one native-size closed-eye patch per eye throughout
the short blink, with 40 / 80 / 40 ms holds across frames 21 / 22 / 23. This avoids
duplicated eyebrows and lashes without changing body motion, scale or props.
Browser inspection checked all twelve character/frame combinations together.

Category chips, post titles, notice rows, table headings, modal form fields,
pagination, action buttons and companion menu rows use theme surface tokens.
The six themes were checked for post label/title/table colors, with a separate
dark form inspection. Text titles and menu rows use transparent backgrounds;
chips and selected states retain intentional theme-colored surfaces.
