<script setup lang="ts">
import { ref, watch } from "vue";

type Props = {
  open: boolean;
  name: string;
  path: string;
  args: string;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", payload: { name: string; path: string; args: string }): void;
}>();

const name = ref("");
const path = ref("");
const args = ref("");

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    name.value = props.name;
    path.value = props.path;
    args.value = props.args;
  },
  { immediate: true },
);

function onSave(): void {
  emit("save", {
    name: name.value,
    path: path.value,
    args: args.value,
  });
}
</script>

<template>
  <div v-if="open" class="modal" @click.self="emit('close')">
    <div class="modal__panel" @click.stop>
      <div class="modal__title">Edit App</div>
      <label class="field">
        <div class="field__label">Name</div>
        <input v-model="name" class="field__input" />
      </label>
      <label class="field">
        <div class="field__label">Path</div>
        <input v-model="path" class="field__input" />
      </label>
      <label class="field">
        <div class="field__label">Args</div>
        <input v-model="args" class="field__input" placeholder='--flag "value with spaces"' />
      </label>
      <div class="modal__actions">
        <button class="btn" type="button" @click="emit('close')">Cancel</button>
        <button class="btn btn--primary" type="button" @click="onSave">Save</button>
      </div>
    </div>
  </div>
</template>

