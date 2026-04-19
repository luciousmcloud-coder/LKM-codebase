# OpenManus Learning Prototype Architecture

## Chosen Design Philosophy

This prototype will follow the **Mission Control Tutor** direction. The interface will treat the agent as a capable local machine that the user supervises, learns from, and can interrupt instantly. The visual system therefore prioritises **operational clarity**, **visible autonomy**, **strong grouping**, and **continuous status visibility** over decorative flourish.

## Product Intent

The product is a **local-only OpenManus-derived workspace** in which the user selects a downloaded model from the UI, starts that model from inside the application, enters chat immediately, uploads files for processing, receives generated or edited files back, and learns from the AI through beginner-oriented explanation modes.

## Core Screen Model

The application should open into a three-zone workspace rather than a landing page.

| Zone | Purpose | Key contents |
| --- | --- | --- |
| **Left rail** | Persistent control and navigation | model library, runtime status, mode selector, files, saved exports |
| **Center workbench** | Primary task execution surface | chat thread, composer, attachments, task controls, agent status |
| **Right inspector** | Learning and inspection surface | code explanations, category legend, beginner notes, diff review, execution details |

A narrow top command band should hold the active model, autonomy mode, stop control, settings button, and runtime health.

## Feature Groups Enabled by Default

All learning aids requested by the user should be **on by default** at startup.

| Feature | Default state | Notes |
| --- | --- | --- |
| **Syntax highlighting** | On | standard code colourisation |
| **Colour-coded code categories** | On | logic, UI, data, files, deployment, configuration |
| **Inline beginner explanations** | On | expandable annotations and glossary cues |
| **Split code/explanation view** | On | side-by-side or stacked on smaller screens |
| **Guided learning mode** | On | asks the AI to explain before and after changes |
| **Visible execution timeline** | On | derived from agent/tool activity |
| **Stop / interrupt control** | Always visible | immediate termination affordance |

## Settings and Preferences

The prototype should include a **Settings / Preferences** surface implemented as a side sheet or dialog. It should include model, learning, runtime, and workspace settings.

| Settings section | Controls |
| --- | --- |
| **Learning** | toggles for syntax highlighting, category overlays, inline explanations, split view, guided mode |
| **Autonomy** | plan-only, guided, autonomous, confirmation-before-tools toggle |
| **Runtime** | model directory, active model, context size, CPU/GPU preference, launch on startup |
| **Workspace** | theme, font scale, code density, panel layout, auto-save exports |
| **Files** | default import directory, export directory, preview behavior, large-file handling |

## Local Model Runtime Architecture

The built-in runtime should not depend on Ollama or LM Studio. For the first prototype, the most pragmatic foundation is **llama.cpp** embedded as an internal runtime manager rather than as a separate user-managed product. The UI should not expose llama.cpp branding as the primary experience; instead it should present a model library and a simple "Load model" action.

### Proposed runtime flow

1. The app scans one or more user-defined model directories for compatible local model files, initially prioritising **GGUF**.
2. The server exposes an API to list discovered models with metadata such as file name, size, estimated memory class, and compatibility hints.
3. When the user selects a model, the server starts the local runtime process with a generated configuration.
4. The server keeps a runtime session registry, health state, and stop/restart controls.
5. The OpenManus backend communicates with this local runtime through an adapter that keeps the rest of the agent loop as stable as possible.
6. The UI transitions directly from model selection into chat once readiness is confirmed.

## File Import and Export Model

The user requested broad file freedom. The prototype should therefore treat files as first-class chat artifacts rather than special cases.

| Capability | Design approach |
| --- | --- |
| **Import any file type** | allow file upload and path-based addition; store metadata even when no rich preview is available |
| **Preview where possible** | text, markdown, code, images, PDFs, CSV, JSON, and audio/video metadata should get specialised previews |
| **Pass to agent** | attachments become structured chat context items with file path, mime type, and extraction status |
| **Edit and return files** | generated outputs are stored as export artifacts and shown in an export drawer |
| **Download / reveal exports** | each artifact gets file name, type, timestamp, and quick actions |

The important caveat is that "any file type" can realistically mean **accept any file type**, while previewing or semantically editing every possible binary format requires format-specific tooling. The prototype should therefore separate **file acceptance** from **file understanding depth**.

## Beginner Learning System

The learning layer should be explicit rather than implicit.

| Learning surface | Function |
| --- | --- |
| **Code category legend** | explains the meaning of each overlay colour |
| **Explain this block** | contextual action on selected code |
| **Why this changed** | explanation of generated diffs |
| **Teach me mode** | forces slower, annotated, stepwise responses |
| **Glossary popovers** | define terms such as API, function, component, route, schema |
| **Try-it-yourself prompts** | convert a change into a small exercise |

## Additional Product Patterns Adapted from Commercial Tools

The commercial patterns researched earlier suggest several additions that fit this prototype well:

| Pattern | Adaptation in this prototype |
| --- | --- |
| **Plan mode** | preview the implementation plan before code changes |
| **Autonomy levels** | lightweight help, guided build, or autonomous run |
| **Checkpoints / history** | save named milestones and compare changes |
| **Model selection** | choose active local model from the command band |
| **Execution telemetry** | surface step count, active action, warnings, and recent tool results |
| **Follow-up chat on completed work** | let the user ask about any completed change or export |

## Initial Implementation Strategy

The first implementation slice should prioritise visible progress while keeping the architecture extensible.

| Slice | Outcome |
| --- | --- |
| **Slice 1** | replace the placeholder home page with the Mission Control Tutor workspace |
| **Slice 2** | add settings panel, model library panel, and file drawer with realistic local-only states |
| **Slice 3** | add Express APIs for model discovery, runtime session state, chat session state, attachments, and exports |
| **Slice 4** | add a local-runtime adapter contract that can later launch llama.cpp-managed models |
| **Slice 5** | connect the UI to the adapter and expose stop/restart flow |

## Safety and Control Requirements

The user must always be able to understand what the AI is doing and stop it quickly.

> The interface should include a continuously visible execution state, a clear stop button, and an inspectable step timeline so that autonomous behaviour remains supervised.

That principle will guide the implementation as strongly as the learning features themselves.

## LKM Codebase rebuild notes

The new target interface is no longer the earlier three-zone Mission Control Tutor dashboard. The attached reference image establishes a denser application shell: a narrow left navigation rail for task and library entry points, a center conversation workspace with stacked progress cards and a bottom composer, and a right-side split development area with a file tree and code editor under a compact utility toolbar. The rebuild should preserve the existing local-model and teaching concepts, but those capabilities now need to be expressed inside this shell.

The supervised-prototype guidance still applies. The rebuilt LKM Codebase interface should keep a visible stop pathway, clear action visibility, inspectable task progress, and an execution environment that feels overseen rather than opaque. In practice, that means the center panel should expose agent progress and reasoning, while the adjacent panes provide file, code, and control surfaces without hiding them behind separate screens.
