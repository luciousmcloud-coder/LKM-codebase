/**
 * LKM Codebase shell reminder
 * - Keep the exact three-panel desktop structure: navigation, conversation, work surface.
 * - The outer shell must stay within the monitor at fullscreen with no clipped panels.
 * - Internal regions may scroll, but the app frame itself must remain viewport-bounded.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  ChevronDown,
  Code2,
  Cpu,
  FileCode2,
  FileText,
  FolderOpen,
  LibraryBig,
  Loader2,
  MessageSquare,
  Mic,
  Paperclip,
  Play,
  Plus,
  RefreshCcw,
  Search,
  Settings2,
  Share2,
  Sparkles,
  Square,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  attachFiles,
  exportLatest,
  importFolder,
  loadJson,
  persistPreferences,
  runtimeAction,
  scanModels,
  sendChat,
  type AttachmentRecord,
  type ChatMessage,
  type ExportRecord,
  type ModelRecord,
  type Preferences,
  type RuntimeSnapshot,
  type RuntimeState,
} from "@/lib/desktop";

const sidebarPrimary = [
  { label: "New task", icon: Plus },
  { label: "Agent", icon: Sparkles, tag: "Live" },
  { label: "Search", icon: Search },
  { label: "Library", icon: LibraryBig },
];

const taskItems = [
  "Build onboarding for local models",
  "Wire guided code tutoring mode",
  "Design export pipeline for any file type",
  "Prepare Windows desktop packaging",
  "Refine LKM Codebase app shell",
];

const fileTree = [
  { name: "client", depth: 0 },
  { name: "public", depth: 1 },
  { name: "src", depth: 1 },
  { name: "components", depth: 2 },
  { name: "contexts", depth: 2 },
  { name: "hooks", depth: 2 },
  { name: "pages", depth: 2, active: true },
  { name: "Home.tsx", depth: 3, active: true },
  { name: "App.tsx", depth: 2 },
  { name: "index.css", depth: 2 },
  { name: "desktop", depth: 0 },
  { name: "runtime", depth: 1 },
  { name: "README_LKM.md", depth: 0 },
];

const codeLines = [
  { no: 1, parts: [{ text: "// LKM Codebase desktop shell", tone: "comment" }] },
  {
    no: 2,
    parts: [
      { text: "const", tone: "keyword" },
      { text: " ", tone: "plain" },
      { text: "runtimeBridge", tone: "identifier" },
      { text: " = ", tone: "plain" },
      { text: "{", tone: "plain" },
    ],
  },
  {
    no: 3,
    parts: [
      { text: "  shell", tone: "property" },
      { text: ": ", tone: "plain" },
      { text: '"three-panel"', tone: "string" },
      { text: ",", tone: "plain" },
    ],
  },
  {
    no: 4,
    parts: [
      { text: "  modelRuntime", tone: "property" },
      { text: ": ", tone: "plain" },
      { text: '"node-llama-cpp"', tone: "string" },
      { text: ",", tone: "plain" },
    ],
  },
  {
    no: 5,
    parts: [
      { text: "  fileIO", tone: "property" },
      { text: ": ", tone: "plain" },
      { text: '"native"', tone: "string" },
      { text: ",", tone: "plain" },
    ],
  },
  {
    no: 6,
    parts: [
      { text: "  teachingMode", tone: "property" },
      { text: ": ", tone: "plain" },
      { text: "true", tone: "boolean" },
      { text: ",", tone: "plain" },
    ],
  },
  { no: 7, parts: [{ text: "};", tone: "plain" }] },
  {
    no: 9,
    parts: [
      { text: "export", tone: "keyword" },
      { text: " ", tone: "plain" },
      { text: "async", tone: "keyword" },
      { text: " ", tone: "plain" },
      { text: "function", tone: "keyword" },
      { text: " ", tone: "plain" },
      { text: "loadSelectedModel", tone: "function" },
      { text: "(model)", tone: "plain" },
      { text: " {", tone: "plain" },
    ],
  },
  {
    no: 10,
    parts: [
      { text: "  return", tone: "keyword" },
      { text: " ", tone: "plain" },
      { text: "runtimeBridge.start", tone: "function" },
      { text: "(model.path);", tone: "plain" },
    ],
  },
  { no: 11, parts: [{ text: "}", tone: "plain" }] },
];

const defaultPreferences: Preferences = {
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

const starterMessages = [
  {
    id: "sys-1",
    role: "system",
    title: "Desktop mode",
    content:
      "This workspace now uses the confirmed LKM Codebase shell and is ready to be connected to a packaged local runtime.",
  },
  {
    id: "user-1",
    role: "user",
    content:
      "Create a Windows-first local AI coding workspace that loads my chosen model, explains code clearly, and lets me import or export files.",
  },
  {
    id: "assistant-1",
    role: "assistant",
    title: "LKM Codebase",
    status: "Desktop bridge ready",
    content:
      "I will keep the navigation, chat, and code surfaces visible at all times while the local model runner and native file workflows are connected behind the interface.",
    explanation:
      "The final desktop build uses a main-process runtime bridge so the model engine and filesystem stay local to your machine.",
  },
] as const;

function runtimeBadgeClass(state: RuntimeState) {
  switch (state) {
    case "ready":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "running":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "loading":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "error":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-white text-slate-600";
  }
}

function gradientButtonClass(kind: "primary" | "secondary" | "success") {
  if (kind === "secondary") {
    return "border-0 bg-gradient-to-r from-blue-500 via-sky-500 to-emerald-500 text-white shadow-[0_16px_40px_rgba(14,165,233,0.28)] hover:opacity-95";
  }
  if (kind === "success") {
    return "border-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 text-white shadow-[0_16px_40px_rgba(16,185,129,0.26)] hover:opacity-95";
  }
  return "border-0 bg-gradient-to-r from-orange-500 via-amber-500 to-blue-500 text-white shadow-[0_18px_42px_rgba(249,115,22,0.28)] hover:opacity-95";
}

function codeToneClass(tone: string) {
  switch (tone) {
    case "comment":
      return "text-emerald-600";
    case "keyword":
      return "text-blue-600 font-semibold";
    case "identifier":
      return "text-slate-900 font-medium";
    case "property":
      return "text-orange-600";
    case "string":
      return "text-green-600";
    case "function":
      return "text-violet-600 font-medium";
    case "boolean":
      return "text-cyan-600 font-semibold";
    default:
      return "text-slate-700";
  }
}

export default function Home() {
  const [models, setModels] = useState<ModelRecord[]>([]);
  const [runtime, setRuntime] = useState<RuntimeSnapshot | null>(null);
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [attachments, setAttachments] = useState<AttachmentRecord[]>([]);
  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages as unknown as ChatMessage[]);
  const [composer, setComposer] = useState("");
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isScanningModels, setIsScanningModels] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      setIsBootstrapping(true);
      const [modelData, runtimeData, preferenceData, attachmentData, exportData] = await Promise.all([
        loadJson<ModelRecord[]>("/api/models", []),
        loadJson<RuntimeSnapshot>("/api/runtime", {
          state: "idle",
          activeModelId: null,
          statusText: "No local model is loaded yet.",
          health: "stable",
          contextWindow: 8192,
          cpuOffload: 24,
          launchOnStartup: true,
        }),
        loadJson<Preferences>("/api/preferences", defaultPreferences),
        loadJson<AttachmentRecord[]>("/api/attachments", []),
        loadJson<ExportRecord[]>("/api/exports", []),
      ]);

      setModels(modelData);
      setRuntime(runtimeData);
      setPreferences(preferenceData);
      setAttachments(attachmentData);
      setExports(exportData);
      setSelectedModelId(runtimeData.activeModelId ?? modelData[0]?.id ?? null);
      setIsBootstrapping(false);
    }

    void bootstrap();
  }, []);

  const activeModel = useMemo(
    () => models.find((model) => model.id === (selectedModelId ?? runtime?.activeModelId ?? "")) ?? null,
    [models, runtime?.activeModelId, selectedModelId],
  );

  async function handleRuntimeAction(action: "start" | "stop" | "refresh") {
    if (!runtime) return;
    if (action === "refresh") {
      const refreshed = await loadJson<RuntimeSnapshot>("/api/runtime", runtime);
      setRuntime(refreshed);
      return;
    }

    const optimisticState: RuntimeState = action === "start" ? "loading" : "stopped";
    setRuntime({
      ...runtime,
      state: optimisticState,
      activeModelId: selectedModelId,
      statusText:
        action === "start"
          ? "Preparing the selected local model in the built-in LKM Codebase runtime."
          : "The local runtime is stopping and control is returning to you.",
    });

    try {
      const nextRuntime = await runtimeAction(action, selectedModelId);
      setRuntime(nextRuntime);
      if (nextRuntime.activeModelId) setSelectedModelId(nextRuntime.activeModelId);
      const nextModels = await loadJson<ModelRecord[]>("/api/models", models);
      setModels(nextModels);
    } catch {
      setRuntime({
        ...runtime,
        state: "error",
        statusText: "The local runtime could not complete the requested action.",
      });
    }
  }

  async function handleSend() {
    if (!composer.trim()) return;
    setIsSending(true);

    const nextUserMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: composer,
    } as const;

    setMessages((current) => [...current, nextUserMessage as unknown as ChatMessage]);
    setComposer("");

    try {
      const payload = await sendChat({ prompt: nextUserMessage.content, modelId: selectedModelId, preferences });
      setMessages((current) => [...current, payload]);
      const nextRuntime = await loadJson<RuntimeSnapshot>("/api/runtime", runtime ?? {
        state: "idle",
        activeModelId: null,
        statusText: "No local model is loaded yet.",
        health: "stable",
        contextWindow: 8192,
        cpuOffload: 24,
        launchOnStartup: true,
      });
      setRuntime(nextRuntime);
      const nextExports = await loadJson<ExportRecord[]>("/api/exports", exports);
      setExports(nextExports);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          title: "Runtime status",
          content:
            "The local runtime is not ready yet. Load a GGUF model first, then send your coding request again.",
          explanation:
            "Once a model is loaded, LKM Codebase will send your prompt directly through the local main-process runtime bridge.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function handleAttachFiles() {
    setIsImporting(true);
    try {
      const nextAttachments = await attachFiles();
      if (nextAttachments.length) setAttachments(nextAttachments);
    } finally {
      setIsImporting(false);
    }
  }

  async function handleImportFolder() {
    setIsImporting(true);
    try {
      const nextAttachments = await importFolder();
      if (nextAttachments.length) setAttachments(nextAttachments);
    } finally {
      setIsImporting(false);
    }
  }

  async function handleScanModels() {
    setIsScanningModels(true);
    try {
      const discovered = await scanModels();
      if (discovered.length) {
        setModels(discovered);
        setSelectedModelId((current) => current ?? discovered[0]?.id ?? null);
      }
      const nextRuntime = await loadJson<RuntimeSnapshot>("/api/runtime", runtime ?? {
        state: "idle",
        activeModelId: null,
        statusText: "No local model is loaded yet.",
        health: "stable",
        contextWindow: 8192,
        cpuOffload: 24,
        launchOnStartup: true,
      });
      setRuntime(nextRuntime);
    } finally {
      setIsScanningModels(false);
    }
  }

  async function handleExportLatest() {
    const exported = await exportLatest();
    if (exported) {
      const nextExports = await loadJson<ExportRecord[]>("/api/exports", exports);
      setExports(nextExports);
    }
  }

  function togglePreference<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setPreferences((current) => {
      const next = { ...current, [key]: value };
      void persistPreferences({ [key]: value } as Partial<Preferences>);
      return next;
    });
  }

  return (
    <div className="h-screen overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_55%,#eef6ff_100%)] text-slate-900">
      <div className="grid h-full grid-cols-[250px_minmax(0,1fr)_minmax(320px,500px)] overflow-hidden xl:grid-cols-[280px_minmax(0,1fr)_minmax(340px,520px)]">
        <aside className="flex h-full min-h-0 flex-col overflow-hidden border-r border-slate-200 bg-white/90 px-5 py-5 shadow-[12px_0_40px_rgba(15,23,42,0.05)] backdrop-blur">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-blue-500 to-emerald-500 text-white shadow-lg">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold tracking-tight text-slate-900">LKM Codebase</p>
              <p className="truncate text-sm text-slate-500">Windows-first local AI workspace</p>
            </div>
          </div>

          <div className="mt-8 space-y-2">
            {sidebarPrimary.map((item) => (
              <button
                key={item.label}
                type="button"
                className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <item.icon className="h-4 w-4 shrink-0 text-slate-500" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.tag ? <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] text-blue-700">{item.tag}</span> : null}
              </button>
            ))}
          </div>

          <div className="mt-8 flex min-h-0 flex-1 flex-col">
            <div className="mb-3 flex items-center justify-between px-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">All tasks</p>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-500 hover:bg-slate-100">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="min-h-0 flex-1 pr-2">
              <div className="space-y-2">
                {taskItems.map((task, index) => (
                  <button
                    key={task}
                    type="button"
                    className={`w-full rounded-2xl border px-3 py-3 text-left text-sm transition ${
                      index === 0
                        ? "border-transparent bg-gradient-to-r from-orange-50 via-blue-50 to-emerald-50 shadow-sm"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <p className="line-clamp-2 font-medium text-slate-800">{task}</p>
                    <p className="mt-1 text-xs text-slate-500">Preview queue</p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="mt-6 shrink-0 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">Share LKM Codebase</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              The final app will support exports, agent sharing, and guided project handoffs.
            </p>
            <Button className={`mt-4 w-full ${gradientButtonClass("secondary")}`}>
              <Share2 className="mr-2 h-4 w-4" />
              Share preview
            </Button>
          </div>
        </aside>

        <section className="flex h-full min-h-0 flex-col overflow-hidden border-r border-slate-200 bg-[#fcfdff] px-6 py-5">
          <header className="shrink-0 border-b border-slate-200 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Button variant="ghost" className="max-w-full rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                  <ChevronDown className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">LKM Codebase Desktop</span>
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Badge variant="outline" className={`max-w-full rounded-full px-3 py-1 ${runtimeBadgeClass(runtime?.state ?? "idle")}`}>
                  <Cpu className="mr-2 h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{runtime?.statusText ?? "Loading runtime status..."}</span>
                </Badge>
                <Button variant="outline" className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50" onClick={() => void handleRuntimeAction("refresh")}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button className={`rounded-xl ${gradientButtonClass("primary")}`} onClick={() => void handleRuntimeAction("stop")}>
                  <Square className="mr-2 h-4 w-4" />
                  Stop
                </Button>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button className={`rounded-xl ${gradientButtonClass("secondary")}`}>
                      <Settings2 className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full overflow-y-auto border-slate-200 bg-white text-slate-900 sm:max-w-lg">
                    <SheetHeader>
                      <SheetTitle>LKM Codebase settings</SheetTitle>
                      <SheetDescription>
                        The learning aids start enabled by default so code remains easy to inspect from the first launch.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-8 space-y-4">
                      <PreferenceRow
                        title="Syntax highlighting"
                        description="Keep keywords, strings, comments, and function names visually distinct."
                        checked={preferences.syntaxHighlighting}
                        onCheckedChange={(checked) => togglePreference("syntaxHighlighting", checked)}
                      />
                      <PreferenceRow
                        title="Code categories"
                        description="Overlay UI, logic, configuration, and file-related cues for easier learning."
                        checked={preferences.codeCategories}
                        onCheckedChange={(checked) => togglePreference("codeCategories", checked)}
                      />
                      <PreferenceRow
                        title="Inline explanations"
                        description="Show plain-English context under important code and workflow updates."
                        checked={preferences.inlineExplanations}
                        onCheckedChange={(checked) => togglePreference("inlineExplanations", checked)}
                      />
                      <PreferenceRow
                        title="Split view"
                        description="Keep chat and code visible side by side in the working layout."
                        checked={preferences.splitView}
                        onCheckedChange={(checked) => togglePreference("splitView", checked)}
                      />
                      <PreferenceRow
                        title="Guided mode"
                        description="Require explanations before major code changes or tool actions."
                        checked={preferences.guidedLearningMode}
                        onCheckedChange={(checked) => togglePreference("guidedLearningMode", checked)}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-4 pt-4">
            <ScrollArea className="min-h-0 rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_50px_rgba(15,23,42,0.06)]">
              <div className="space-y-4 p-5">
                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={`rounded-[24px] border p-4 ${
                      message.role === "assistant"
                        ? "border-blue-100 bg-blue-50/60"
                        : message.role === "system"
                          ? "border-emerald-100 bg-emerald-50/70"
                          : "border-orange-100 bg-orange-50/70"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {message.title ?? (message.role === "user" ? "You" : "LKM Codebase")}
                        </p>
                        {message.status ? <p className="mt-1 text-xs text-slate-500">{message.status}</p> : null}
                      </div>
                      <Badge variant="outline" className="rounded-full border-slate-200 bg-white text-slate-600 capitalize">
                        {message.role}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-700">{message.content}</p>
                    {preferences.inlineExplanations && message.explanation ? (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-600">
                        <p className="mb-2 font-semibold text-slate-900">Why this matters</p>
                        <p>{message.explanation}</p>
                      </div>
                    ) : null}
                  </article>
                ))}

                <Card className="rounded-[28px] border-slate-200 bg-[linear-gradient(135deg,rgba(249,115,22,0.08),rgba(59,130,246,0.08),rgba(16,185,129,0.08))] shadow-none">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="border-orange-200 bg-white text-orange-700">
                        Any file type
                      </Badge>
                      <Badge variant="outline" className="border-blue-200 bg-white text-blue-700">
                        Code tutoring on
                      </Badge>
                      <Badge variant="outline" className="border-emerald-200 bg-white text-emerald-700">
                        Local-first workflow
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>

            <div className="shrink-0 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50" onClick={() => void handleAttachFiles()} disabled={isImporting}>
                    <Paperclip className="mr-2 h-4 w-4" />
                    Attach files
                  </Button>
                  <Button variant="outline" className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50" onClick={() => void handleImportFolder()} disabled={isImporting}>
                    <Upload className="mr-2 h-4 w-4" />
                    Import folder
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" className="h-10 w-10 rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50">
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button className={`rounded-xl ${gradientButtonClass("success")}`} onClick={() => void handleSend()} disabled={isSending}>
                    {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Send to LKM Codebase
                  </Button>
                </div>
              </div>
              <Textarea
                value={composer}
                onChange={(event) => setComposer(event.target.value)}
                placeholder="Describe what you want LKM Codebase to build, inspect, explain, or export..."
                className="min-h-[112px] max-h-[22vh] rounded-2xl border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>
        </section>

        <section className="flex h-full min-h-0 flex-col overflow-hidden bg-white px-5 py-5">
          <header className="shrink-0 border-b border-slate-200 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                  <Code2 className="mr-2 h-4 w-4" />
                  Code
                </Button>
                <Button variant="outline" className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Explain
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button className={`rounded-xl ${gradientButtonClass("primary")}`}>Publish preview</Button>
              </div>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-[200px_minmax(0,1fr)] gap-4 pt-4 xl:grid-cols-[220px_minmax(0,1fr)]">
            <Card className="rounded-[28px] border-slate-200 bg-slate-50 shadow-none">
              <CardContent className="flex h-full min-h-0 flex-col p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                  File tree
                </div>
                <ScrollArea className="min-h-0 flex-1 pr-2">
                  <div className="space-y-1">
                    {fileTree.map((item) => (
                      <button
                        key={`${item.depth}-${item.name}`}
                        type="button"
                        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm ${
                          item.active ? "bg-white font-medium text-slate-900 shadow-sm" : "text-slate-600 hover:bg-white"
                        }`}
                        style={{ paddingLeft: `${12 + item.depth * 14}px` }}
                      >
                        {item.name.endsWith(".tsx") || item.name.endsWith(".css") || item.name.endsWith(".md") ? (
                          <FileCode2 className="h-4 w-4 shrink-0 text-orange-500" />
                        ) : (
                          <FolderOpen className="h-4 w-4 shrink-0 text-blue-500" />
                        )}
                        <span className="truncate">{item.name}</span>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-slate-200 bg-white shadow-[0_22px_50px_rgba(15,23,42,0.06)]">
              <CardContent className="flex h-full min-h-0 flex-col p-0">
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">client / src / pages / Home.tsx</p>
                    <p className="truncate text-xs text-slate-500">Color-categorized code preview for beginner-friendly inspection</p>
                  </div>
                  <div className="hidden items-center gap-2 xl:flex">
                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                      UI
                    </Badge>
                    <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                      Logic
                    </Badge>
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                      Files
                    </Badge>
                  </div>
                </div>

                <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px]">
                  <ScrollArea className="min-h-0 border-r border-slate-200 bg-[#f8fbff]">
                    <div className="w-max min-w-full py-3 font-mono text-[13px] leading-7">
                      {codeLines.map((line) => (
                        <div key={line.no} className="grid grid-cols-[52px_minmax(0,1fr)] px-4 hover:bg-white/80">
                          <span className="select-none pr-4 text-right text-slate-400">{line.no}</span>
                          <span className="whitespace-pre">
                            {line.parts.map((part, index) => (
                              <span key={`${line.no}-${index}`} className={codeToneClass(part.tone)}>
                                {part.text}
                              </span>
                            ))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <ScrollArea className="min-h-0 bg-white">
                    <div className="space-y-4 p-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-900">Code guide</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          Blue highlights keywords and control flow, orange marks named properties or UI-facing values, and green marks comments or string content. This makes the code easier to scan when you are learning.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900">Active model</p>
                          <Button variant="outline" size="sm" className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50" onClick={() => void handleScanModels()} disabled={isScanningModels}>
                            {isScanningModels ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <FolderOpen className="mr-2 h-3.5 w-3.5" />}
                            Scan GGUF
                          </Button>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          {activeModel ? `${activeModel.name} · ${activeModel.sizeLabel}` : "Choose a model from the library."}
                        </p>
                        <Separator className="my-4" />
                        {isBootstrapping ? (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Scanning local models...
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {models.length ? (
                              models.slice(0, 4).map((model) => (
                                <button
                                  key={model.id}
                                  type="button"
                                  onClick={() => setSelectedModelId(model.id)}
                                  className={`w-full rounded-2xl border px-3 py-3 text-left text-sm ${
                                    selectedModelId === model.id ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="font-medium text-slate-800">{model.name}</span>
                                    <span className="text-xs text-slate-500">{model.sizeLabel}</span>
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                                No GGUF models have been scanned yet. Use <strong>Scan GGUF</strong> to select a local model folder.
                              </div>
                            )}
                            <div className="grid gap-2 pt-2">
                              <Button className={gradientButtonClass("primary")} onClick={() => void handleRuntimeAction("start")} disabled={!selectedModelId || isBootstrapping}>
                                <Play className="mr-2 h-4 w-4" />
                                Load model
                              </Button>
                              <Button variant="outline" className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50" onClick={() => void handleExportLatest()}>
                                <FileText className="mr-2 h-4 w-4" />
                                Export latest
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-900">Attached files</p>
                        <div className="mt-3 space-y-2">
                          {(attachments.length
                            ? attachments
                            : [{ id: "preview-file", name: "product-spec.md", mime: "text/markdown", sizeLabel: "12 KB", status: "attached" as const }]
                          ).map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                              <span className="flex min-w-0 items-center gap-2 text-slate-700">
                                <FileText className="h-4 w-4 shrink-0 text-emerald-600" />
                                <span className="truncate">{item.name}</span>
                              </span>
                              <span className="shrink-0 text-xs text-slate-500">{item.sizeLabel}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 rounded-xl bg-gradient-to-r from-orange-50 via-blue-50 to-emerald-50 p-3 text-xs leading-6 text-slate-600">
                          Native file dialogs are used for imports and exports in the desktop build so files never have to leave your machine.
                        </div>
                        <div className="mt-3 text-xs text-slate-500">Exports ready: {exports.length}</div>
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}

type PreferenceRowProps = {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

function PreferenceRow({ title, description, checked, onCheckedChange }: PreferenceRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
