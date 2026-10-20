# Interactive world scene

The existing community homepage now includes a 480 × 300 pixel canvas island, rendered at the available responsive width. Its forest, castle, lake and twilight neighbourhoods use deterministic drawing commands; there are no map downloads, API requests or continuous canvas render loops.

- Four accessible character buttons update the dialogue and the destination button. Choosing a map character previews that character; it does not change the user's stored faction.
- Visiting a faction delegates to the existing board filter. The floating companion follows the browser-local profile's faction.
- Astra uses the retained four-frame WebP and canvas player described in `astra-animation.md`. Serin, Lumi and Nox now each use a transparent four-frame idle WebP sheet as well. All four share the same canvas player; character-specific scales and foot anchors align their frames. No walking or combat animation is implemented.
- Day/night repaints the canvas only on toggle. The motion control stops the map's character movement, clouds and Astra player. Reduced-motion preferences initialize the scene paused; hidden tabs and offscreen scenes suspend animation.
- The scene and profile remain a browser-only prototype. No adventure rewards, real account, inventory, shared community data or server authorization are implemented.

Review `/` for the world and companion, and `/sprite-lab.html` for Astra frame-by-frame inspection.
