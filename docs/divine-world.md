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
