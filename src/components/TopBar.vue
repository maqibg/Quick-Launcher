<script setup lang="ts">
import { t } from "../launcher/i18n";

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
  <header class="topbar" @mousedown="(e) => emit('startDragging', e)">
    <div class="topbar__drag" @dblclick="emit('toggleMaximize')">
      <div class="topbar__title">{{ title }}</div>
    </div>

    <input
      class="topbar__search"
      :placeholder="t('topbar.searchPlaceholder')"
      :value="modelValue"
      @input="onInput"
      @mousedown.stop
    />

    <div v-if="tauriRuntime" class="winControls">
      <button
        class="winBtn"
        type="button"
        :aria-label="t('window.minimize')"
        @click.stop="emit('minimize')"
      >
        <svg width="12" height="2" viewBox="0 0 12 2"><rect width="12" height="2" rx="1" fill="currentColor"/></svg>
      </button>
      <button
        class="winBtn"
        type="button"
        :aria-label="t('window.maximize')"
        @click.stop="emit('toggleMaximize')"
      >
        <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
      </button>
      <button
        class="winBtn winBtn--close"
        type="button"
        :aria-label="t('window.close')"
        @click.stop="emit('close')"
      >
        <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    </div>
  </header>
</template>
