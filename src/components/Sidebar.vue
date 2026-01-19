<script setup lang="ts">
import type { Group } from "../launcher/types";

type Props = {
  groups: Group[];
  activeGroupId: string;
};

defineProps<Props>();

const emit = defineEmits<{
  (e: "selectGroup", id: string): void;
  (e: "contextmenuBlank", ev: MouseEvent): void;
  (e: "contextmenuGroup", ev: MouseEvent, id: string): void;
}>();
</script>

<template>
  <aside class="sidebar" @contextmenu.stop="(e) => emit('contextmenuBlank', e)">
    <div class="sidebar__groups">
      <button
        v-for="g in groups"
        :key="g.id"
        class="group"
        :class="{ 'group--active': g.id === activeGroupId }"
        type="button"
        @click="emit('selectGroup', g.id)"
        @contextmenu.stop="(e) => emit('contextmenuGroup', e, g.id)"
      >
        <span class="group__dot" />
        <span class="group__name" :title="g.name">{{ g.name }}</span>
      </button>
    </div>
  </aside>
</template>

