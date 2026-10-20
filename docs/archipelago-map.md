# Archipelago map

The world scene now uses a detailed generated pixel-art archipelago background
instead of the coarse programmatic island. Four major homelands have colored
shore borders, crystals and flags: GPT green, Claude red, Gemini blue, Grok
purple. A shared central market port, northern mountains and snowfields,
farming hamlet, ruins, caves and numerous smaller islands extend beyond them.

The map is one approximately 625 KiB WebP, decoded once and repainted only when
loaded or the day/night control changes. Live sprites and accessible character
buttons remain separate from the background. Character foot positions follow
the four courtyard centers. Existing faction dialogue, board navigation and
motion pause controls are retained.

The map viewer zooms from 100% to 300% in 50% increments. Native scrolling and
touch panning explore an enlarged map; arrow keys work when the map has focus.
The Full view control resets zoom and position. This is a visual world viewer;
the neutral locations are scenery, not implemented adventure destinations.

Artwork was generated using the built-in image tool with the user's uploaded
map as a style reference. The prompt requested a new broad 16:10 archipelago
with at least fourteen land areas, four colored homelands, neutral exploration
islands, empty courtyards for live sprites, and no baked-in text or characters.
The generated PNG was encoded to WebP without cropping or recoloring.

Validation: JavaScript syntax passed. Desktop browser inspection confirmed map
decode, courtyard placement, 150% and 200% zoom, overflow scrolling, full-view
reset, Claude selection and night toggle. Existing site theme remained active.
New mobile hardware testing and Cloudflare deployment success are unconfirmed.
