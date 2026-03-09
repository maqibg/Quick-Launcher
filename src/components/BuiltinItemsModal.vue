<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { getBuiltinFallbackIcon, type BuiltinItem } from "../launcher/customEntries";
import { t } from "../launcher/i18n";

type Props = {
  open: boolean;
  items: BuiltinItem[];
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "select", item: BuiltinItem): void;
}>();

const search = ref("");
const icons = ref<Record<string, string>>({});
const isTauriRuntime =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

watch(
  () => props.open,
  (open) => {
    if (open) {
      search.value = "";
      void loadIcons();
    }
  },
);

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return props.items;
  return props.items.filter((item) =>
    `${item.name} ${item.description}`.toLowerCase().includes(q),
  );
});

async function loadIcons(): Promise<void> {
  if (!isTauriRuntime) return;
  const missing = props.items.filter((item) => !item.preferBuiltinIcon && !icons.value[item.id]);
  await Promise.all(
    missing.map(async (item) => {
      try {
        const icon = (await invoke("get_file_icon", {
          path: `builtin:${item.id}`,
          size: 48,
        })) as string | null;
        if (icon) {
          icons.value = { ...icons.value, [item.id]: icon };
        }
      } catch {
        // keep fallback badge
      }
    }),
  );
}
</script>

<template>
  <div v-if="open" class="modal" @click.self="emit('close')">
    <div class="modal__panel builtinPanel" @click.stop>
      <div class="modal__title">{{ t("builtin.title") }}</div>
      <input
        v-model="search"
        class="field__input"
        :placeholder="t('builtin.searchPlaceholder')"
      />
      <div class="builtinGrid">
        <button
          v-for="item in filtered"
          :key="item.id"
          class="builtinCard"
          type="button"
          @click="emit('select', item)"
        >
          <div
            class="builtinCard__icon"
            :class="{ 'builtinCard__icon--image': true }"
            :style="{ '--icon-start': item.colorStart, '--icon-end': item.colorEnd }"
          >
            <img
              v-if="icons[item.id] || getBuiltinFallbackIcon(item)"
              class="builtinCard__iconImg"
              :src="icons[item.id] || getBuiltinFallbackIcon(item)"
              :alt="item.name"
              draggable="false"
            />
          </div>
          <div class="builtinCard__name">{{ item.name }}</div>
          <div class="builtinCard__desc">{{ item.description }}</div>
        </button>
      </div>
      <div class="modal__actions">
        <button class="btn btn--primary" type="button" @click="emit('close')">{{ t("common.close") }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.builtinPanel {
  width: min(880px, calc(100vw - 32px));
}

.builtinGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  max-height: 560px;
  overflow: auto;
}

.builtinCard {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 10px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--surface-input);
  color: inherit;
  cursor: pointer;
  text-align: center;
}

.builtinCard:hover {
  background: var(--surface-hover);
}

.builtinCard__icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--icon-start), var(--icon-end));
  color: white;
  font-size: 14px;
  font-weight: 700;
}

.builtinCard__icon--image {
  background: rgba(255, 255, 255, 0.06);
}

.builtinCard__iconImg {
  width: 30px;
  height: 30px;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.28));
}

.builtinCard__name {
  font-size: 13px;
  font-weight: 600;
}

.builtinCard__desc {
  font-size: 11px;
  opacity: 0.72;
  line-height: 1.35;
}
</style>
