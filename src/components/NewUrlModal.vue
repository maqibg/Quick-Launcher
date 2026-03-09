<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { t } from "../launcher/i18n";

type Props = {
  open: boolean;
  name: string;
  target: string;
  keywords: string;
  note: string;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", payload: { name: string; target: string; keywords: string; note: string }): void;
}>();

const name = ref("");
const target = ref("");
const keywords = ref("");
const note = ref("");

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    name.value = props.name;
    target.value = props.target;
    keywords.value = props.keywords;
    note.value = props.note;
  },
  { immediate: true },
);

const canSave = computed(() => name.value.trim() !== "" && target.value.trim() !== "");

function onSave(): void {
  if (!canSave.value) return;
  emit("save", {
    name: name.value,
    target: target.value,
    keywords: keywords.value,
    note: note.value,
  });
}
</script>

<template>
  <div v-if="open" class="modal" @click.self="emit('close')">
    <div class="modal__panel" @click.stop>
      <div class="modal__title">{{ t("createUrl.title") }}</div>
      <label class="field">
        <div class="field__label">{{ t("editor.name") }}</div>
        <input v-model="name" class="field__input" />
      </label>
      <label class="field">
        <div class="field__label">{{ t("createUrl.target") }}</div>
        <input v-model="target" class="field__input" :placeholder="t('createUrl.targetPlaceholder')" />
      </label>
      <label class="field">
        <div class="field__label">{{ t("createUrl.keywords") }}</div>
        <input v-model="keywords" class="field__input" />
      </label>
      <label class="field">
        <div class="field__label">{{ t("createUrl.note") }}</div>
        <textarea v-model="note" class="field__input field__textarea" rows="4" />
      </label>
      <div class="modal__actions">
        <button class="btn" type="button" @click="emit('close')">{{ t("common.cancel") }}</button>
        <button class="btn btn--primary" type="button" :disabled="!canSave" @click="onSave">{{ t("common.save") }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.field__textarea {
  min-height: 96px;
  padding: 10px;
  resize: vertical;
}
</style>
