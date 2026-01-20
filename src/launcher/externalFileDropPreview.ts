import { reactive } from "vue";
import type { Group } from "./types";
import { computeInsertTargetFromGrid } from "./domInsertTarget";

export type ExternalDropState = {
  active: boolean;
  dropBeforeAppId: string | null;
  dropEnd: boolean;
  dropGroupId: string | null;
};

export type PendingExternalTarget = { groupId: string; index: number };

function isFilesDrag(ev: DragEvent): boolean {
  const dt = ev.dataTransfer;
  if (!dt) return false;
  return Array.from(dt.types || []).includes("Files");
}

export function createExternalFileDropPreview(opts: {
  getActiveGroup: () => Group | undefined;
}) {
  const state = reactive<ExternalDropState>({
    active: false,
    dropBeforeAppId: null,
    dropEnd: false,
    dropGroupId: null,
  });

  let pending: PendingExternalTarget | null = null;

  function clear(): void {
    pending = null;
    state.active = false;
    state.dropBeforeAppId = null;
    state.dropEnd = false;
    state.dropGroupId = null;
  }

  function consumePending(): PendingExternalTarget | null {
    const v = pending;
    pending = null;
    return v;
  }

  function setTarget(target: PendingExternalTarget, view: Partial<ExternalDropState>): void {
    pending = target;
    state.active = true;
    state.dropBeforeAppId = view.dropBeforeAppId ?? null;
    state.dropEnd = view.dropEnd ?? false;
    state.dropGroupId = view.dropGroupId ?? null;
  }

  function onDragOverBlank(ev: DragEvent): void {
    if (!isFilesDrag(ev)) return;
    const group = opts.getActiveGroup();
    if (!group) return;
    const root = ev.currentTarget as HTMLElement | null;
    if (!root) return;
    const computed = computeInsertTargetFromGrid({
      root,
      x: ev.clientX,
      y: ev.clientY,
    });
    const len = group.apps.length;
    const idx =
      computed.end || !computed.beforeAppId
        ? len
        : (() => {
            const found = group.apps.findIndex((a) => a.id === computed.beforeAppId);
            return found >= 0 ? found : len;
          })();
    setTarget(
      { groupId: group.id, index: idx },
      { dropBeforeAppId: computed.beforeAppId, dropEnd: computed.end },
    );
    if (ev.dataTransfer) ev.dataTransfer.dropEffect = "copy";
    ev.preventDefault();
  }

  function onDragOverApp(ev: DragEvent, appId: string): void {
    if (!isFilesDrag(ev)) return;
    const group = opts.getActiveGroup();
    if (!group) return;
    const idxBase = group.apps.findIndex((a) => a.id === appId);
    if (idxBase < 0) return;
    const rect = (ev.currentTarget as HTMLElement | null)?.getBoundingClientRect?.();
    if (!rect) return;
    const after =
      Math.abs(ev.clientY - (rect.top + rect.height / 2)) > rect.height * 0.45
        ? ev.clientY > rect.top + rect.height / 2
        : ev.clientX > rect.left + rect.width / 2;
    const idx = idxBase + (after ? 1 : 0);
    const beforeAppId = group.apps[idx]?.id ?? null;
    setTarget(
      { groupId: group.id, index: idx },
      { dropBeforeAppId: beforeAppId, dropEnd: idx >= group.apps.length },
    );
    if (ev.dataTransfer) ev.dataTransfer.dropEffect = "copy";
    ev.preventDefault();
  }

  function onDragOverGroup(ev: DragEvent, groupId: string): void {
    if (!isFilesDrag(ev)) return;
    setTarget({ groupId, index: 0 }, { dropGroupId: groupId });
    if (ev.dataTransfer) ev.dataTransfer.dropEffect = "copy";
    ev.preventDefault();
  }

  function onDrop(ev: DragEvent): void {
    if (!isFilesDrag(ev)) return;
    ev.preventDefault();
  }

  function onDragLeave(ev: DragEvent): void {
    if (!isFilesDrag(ev)) return;
    clear();
  }

  return {
    state,
    clear,
    consumePending,
    onDragOverBlank,
    onDragOverApp,
    onDragOverGroup,
    onDrop,
    onDragLeave,
  };
}
