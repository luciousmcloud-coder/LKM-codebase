export type RuntimeState = "idle" | "loading" | "ready" | "running" | "stopped" | "error";
export type AutonomyMode = "plan" | "guided" | "autonomous";

export type ModelRecord = {
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

export type RuntimeSnapshot = {
  state: RuntimeState;
  activeModelId: string | null;
  statusText: string;
  health: "stable" | "warming" | "attention";
  contextWindow: number;
  cpuOffload: number;
  launchOnStartup: boolean;
};

export type Preferences = {
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

export type AttachmentRecord = {
  id: string;
  name: string;
  mime: string;
  sizeLabel: string;
  status: "attached" | "indexed" | "returned";
  path?: string;
};

export type ExportRecord = {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  status: "ready" | "draft";
  path?: string;
  content?: string;
};

export type ChatMessage = {
  id: string;
  role: "assistant" | "user" | "system";
  title?: string;
  content: string;
  status?: string;
  explanation?: string;
};

type DesktopBridge = {
  getModels: () => Promise<ModelRecord[]>;
  scanModels: () => Promise<ModelRecord[]>;
  getRuntime: () => Promise<RuntimeSnapshot>;
  runtimeAction: (action: "start" | "stop" | "refresh", modelId?: string | null) => Promise<RuntimeSnapshot>;
  sendChat: (payload: { prompt: string; modelId?: string | null; preferences: Preferences }) => Promise<ChatMessage>;
  getPreferences: () => Promise<Preferences>;
  setPreferences: (patch: Partial<Preferences>) => Promise<Preferences>;
  getAttachments: () => Promise<AttachmentRecord[]>;
  attachFiles: () => Promise<AttachmentRecord[]>;
  importFolder: () => Promise<AttachmentRecord[]>;
  getExports: () => Promise<ExportRecord[]>;
  exportLatest: () => Promise<ExportRecord | null>;
};

declare global {
  interface Window {
    lkmDesktop?: DesktopBridge;
  }
}

function getBridge() {
  return typeof window !== "undefined" ? window.lkmDesktop : undefined;
}

export function hasDesktopBridge() {
  return Boolean(getBridge());
}

export async function loadJson<T>(url: string, fallback: T): Promise<T> {
  const bridge = getBridge();

  try {
    if (bridge) {
      switch (url) {
        case "/api/models":
          return (await bridge.getModels()) as T;
        case "/api/runtime":
          return (await bridge.getRuntime()) as T;
        case "/api/preferences":
          return (await bridge.getPreferences()) as T;
        case "/api/attachments":
          return (await bridge.getAttachments()) as T;
        case "/api/exports":
          return (await bridge.getExports()) as T;
        default:
          return fallback;
      }
    }

    const response = await fetch(url);
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export async function runtimeAction(action: "start" | "stop" | "refresh", modelId?: string | null) {
  const bridge = getBridge();
  if (bridge) return bridge.runtimeAction(action, modelId);

  const response = await fetch("/api/runtime", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, modelId }),
  });

  if (!response.ok) throw new Error("Runtime action failed");
  return (await response.json()) as RuntimeSnapshot;
}

export async function sendChat(payload: { prompt: string; modelId?: string | null; preferences: Preferences }) {
  const bridge = getBridge();
  if (bridge) return bridge.sendChat(payload);

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error("Chat failed");
  return (await response.json()) as ChatMessage;
}

export async function persistPreferences(patch: Partial<Preferences>) {
  const bridge = getBridge();
  if (bridge) return bridge.setPreferences(patch);

  const response = await fetch("/api/preferences", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });

  if (!response.ok) throw new Error("Preference update failed");
  return (await response.json()) as Preferences;
}

export async function scanModels() {
  const bridge = getBridge();
  if (!bridge) return [] as ModelRecord[];
  return bridge.scanModels();
}

export async function attachFiles() {
  const bridge = getBridge();
  if (!bridge) return [] as AttachmentRecord[];
  return bridge.attachFiles();
}

export async function importFolder() {
  const bridge = getBridge();
  if (!bridge) return [] as AttachmentRecord[];
  return bridge.importFolder();
}

export async function exportLatest() {
  const bridge = getBridge();
  if (!bridge) return null;
  return bridge.exportLatest();
}
