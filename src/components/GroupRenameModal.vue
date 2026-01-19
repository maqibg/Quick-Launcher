<script setup lang="ts">
import { nextTick, ref, watch } from "vue";

type Props = {
  open: boolean;
  name: string;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", name: string): void;
}>();

const name = ref("");
const inputEl = ref<HTMLInputElement | null>(null);

watch(
  () => props.open,
  async (open) => {
    if (!open) return;
    name.value = props.name;
    await nextTick();
    inputEl.value?.focus();
    inputEl.value?.select();
  },
  { immediate: true },
);

function onSave(): void {
  emit("save", name.value);
}

function onKeydown(ev: KeyboardEvent): void {
  if (ev.key === "Enter") {
    onSave();
  } else if (ev.key === "Escape") {
    emit("close");
  }
}
</script>

<template>
  <div v-if="open" class="modal" @click.self="emit('close')">
    <div class="modal__panel" @click.stop>
      <div class="modal__title">Rename Group</div>
      <label class="field">
        <div class="field__label">Group name</div>
        <input
          ref="inputEl"
          v-model="name"
          class="field__input"
          @keydown="onKeydown"
        />
      </label>
      <div class="modal__actions">
        <button class="btn" type="button" @click="emit('close')">Cancel</button>
        <button class="btn btn--primary" type="button" @click="onSave">Save</button>
      </div>
    </div>
  </div>
</template>

