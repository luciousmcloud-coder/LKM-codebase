/*
 * Mission Control Tutor design reminder
 * - Server endpoints should surface local runtime state clearly and preserve a clean contract for a packaged built-in runner.
 * - Keep user control explicit: start, stop, refresh, inspect, attach, and export.
 */
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type RuntimeState = "idle" | "loading" | "ready" | "running" | "stopped" | "error";
type HealthState = "stable" | "warming" | "attention";
type AutonomyMode = "plan" | "guided" | "autonomous";

type ModelRecord = {
  id: string;
  name: string;
  family: string;
  format: string;
  sizeLabel: string;
  path: string;
  recommended: string;
  memoryClass: string;
  status: "ready" | "missing-runtime" | "heavy";
};

type RuntimeSnapshot = {
  state: RuntimeState;
  activeModelId: string | null;
  statusText: string;
  health: HealthState;
  contextWindow: number;
  cpuOffload: number;
  launchOnStartup: boolean;
};

type Preferences = {
  syntaxHighlighting: boolean;
  codeCategories: boolean;
  inlineExplanations: boolean;
  splitView: boolean;
  guidedLearningMode: boolean;
  confirmationBeforeTools: boolean;
  fontScale: number;
  codeDensity: number;
  autonomyMode: AutonomyMode;
};

type AttachmentRecord = {
  id: string;
  name: string;
  mime: string;
  sizeLabel: string;
  status: "attached" | "indexed" | "returned";
};

type ExportRecord = {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  status: "ready" | "draft";
};

type ChatMessage = {
  id: string;
  role: "assistant";
  title?: string;
  content: string;
  status?: string;
  codeSample?: string;
  explanation?: string;
  categories?: string[];
};

const models: ModelRecord[] = [
  {
    id: "qwen-coder-14b-q4",
    name: "Qwen Coder 14B Instruct",
    family: "Qwen",
    format: "GGUF",
    sizeLabel: "9.2 GB",
    path: "/models/qwen-coder-14b-instruct-q4.gguf",
    recommended: "Good balance for local coding, explanation quality, and your hardware class.",
    memoryClass: "Performance",
    status: "ready",
  },
  {
    id: "qwen3-30b-a3b-q4",
    name: "Qwen 3 30B A3B",
    family: "Qwen",
    format: "GGUF",
    sizeLabel: "18.7 GB",
    path: "/models/qwen3-30b-a3b-q4.gguf",
    recommended: "Useful when you want stronger reasoning and can tolerate a heavier local load.",
    memoryClass: "Heavy",
    status: "heavy",
  },
  {
    id: "llama-3-8b-q4",
    name: "Llama 3 8B Instruct",
    family: "Llama",
    format: "GGUF",
    sizeLabel: "4.7 GB",
    path: "/models/llama-3-8b-instruct-q4.gguf",
    recommended: "A lighter fallback for fast iteration and UI testing.",
    memoryClass: "Light",
    status: "ready",
  },
];

let runtime: RuntimeSnapshot = {
  state: "idle",
  activeModelId: models[0]?.id ?? null,
  statusText: "No local model is loaded yet.",
  health: "stable",
  contextWindow: 8192,
  cpuOffload: 24,
  launchOnStartup: true,
};

let preferences: Preferences = {
  syntaxHighlighting: true,
  codeCategories: true,
  inlineExplanations: true,
  splitView: true,
  guidedLearningMode: true,
  confirmationBeforeTools: true,
  fontScale: 100,
  codeDensity: 60,
  autonomyMode: "guided",
};

const attachments: AttachmentRecord[] = [
  { id: "att-1", name: "requirements-notes.md", mime: "text/markdown", sizeLabel: "18 KB", status: "indexed" },
  { id: "att-2", name: "ui-wireframe.png", mime: "image/png", sizeLabel: "1.4 MB", status: "attached" },
  { id: "att-3", name: "prototype-plan.pdf", mime: "application/pdf", sizeLabel: "640 KB", status: "attached" },
];

const exportsList: ExportRecord[] = [
  { id: "exp-1", name: "learning-ui-home.tsx", type: "TSX", createdAt: "Just now", status: "ready" },
  { id: "exp-2", name: "local-runtime-adapter-notes.md", type: "Markdown", createdAt: "6 min ago", status: "draft" },
];

function createPrototypeChatMessage(prompt: string): ChatMessage {
  return {
    id: `assistant-${Date.now()}`,
    role: "assistant",
    title: "Prototype runtime response",
    status: runtime.state === "ready" || runtime.state === "running" ? "Local runtime contract active" : "Awaiting packaged engine",
    content:
      `You asked: "${prompt}". The current prototype is wired for a local-only workflow and the UI is already prepared to manage a built-in model runtime. In this sandbox build, the server returns a structured placeholder response while the packaged inference layer remains to be connected.`,
    codeSample: `export async function discoverModels(modelDirectory: string) {
  const discovered = await scanForSupportedModels(modelDirectory, [".gguf"]);
  return discovered.map(toModelCardRecord);
}

export async function launchSelectedModel(modelId: string) {
  const model = modelIndex.get(modelId);
  runtime.state = "loading";
  runtime.activeModelId = modelId;
  runtime.process = await internalRunner.launch(model.path);
  runtime.state = "ready";
}`,
    explanation:
      "The server contract is already shaped around a built-in local runner. The remaining integration work is to replace the placeholder internalRunner with a packaged inference engine such as an embedded llama.cpp-based adapter, without exposing that lower-level complexity as separate software the user must manage.",
    categories: ["Logic", "Files", "Configuration"],
  };
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "10mb" }));

  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.get("/api/models", (_req, res) => {
    res.json(models);
  });

  app.get("/api/runtime", (_req, res) => {
    res.json(runtime);
  });

  app.post("/api/runtime", (req, res) => {
    const { action, modelId } = req.body as { action?: "start" | "stop" | "refresh"; modelId?: string | null };

    if (action === "start") {
      const nextModel = models.find((entry) => entry.id === modelId) ?? models[0] ?? null;
      runtime = {
        ...runtime,
        state: "ready",
        activeModelId: nextModel?.id ?? null,
        statusText: nextModel
          ? `Local model loaded: ${nextModel.name}. Chat is ready.`
          : "No model selected.",
        health: nextModel?.status === "heavy" ? "warming" : "stable",
      };
      return res.json(runtime);
    }

    if (action === "stop") {
      runtime = {
        ...runtime,
        state: "stopped",
        statusText: "The local runtime has been stopped.",
        health: "stable",
      };
      return res.json(runtime);
    }

    return res.json(runtime);
  });

  app.get("/api/preferences", (_req, res) => {
    res.json(preferences);
  });

  app.post("/api/preferences", (req, res) => {
    preferences = { ...preferences, ...(req.body as Partial<Preferences>) };
    res.json(preferences);
  });

  app.get("/api/attachments", (_req, res) => {
    res.json(attachments);
  });

  app.get("/api/exports", (_req, res) => {
    res.json(exportsList);
  });

  app.post("/api/chat", (req, res) => {
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt : "";

    if (!prompt.trim()) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    if (runtime.state === "idle" || runtime.state === "stopped") {
      runtime = {
        ...runtime,
        state: "attention",
      } as unknown as RuntimeSnapshot;
    }

    const response = createPrototypeChatMessage(prompt);
    exportsList.unshift({
      id: `exp-${Date.now()}`,
      name: "agent-response.md",
      type: "Markdown",
      createdAt: "Just now",
      status: "draft",
    });

    return res.json(response);
  });

  app.use(express.static(staticPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
