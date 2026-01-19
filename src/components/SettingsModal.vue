<script setup lang="ts">
import { ref, watch } from "vue";
import { FONT_FAMILY_OPTIONS } from "../launcher/fonts";

type Props = {
  open: boolean;
  cardWidth: number;
  cardHeight: number;
  toggleHotkey: string;
  theme: string;
  sidebarWidth: number;
  fontFamily: string;
  fontSize: number;
  cardFontSize: number;
  cardIconScale: number;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "updateCardWidth", value: number): void;
  (e: "updateCardHeight", value: number): void;
  (e: "applyHotkey", value: string): void;
  (e: "updateTheme", value: string): void;
  (e: "updateSidebarWidth", value: number): void;
  (e: "updateFontFamily", value: string): void;
  (e: "updateFontSize", value: number): void;
  (e: "updateCardFontSize", value: number): void;
  (e: "updateCardIconScale", value: number): void;
}>();

const cardWidth = ref(120);
const cardHeight = ref(96);
const toggleHotkey = ref("");
const theme = ref("dark");
const sidebarWidth = ref(150);
const fontFamily = ref("system");
const fontSize = ref(14);
const cardFontSize = ref(12);
const cardIconScale = ref(48);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    cardWidth.value = props.cardWidth;
    cardHeight.value = props.cardHeight;
    toggleHotkey.value = props.toggleHotkey;
    theme.value = props.theme;
    sidebarWidth.value = props.sidebarWidth;
    fontFamily.value = props.fontFamily;
    fontSize.value = props.fontSize;
    cardFontSize.value = props.cardFontSize;
    cardIconScale.value = props.cardIconScale;
  },
  { immediate: true },
);

function onWidthInput(ev: Event): void {
  const raw = (ev.target as HTMLInputElement).value;
  const next = Number(raw);
  if (!Number.isFinite(next)) return;
  cardWidth.value = next;
  emit("updateCardWidth", next);
}

function onHeightInput(ev: Event): void {
  const raw = (ev.target as HTMLInputElement).value;
  const next = Number(raw);
  if (!Number.isFinite(next)) return;
  cardHeight.value = next;
  emit("updateCardHeight", next);
}

function onThemeChange(ev: Event): void {
  const next = (ev.target as HTMLSelectElement).value;
  theme.value = next;
  emit("updateTheme", next);
}

function onSidebarWidthInput(ev: Event): void {
  const raw = (ev.target as HTMLInputElement).value;
  const next = Number(raw);
  if (!Number.isFinite(next)) return;
  sidebarWidth.value = next;
  emit("updateSidebarWidth", next);
}

function onFontFamilyChange(ev: Event): void {
  const next = (ev.target as HTMLSelectElement).value;
  fontFamily.value = next;
  emit("updateFontFamily", next);
}

function onFontSizeInput(ev: Event): void {
  const raw = (ev.target as HTMLInputElement).value;
  const next = Number(raw);
  if (!Number.isFinite(next)) return;
  fontSize.value = next;
  emit("updateFontSize", next);
}

function onCardFontSizeInput(ev: Event): void {
  const raw = (ev.target as HTMLInputElement).value;
  const next = Number(raw);
  if (!Number.isFinite(next)) return;
  cardFontSize.value = next;
  emit("updateCardFontSize", next);
}

function onCardIconScaleInput(ev: Event): void {
  const raw = (ev.target as HTMLInputElement).value;
  const next = Number(raw);
  if (!Number.isFinite(next)) return;
  cardIconScale.value = next;
  emit("updateCardIconScale", next);
}

function onApplyHotkey(): void {
  emit("applyHotkey", toggleHotkey.value);
}
</script>

<template>
  <div v-if="open" class="modal" @click.self="emit('close')">
    <div class="modal__panel" @click.stop>
      <div class="modal__title">Settings</div>

      <label class="field">
        <div class="field__label">Theme</div>
        <select class="field__input" :value="theme" @change="onThemeChange">
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </label>

      <label class="field">
        <div class="field__label">Sidebar width</div>
        <input
          class="field__input field__input--range"
          type="range"
          min="90"
          max="320"
          step="2"
          :value="sidebarWidth"
          @input="onSidebarWidthInput"
        />
        <div class="field__hint">{{ sidebarWidth }}px</div>
      </label>

      <label class="field">
        <div class="field__label">Font</div>
        <select class="field__input" :value="fontFamily" @change="onFontFamilyChange">
          <option v-for="opt in FONT_FAMILY_OPTIONS" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </label>

      <label class="field">
        <div class="field__label">Font size</div>
        <input
          class="field__input field__input--range"
          type="range"
          min="10"
          max="22"
          step="1"
          :value="fontSize"
          @input="onFontSizeInput"
        />
        <div class="field__hint">{{ fontSize }}px</div>
      </label>

      <label class="field">
        <div class="field__label">Card width</div>
        <input
          class="field__input field__input--range"
          type="range"
          min="50"
          max="480"
          step="2"
          :value="cardWidth"
          @input="onWidthInput"
        />
        <div class="field__hint">{{ cardWidth }}px</div>
      </label>

      <label class="field">
        <div class="field__label">Card height</div>
        <input
          class="field__input field__input--range"
          type="range"
          min="40"
          max="360"
          step="2"
          :value="cardHeight"
          @input="onHeightInput"
        />
        <div class="field__hint">{{ cardHeight }}px</div>
      </label>

      <label class="field">
        <div class="field__label">Card font size</div>
        <input
          class="field__input field__input--range"
          type="range"
          min="9"
          max="18"
          step="1"
          :value="cardFontSize"
          @input="onCardFontSizeInput"
        />
        <div class="field__hint">{{ cardFontSize }}px</div>
      </label>

      <label class="field">
        <div class="field__label">Card icon size</div>
        <input
          class="field__input field__input--range"
          type="range"
          min="16"
          max="128"
          step="2"
          :value="cardIconScale"
          @input="onCardIconScaleInput"
        />
        <div class="field__hint">{{ cardIconScale }}px</div>
      </label>

      <label class="field">
        <div class="field__label">Toggle hotkey</div>
        <input
          v-model="toggleHotkey"
          class="field__input"
          placeholder="e.g. ctrl+alt+space"
        />
        <div class="field__hint">
          Example: <code>ctrl+alt+space</code> / <code>alt+space</code> / <code>ctrl+d</code>
        </div>
      </label>

      <div class="modal__actions">
        <button class="btn" type="button" @click="onApplyHotkey">Apply Hotkey</button>
        <button class="btn btn--primary" type="button" @click="emit('close')">Close</button>
      </div>
    </div>
  </div>
</template>
