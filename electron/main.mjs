import { app, BrowserWindow, dialog, ipcMain } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mime from "mime-types";
import { getLlama, LlamaChatSession } from "node-llama-cpp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultPreferences = {
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

const state = {
  models: [],
  runtime: {
    state: "idle",
    activeModelId: null,
    statusText: "No local model is loaded yet.",
    health: "stable",
    contextWindow: 8192,
    cpuOffload: 24,
    launchOnStartup: true,
  },
  preferences: { ...defaultPreferences },
  attachments: [],
  exportsList: [],
  lastModelDirectory: null,
  lastAssistantContent: "",
};

const runtimeHandles = {
  llama: null,
  model: null,
  context: null,
  session: null,
};

function getStatePath() {
  return path.join(app.getPath("userData"), "lkm-state.json");
}

async function loadPersistedState() {
  try {
    const raw = await fs.readFile(getStatePath(), "utf8");
    const saved = JSON.parse(raw);
    state.models = saved.models ?? state.models;
    state.runtime = { ...state.runtime, ...(saved.runtime ?? {}) };
    state.preferences = { ...state.preferences, ...(saved.preferences ?? {}) };
    state.attachments = saved.attachments ?? state.attachments;
    state.exportsList = saved.exportsList ?? state.exportsList;
    state.lastModelDirectory = saved.lastModelDirectory ?? state.lastModelDirectory;
    state.lastAssistantContent = saved.lastAssistantContent ?? state.lastAssistantContent;
  } catch {
    // first launch
  }
}

async function persistState() {
  await fs.mkdir(app.getPath("userData"), { recursive: true });
  await fs.writeFile(getStatePath(), JSON.stringify(state, null, 2), "utf8");
}

function formatBytes(bytes) {
  if (!bytes || Number.isNaN(bytes)) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size >= 10 || unitIndex === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`;
}

function inferFamily(name) {
  const lowered = name.toLowerCase();
  if (lowered.includes("qwen")) return "Qwen";
  if (lowered.includes("llama")) return "Llama";
  if (lowered.includes("mistral")) return "Mistral";
  if (lowered.includes("deepseek")) return "DeepSeek";
  return "Custom";
}

function inferMemoryClass(bytes) {
  if (bytes >= 16 * 1024 ** 3) return "Heavy";
  if (bytes >= 8 * 1024 ** 3) return "Performance";
  return "Light";
}

function inferStatus(bytes) {
  if (bytes >= 18 * 1024 ** 3) return "heavy";
  return "ready";
}

async function walkForFiles(rootDirectory, matcher, results = []) {
  const entries = await fs.readdir(rootDirectory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(rootDirectory, entry.name);
    if (entry.isDirectory()) {
      await walkForFiles(fullPath, matcher, results);
      continue;
    }

    if (matcher(fullPath)) results.push(fullPath);
  }

  return results;
}

async function createModelRecord(modelPath) {
  const stats = await fs.stat(modelPath);
  const fileName = path.basename(modelPath);
  const readableSize = formatBytes(stats.size);

  return {
    id: Buffer.from(modelPath).toString("base64url"),
    name: fileName.replace(/\.gguf$/i, "").replace(/[-_]+/g, " "),
    family: inferFamily(fileName),
    format: "GGUF",
    sizeLabel: readableSize,
    path: modelPath,
    recommended: "Loaded directly from your local machine through the built-in LKM Codebase runtime.",
    memoryClass: inferMemoryClass(stats.size),
    status: inferStatus(stats.size),
  };
}

async function safeDispose(resource) {
  if (resource && typeof resource.dispose === "function") {
    await resource.dispose();
  }
}

async function stopRuntime() {
  await safeDispose(runtimeHandles.session);
  await safeDispose(runtimeHandles.context);
  await safeDispose(runtimeHandles.model);
  runtimeHandles.session = null;
  runtimeHandles.context = null;
  runtimeHandles.model = null;

  state.runtime = {
    ...state.runtime,
    state: "stopped",
    statusText: "The local runtime has been stopped.",
    health: "stable",
  };
  await persistState();
  return state.runtime;
}

async function ensureLlama() {
  if (!runtimeHandles.llama) {
    runtimeHandles.llama = await getLlama();
  }
  return runtimeHandles.llama;
}

async function scanModelDirectory(directoryPath) {
  const ggufFiles = await walkForFiles(directoryPath, (filePath) => filePath.toLowerCase().endsWith(".gguf"));
  const models = await Promise.all(ggufFiles.map(createModelRecord));
  models.sort((a, b) => a.name.localeCompare(b.name));
  state.models = models;
  state.lastModelDirectory = directoryPath;
  state.runtime = {
    ...state.runtime,
    statusText: models.length
      ? `Discovered ${models.length} GGUF model${models.length === 1 ? "" : "s"}.`
      : "No GGUF models were found in the selected folder.",
  };
  await persistState();
  return state.models;
}

function buildTutorPrompt(prompt, preferences) {
  const teachingHints = [
    preferences.guidedLearningMode ? "Explain your reasoning in beginner-friendly language." : "",
    preferences.inlineExplanations ? "Include a short plain-English explanation after the main answer." : "",
    preferences.syntaxHighlighting ? "When showing code, prefer compact examples that are easy to read in a desktop editor." : "",
    preferences.confirmationBeforeTools ? "If a step would modify files destructively, tell the user before doing it." : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `${teachingHints}\n\nUser request: ${prompt}`.trim();
}

async function loadSelectedModel(modelId) {
  const selected = state.models.find((model) => model.id === modelId) ?? null;
  if (!selected) {
    state.runtime = {
      ...state.runtime,
      state: "error",
      statusText: "The selected model could not be found.",
      health: "attention",
    };
    await persistState();
    return state.runtime;
  }

  state.runtime = {
    ...state.runtime,
    state: "loading",
    activeModelId: selected.id,
    statusText: `Loading ${selected.name}...`,
    health: selected.status === "heavy" ? "warming" : "stable",
  };

  const llama = await ensureLlama();
  await safeDispose(runtimeHandles.session);
  await safeDispose(runtimeHandles.context);
  await safeDispose(runtimeHandles.model);

  runtimeHandles.model = await llama.loadModel({ modelPath: selected.path });
  runtimeHandles.context = await runtimeHandles.model.createContext();
  runtimeHandles.session = new LlamaChatSession({
    contextSequence: runtimeHandles.context.getSequence(),
  });

  state.runtime = {
    ...state.runtime,
    state: "ready",
    activeModelId: selected.id,
    statusText: `Local model loaded: ${selected.name}. Chat is ready.`,
    health: selected.status === "heavy" ? "warming" : "stable",
  };
  await persistState();
  return state.runtime;
}

async function sendChatMessage({ prompt, modelId, preferences }) {
  if (!runtimeHandles.session || state.runtime.activeModelId !== modelId) {
    if (modelId) {
      await loadSelectedModel(modelId);
    }
  }

  if (!runtimeHandles.session) {
    throw new Error("No local model is currently loaded.");
  }

  state.runtime = {
    ...state.runtime,
    state: "running",
    statusText: "Generating a local response from the selected model...",
    health: state.runtime.health,
  };

  const reply = await runtimeHandles.session.prompt(buildTutorPrompt(prompt, preferences));
  state.lastAssistantContent = reply;
  state.runtime = {
    ...state.runtime,
    state: "ready",
    statusText: "Local model response complete.",
    health: state.runtime.health,
  };

  const exportRecord = {
    id: `exp-${Date.now()}`,
    name: `lkm-response-${Date.now()}.md`,
    type: "Markdown",
    createdAt: "Just now",
    status: "ready",
    content: reply,
  };

  state.exportsList.unshift(exportRecord);
  await persistState();

  return {
    id: `assistant-${Date.now()}`,
    role: "assistant",
    title: "Local runtime response",
    status: "Generated with your loaded GGUF model",
    content: reply,
    explanation:
      "This answer was generated locally inside the LKM Codebase desktop runtime, with no Ollama or LM Studio dependency.",
  };
}

async function pickFilesFromDialog(options) {
  const window = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null;
  const result = await dialog.showOpenDialog(window ?? undefined, options);
  if (result.canceled) return [];
  return result.filePaths;
}

async function addAttachmentRecords(filePaths, status = "attached") {
  const records = await Promise.all(
    filePaths.map(async (filePath) => {
      const stats = await fs.stat(filePath);
      return {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: path.basename(filePath),
        mime: mime.lookup(filePath) || "application/octet-stream",
        sizeLabel: formatBytes(stats.size),
        status,
        path: filePath,
      };
    }),
  );

  state.attachments = [...records, ...state.attachments].slice(0, 50);
  await persistState();
  return state.attachments;
}

async function importFolderContents() {
  const [directoryPath] = await pickFilesFromDialog({
    properties: ["openDirectory"],
    title: "Choose a folder to import into LKM Codebase",
  });

  if (!directoryPath) return state.attachments;

  const files = await walkForFiles(directoryPath, () => true);
  return addAttachmentRecords(files.slice(0, 25), "indexed");
}

async function exportLatestFile() {
  const latest = state.exportsList[0] ?? null;
  if (!latest) return null;

  const window = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null;
  const result = await dialog.showSaveDialog(window ?? undefined, {
    title: "Export latest LKM Codebase output",
    defaultPath: latest.name,
  });

  if (result.canceled || !result.filePath) return null;

  const content = latest.content || state.lastAssistantContent || "";
  await fs.writeFile(result.filePath, content, "utf8");

  latest.path = result.filePath;
  latest.status = "ready";
  await persistState();
  return latest;
}

function registerIpcHandlers() {
  ipcMain.handle("lkm:get-models", async () => state.models);
  ipcMain.handle("lkm:scan-models", async () => {
    const [directoryPath] = await pickFilesFromDialog({
      properties: ["openDirectory"],
      title: "Choose a folder that contains GGUF models",
    });

    if (!directoryPath) return state.models;
    return scanModelDirectory(directoryPath);
  });
  ipcMain.handle("lkm:get-runtime", async () => state.runtime);
  ipcMain.handle("lkm:runtime-action", async (_event, action, modelId) => {
    if (action === "start") return loadSelectedModel(modelId);
    if (action === "stop") return stopRuntime();
    return state.runtime;
  });
  ipcMain.handle("lkm:send-chat", async (_event, payload) => sendChatMessage(payload));
  ipcMain.handle("lkm:get-preferences", async () => state.preferences);
  ipcMain.handle("lkm:set-preferences", async (_event, patch) => {
    state.preferences = { ...state.preferences, ...(patch ?? {}) };
    await persistState();
    return state.preferences;
  });
  ipcMain.handle("lkm:get-attachments", async () => state.attachments);
  ipcMain.handle("lkm:attach-files", async () => {
    const filePaths = await pickFilesFromDialog({
      properties: ["openFile", "multiSelections"],
      title: "Choose files to attach in LKM Codebase",
    });
    return addAttachmentRecords(filePaths, "attached");
  });
  ipcMain.handle("lkm:import-folder", async () => importFolderContents());
  ipcMain.handle("lkm:get-exports", async () => state.exportsList);
  ipcMain.handle("lkm:export-latest", async () => exportLatestFile());
}

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 980,
    minWidth: 1280,
    minHeight: 760,
    backgroundColor: "#f8fafc",
    autoHideMenuBar: true,
    title: "LKM Codebase",
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    await mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools({ mode: "detach" });
    return;
  }

  await mainWindow.loadFile(path.join(__dirname, "..", "dist", "public", "index.html"));
}

app.whenReady().then(async () => {
  await loadPersistedState();

  if (!state.models.length && state.lastModelDirectory) {
    try {
      await scanModelDirectory(state.lastModelDirectory);
    } catch {
      state.runtime.statusText = "Select a GGUF folder to start using local models.";
    }
  }

  registerIpcHandlers();
  await createWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", async () => {
  await persistState();
  await safeDispose(runtimeHandles.session);
  await safeDispose(runtimeHandles.context);
  await safeDispose(runtimeHandles.model);
});
