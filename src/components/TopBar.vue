<script setup lang="ts">
type Props = {
  title: string;
  modelValue: string;
  tauriRuntime: boolean;
};

defineProps<Props>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "minimize"): void;
  (e: "toggleMaximize"): void;
  (e: "close"): void;
  (e: "startDragging", ev: MouseEvent): void;
}>();

function onInput(ev: Event): void {
  emit("update:modelValue", (ev.target as HTMLInputElement).value);
}
</script>

<template>
  <header class="topbar" data-tauri-drag-region @mousedown="(e) => emit('startDragging', e)">
    <div class="topbar__drag" data-tauri-drag-region @dblclick="emit('toggleMaximize')">
      <div class="topbar__title" data-tauri-drag-region>{{ title }}</div>
    </div>

    <div class="topbar__right">
      <input
        class="topbar__search"
        placeholder="Search..."
        :value="modelValue"
        @input="onInput"
      />

      <div v-if="tauriRuntime" class="winControls">
        <button class="winBtn" type="button" aria-label="Minimize" @click="emit('minimize')">
          —
        </button>
        <button class="winBtn" type="button" aria-label="Maximize" @click="emit('toggleMaximize')">
          ☐
        </button>
        <button class="winBtn winBtn--close" type="button" aria-label="Close" @click="emit('close')">
          ×
        </button>
      </div>
    </div>
  </header>
</template>

