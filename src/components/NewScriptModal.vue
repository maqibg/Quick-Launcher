<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { t } from "../launcher/i18n";

type Props = {
  open: boolean;
  name: string;
  keywords: string;
  note: string;
  content: string;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", payload: { name: string; keywords: string; note: string; content: string }): void;
}>();

const name = ref("");
const keywords = ref("");
const note = ref("");
const content = ref("");

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    name.value = props.name;
    keywords.value = props.keywords;
    note.value = props.note;
    content.value = props.content;
  },
  { immediate: true },
);

const canSave = computed(() => name.value.trim() !== "" && content.value.trim() !== "");

function onSave(): void {
  if (!canSave.value) return;
  emit("save", {
    name: name.value,
    keywords: keywords.value,
    note: note.value,
    content: content.value,
  });
}
</script>

<template>
  <div v-if="open" class="modal" @click.self="emit('close')">
    <div class="modal__panel scriptPanel" @click.stop>
      <div class="modal__title">{{ t("createScript.title") }}</div>
      <div class="scriptTop">
        <label class="field scriptTop__field">
          <div class="field__label">{{ t("editor.name") }}</div>
          <input v-model="name" class="field__input" />
        </label>
        <label class="field scriptTop__field">
          <div class="field__label">{{ t("createUrl.keywords") }}</div>
          <input v-model="keywords" class="field__input" />
        </label>
      </div>
      <label class="field">
        <div class="field__label">{{ t("createUrl.note") }}</div>
        <input v-model="note" class="field__input" />
      </label>
      <label class="field">
        <div class="field__label">{{ t("createScript.content") }}</div>
        <textarea
          v-model="content"
          class="field__input scriptPanel__textarea"
          rows="14"
          spellcheck="false"
        />
      </label>
      <div class="modal__actions">
        <button class="btn" type="button" @click="emit('close')">{{ t("common.cancel") }}</button>
        <button class="btn btn--primary" type="button" :disabled="!canSave" @click="onSave">{{ t("common.save") }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scriptPanel {
  width: min(860px, calc(100vw - 32px));
}

.scriptTop {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.scriptTop__field {
  min-width: 0;
}

.scriptPanel__textarea {
  min-height: 360px;
  padding: 10px;
  resize: vertical;
  font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace;
}
</style>
