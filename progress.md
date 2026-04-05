Original prompt: I want to make a web based 2d side scrolling game where you are a bunny that runs and jumps to catch carrots. I want to implement xbox controller and keyboard based controls. The art style should be reminiscent of the original Super Mario Brothers. I want to deploy it uses github actions and github pages. The number of carrots should be displayed as a score in the upper right corner of the screen. The high score for a session should be tracked and updated. The should be platforms to jump on, but no pits to fall into. Each level should last one minute and have a finish line. When you cross the finish line, the bunny should eat all of the carrots.

- 2026-04-05: Removed gameplay platforms from level generation and replaced them with floating carrot arcs.
- 2026-04-05: Enabled Phaser gamepad input explicitly and normalized pad selection to the first connected controller instead of assuming slot 0.
- 2026-04-05: Verified lint, typecheck, unit tests, integration tests, and build after the no-platform/controller pass.
- 2026-04-05: Replaced the 2-frame run texture swap with a generated 12-frame bunny run animation built from the loaded run source art.
- 2026-04-05: Moved gameplay controller reads onto raw browser Gamepad API polling with explicit Xbox mappings: A jump/confirm, X sprint, Start pause.
- 2026-04-05: Added an always-visible controller debug panel that shows focus state, detected controller metadata, axes, and key button states from navigator.getGamepads().
- 2026-04-05: Added coverage for controller event-log diagnostics, pause-menu restart wiring, and a Playwright fake-gamepad flow that starts and restarts a run with Xbox-style buttons.
- 2026-04-05: Added a WebHID fallback panel with connect, calibrate, and reset actions so Chrome can read controller reports even when the Gamepad API stays empty.
- TODO: Validate Xbox controller behavior with a physical controller in Chrome because automated browser checks cannot prove real hardware input.
