# LKM Codebase desktop build status

LKM Codebase now includes a native Electron shell, a main-process `node-llama-cpp` runtime bridge for local GGUF models, native file import and export dialogs, and a fullscreen-safe three-panel desktop UI.

## Current artifact status

| Platform | Status | Output |
| --- | --- | --- |
| Linux | Built successfully in the sandbox | `release/LKM Codebase-1.0.0.AppImage` |
| Windows | Native build host not available here | Use `.github/workflows/desktop-build.yml` on Windows runners to produce the `.exe` installer |
| macOS | Native build host not available here | Use `.github/workflows/desktop-build.yml` on macOS runners to produce the `.dmg` image |

## Why Windows and macOS are not built directly here

The local GGUF runtime package used by this app, `node-llama-cpp`, requires packaging on the target operating system rather than cross-packaging from a different host. During this task, the connected Windows desktop did not have Node.js or pnpm installed, so a native Windows build could not be completed there without additional environment setup.

## CI workflow

A GitHub Actions workflow was added at `.github/workflows/desktop-build.yml`.

It creates a native build matrix on:

| Runner | Artifact command | Expected output |
| --- | --- | --- |
| `windows-2022` | `pnpm desktop:dist:win` | `release/*.exe` |
| `macos-13` | `pnpm desktop:dist:mac` | `release/*.dmg` |
| `ubuntu-22.04` | `pnpm desktop:dist:linux` | `release/*.AppImage` |

## Local commands

| Purpose | Command |
| --- | --- |
| Run Electron in development | `pnpm desktop:dev` |
| Build all configured desktop targets on the current host | `pnpm desktop:build` |
| Build Windows installer on Windows | `pnpm desktop:dist:win` |
| Build macOS disk image on macOS | `pnpm desktop:dist:mac` |
| Build Linux AppImage on Linux | `pnpm desktop:dist:linux` |

## Recommended next setup step

Install Node.js 22 and pnpm on the Windows machine if you want to build the `.exe` locally outside CI. For macOS, run the same project on a Mac host or through the included GitHub Actions workflow.
