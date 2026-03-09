<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { getBuiltinId, getEntryKind, getUrlTarget } from "../launcher/customEntries";
import { t } from "../launcher/i18n";

type Props = {
  open: boolean;
  name: string;
  path: string;
  args: string;
  runAsAdmin: boolean;
  keywords: string;
  note: string;
  content: string;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", payload: {
    name: string;
    path: string;
    args: string;
    runAsAdmin: boolean;
    keywords: string;
    note: string;
    content: string;
  }): void;
}>();

const name = ref("");
const path = ref("");
const args = ref("");
const runAsAdmin = ref(false);
const keywords = ref("");
const note = ref("");
const content = ref("");

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    name.value = props.name;
    path.value = props.path;
    args.value = props.args;
    runAsAdmin.value = props.runAsAdmin;
    keywords.value = props.keywords;
    note.value = props.note;
    content.value = props.content;
  },
  { immediate: true },
);

const kind = computed(() => getEntryKind(props.path));
const isDesktop = computed(() => kind.value === "desktop" || kind.value === "uwp");
const isUrl = computed(() => kind.value === "url");
const isScript = computed(() => kind.value === "script");
const isBuiltin = computed(() => kind.value === "builtin");
const pathInput = computed({
  get: () => (isUrl.value ? getUrlTarget(path.value) : path.value),
  set: (value: string) => {
    path.value = isUrl.value ? `url:${value}` : value;
  },
});

const canSave = computed(() => {
  if (name.value.trim() === "") return false;
  if (isScript.value) return content.value.trim() !== "";
  if (isBuiltin.value) return true;
  return pathInput.value.trim() !== "";
});
const supportsRunAsAdmin = computed(() => kind.value === "desktop" || kind.value === "script");
const builtinId = computed(() => getBuiltinId(props.path));

function onSave(): void {
  if (!canSave.value) return;
  emit("save", {
    name: name.value,
    path: path.value,
    args: args.value,
    runAsAdmin: supportsRunAsAdmin.value ? runAsAdmin.value : false,
    keywords: keywords.value,
    note: note.value,
    content: content.value,
  });
}
</script>

<template>
  <div v-if="open" class="modal" @click.self="emit('close')">
    <div class="modal__panel editorPanel" @click.stop>
      <div class="modal__title">{{ t("editor.title") }}</div>
      <label class="field">
        <div class="field__label">{{ t("editor.name") }}</div>
        <input v-model="name" class="field__input" />
      </label>

      <label v-if="isDesktop || isUrl" class="field">
        <div class="field__label">{{ isUrl ? t("createUrl.target") : t("editor.path") }}</div>
        <input v-model="pathInput" class="field__input" />
      </label>

      <label v-if="isDesktop" class="field">
        <div class="field__label">{{ t("editor.args") }}</div>
        <input v-model="args" class="field__input" :placeholder="t('editor.argsPlaceholder')" />
      </label>

      <label v-if="isScript" class="field">
        <div class="field__label">{{ t("createScript.content") }}</div>
        <textarea
          v-model="content"
          class="field__input editorPanel__textarea"
          rows="14"
          spellcheck="false"
        />
      </label>

      <label v-if="!isDesktop" class="field">
        <div class="field__label">{{ t("createUrl.keywords") }}</div>
        <input v-model="keywords" class="field__input" />
      </label>

      <label v-if="!isDesktop" class="field">
        <div class="field__label">{{ t("createUrl.note") }}</div>
        <textarea v-model="note" class="field__input editorPanel__note" rows="4" />
      </label>

      <div v-if="isBuiltin" class="field__hint">{{ t("builtin.itemLabel", { id: builtinId ?? "" }) }}</div>

      <label class="editorCheck">
        <input
          v-model="runAsAdmin"
          class="editorCheck__input"
          type="checkbox"
          :disabled="!supportsRunAsAdmin"
        />
        <span class="editorCheck__label">{{ t("editor.runAsAdmin") }}</span>
      </label>
      <div v-if="!supportsRunAsAdmin" class="field__hint">{{ t("editor.runAsAdminUnsupported") }}</div>
      <div class="modal__actions">
        <button class="btn" type="button" @click="emit('close')">{{ t("common.cancel") }}</button>
        <button class="btn btn--primary" type="button" :disabled="!canSave" @click="onSave">{{ t("common.save") }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editorCheck {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface-input);
}

.editorCheck__input {
  width: 16px;
  height: 16px;
}

.editorCheck__label {
  font-size: 13px;
  opacity: 0.92;
}

.editorPanel {
  width: min(860px, calc(100vw - 32px));
}

.editorPanel__textarea,
.editorPanel__note {
  padding: 10px;
  resize: vertical;
}

.editorPanel__textarea {
  min-height: 320px;
  font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace;
}

.editorPanel__note {
  min-height: 96px;
}
</style>
