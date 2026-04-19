# OpenManus Integration Notes

The official **OpenManus** repository is currently a **CLI-first Python agent framework** rather than a graphical end-user application. Its main entry point is `main.py`, which creates a `Manus` agent and prompts the user in the terminal with `input("Enter your prompt: ")`. That means the beginner-friendly graphical experience requested here will need to be added as a **new UI layer**, not merely turned on through an existing screen.

The current model integration is centered in `app/llm.py` and `app/config.py`. The official design assumes an endpoint-style model backend described by `model`, `base_url`, `api_key`, and `api_type`. In other words, OpenManus currently expects to call an API-compatible model provider, including localhost-style providers. To support a **built-in local-only runtime**, this architecture will need an additional abstraction layer that can either start and manage a local inference engine directly or present a local-runtime adapter that behaves like the current LLM interface.

The most important backend control points are `app/agent/manus.py` and `app/agent/toolcall.py`. The Manus agent assembles the tool set and lifecycle, while `ToolCallAgent` owns the model-think, tool-execute, and observation loop. These files are the right places to connect UI-visible task state, step-by-step execution traces, stop controls, beginner explanations, and file-oriented workflows.

The managed project at `/home/ubuntu/openmanus-learning-ui` already contains a React and Express scaffold. The client is centered around `client/src/App.tsx` and `client/src/pages/Home.tsx`, while the server currently exposes only static-file hosting through `server/index.ts`. The scaffold also already includes reusable UI building blocks such as cards, tabs, sheets, dialogs, resizable panels, switches, sliders, tables, scroll areas, sidebars, and form primitives. That makes it practical to implement a **workspace-style graphical prototype** quickly without building the whole component library from scratch.

The architectural implication is clear: the prototype should keep the **Python OpenManus engine** as the agent core, add a **Node/Express API layer** for the new web UI, and introduce a **local-runtime manager** capable of discovering downloaded models, starting a built-in runner, and exposing that runner to the existing OpenManus logic through a compatible interface.

## Prototype preview findings

The implemented Mission Control Tutor workspace renders successfully in the browser. The top command band, left model library, central chat workbench, and right learning inspector are all present on first load. The preview also confirms that the main requested defaults are visible immediately, including the startup message that learning aids are enabled by default, the settings entry point, the stop control, the files and exports tabs, and the explanation inspector.

The initial preview also shows one obvious interaction gap: the primary model-selection cards are below the first viewport fold in the current browser size, so the user initially sees the model library header and controls before seeing the detailed model choices. That is acceptable for a prototype, but the next refinement should make model selection more prominent near the top of the left rail.

The production-backed preview on port 3002 confirms that the server APIs are wired into the interface: the status badge now reports **"Local model loaded: Qwen Coder 14B Instruct. Chat is ready."**, and the model cards are visible above the fold. This resolves the earlier visibility concern from the development preview and shows that the most important first-run controls are now accessible immediately.

The production viewport also confirms that the left rail, chat workbench, and learning inspector remain balanced within a single screen at desktop width, with model selection, runtime controls, and inspector tabs all reachable without layout collapse.
