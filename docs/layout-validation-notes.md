# Layout validation notes

## 2026-04-19 fullscreen shell check

The updated LKM Codebase preview now renders as a stable three-panel desktop shell within the current browser viewport.

| Check | Result |
| --- | --- |
| Outer shell height | Bounded to the viewport |
| Document horizontal overflow | None detected |
| Document vertical overflow | None detected |
| Left sidebar visibility | Fully visible |
| Center conversation panel visibility | Fully visible |
| Right code/work panel visibility | Fully visible |
| Internal scrolling | Confined to panel scroll regions |

The browser-reported viewport size during validation was **1280 × 1100**. The document `scrollWidth` matched `clientWidth`, and the document `scrollHeight` matched `clientHeight`, indicating that the outer application frame is no longer exceeding the viewport.

## Screenshot review at common fullscreen resolutions

Additional visual review confirms that the revised shell remains contained and readable at both **1366 × 768** and **1920 × 1080**.

| Resolution | Visual result |
| --- | --- |
| **1366 × 768** | Left sidebar, center chat workspace, and right work panel all remain visible within the frame. Internal panel content scrolls instead of pushing the shell beyond the viewport. |
| **1920 × 1080** | The same three-panel structure expands cleanly with no clipped controls and no cropped panel edges. |

The saved validation screenshots are:

- `docs/lkm-layout-1366x768.png`
- `docs/lkm-layout-1920x1080.png`

## Node runtime integration notes

A review of the current `node-llama-cpp` documentation confirmed several constraints that affect the next implementation step.

| Constraint | Implementation consequence |
| --- | --- |
| `node-llama-cpp` must run in the **Electron main process** | The renderer must use a preload bridge or IPC and must not import the runtime directly. |
| Cross-packaging is **not supported** across operating systems | Windows, macOS, and Linux installers must be produced on their respective host platforms or a multi-OS CI workflow. |
| The package should stay external and preserve its native file structure | Electron packaging must avoid bundling `node-llama-cpp` into the renderer bundle and must keep its module layout intact. |
| Native binaries should not be packed into an incompatible archive layout | Packaging configuration must treat the runtime module carefully when building the desktop application. |
