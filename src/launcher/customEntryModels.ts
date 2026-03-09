import { reactive, ref } from "vue";
import type { AppEntry, Group } from "./types";
import {
  BUILTIN_ITEMS,
  createBuiltinEntry,
  createScriptEntry,
  createUrlEntry,
  type BuiltinItem,
} from "./customEntries";
import { t } from "./i18n";

type Options = {
  getActiveGroup: () => Group | undefined;
  hydrateEntryIcons: (entries: AppEntry[]) => Promise<void> | void;
  scheduleSave: () => void;
  showToast: (message: string) => void;
  onStructureChanged?: () => void;
};

export function createCustomEntryModels(options: Options) {
  const url = reactive({
    open: false,
    name: "",
    target: "https://",
    keywords: "",
    note: "",
  });

  const script = reactive({
    open: false,
    name: "",
    keywords: "",
    note: "",
    content: "# PowerShell script\n\n",
  });

  const builtinOpen = ref(false);

  function commitEntry(entry: AppEntry): void {
    const group = options.getActiveGroup();
    if (!group) return;
    group.apps.unshift(entry);
    void options.hydrateEntryIcons([entry]);
    options.onStructureChanged?.();
    options.scheduleSave();
    options.showToast(t("toast.addedItems", { count: 1 }));
  }

  function openUrl(): void {
    url.open = true;
    url.name = "";
    url.target = "https://";
    url.keywords = "";
    url.note = "";
  }

  function closeUrl(): void {
    url.open = false;
  }

  function saveUrl(payload: {
    name: string;
    target: string;
    keywords: string;
    note: string;
  }): void {
    const entry = createUrlEntry(payload);
    commitEntry(entry);
    closeUrl();
  }

  function openScript(): void {
    script.open = true;
    script.name = "";
    script.keywords = "";
    script.note = "";
    script.content = "# PowerShell script\n\n";
  }

  function closeScript(): void {
    script.open = false;
  }

  function saveScript(payload: {
    name: string;
    keywords: string;
    note: string;
    content: string;
  }): void {
    const entry = createScriptEntry(payload);
    commitEntry(entry);
    closeScript();
  }

  function openBuiltin(): void {
    builtinOpen.value = true;
  }

  function closeBuiltin(): void {
    builtinOpen.value = false;
  }

  function addBuiltin(item: BuiltinItem): void {
    commitEntry(createBuiltinEntry(item));
    closeBuiltin();
  }

  return {
    url,
    script,
    builtinOpen,
    builtinItems: BUILTIN_ITEMS,
    openUrl,
    closeUrl,
    saveUrl,
    openScript,
    closeScript,
    saveScript,
    openBuiltin,
    closeBuiltin,
    addBuiltin,
  };
}
