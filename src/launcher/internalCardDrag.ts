import { reactive } from "vue";
import type { Group } from "./types";
import { moveAppByDragPayload } from "./cardDnd";
import {
  collectGridCardRects,
  computeInsertTargetFromCards,
  computeInsertTargetFromGrid,
  type GridCardRect,
} from "./domInsertTarget";
import { t } from "./i18n";

export type InternalCardDragState = {
  dragging: boolean;
  draggedAppId: string | null;
  dropBeforeAppId: string | null;
  dropEnd: boolean;
  dropGroupId: string | null;
};

export function createInternalCardDrag(opts: {
  groups: Group[];
  getActiveGroup: () => Group | undefined;
  scheduleSave: () => void;
  showToast: (message: string) => void;
}) {
  const state = reactive<InternalCardDragState>({
    dragging: false,
    draggedAppId: null,
    dropBeforeAppId: null,
    dropEnd: false,
    dropGroupId: null,
  });

  let pending:
    | {
        startX: number;
        startY: number;
        appId: string;
        fromGroupId: string;
      }
    | null = null;

  let suppressClickUntil = 0;
  let positionCache: GridCardRect[] = [];
  let cachedGridRoot: HTMLElement | null = null;
  let cachedScrollTop = 0;
  let cachedScrollLeft = 0;
  let dragFrame: number | null = null;
  let pendingPointer: { x: number; y: number } | null = null;

  function clearIndicators(): void {
    state.dropBeforeAppId = null;
    state.dropEnd = false;
    state.dropGroupId = null;
  }

  function stopDrag(): void {
    pending = null;
    state.dragging = false;
    state.draggedAppId = null;
    clearIndicators();
    positionCache = [];
    cachedGridRoot = null;
    cachedScrollTop = 0;
    cachedScrollLeft = 0;
    if (dragFrame != null) {
      window.cancelAnimationFrame(dragFrame);
      dragFrame = null;
    }
    pendingPointer = null;
    window.removeEventListener("mousemove", onMove, true);
    window.removeEventListener("mouseup", onUp, true);
  }

  function isDraggingEnough(ev: MouseEvent): boolean {
    if (!pending) return false;
    const dx = ev.clientX - pending.startX;
    const dy = ev.clientY - pending.startY;
    return dx * dx + dy * dy >= 16;
  }

  function cacheCardPositions(root?: HTMLElement | null): void {
    const nextRoot = root ?? (document.querySelector(".grid") as HTMLElement | null);
    cachedGridRoot = nextRoot;
    if (!cachedGridRoot) {
      positionCache = [];
      cachedScrollTop = 0;
      cachedScrollLeft = 0;
      return;
    }
    positionCache = collectGridCardRects({
      root: cachedGridRoot,
      excludeAppId: pending?.appId ?? null,
    });
    cachedScrollTop = cachedGridRoot.scrollTop;
    cachedScrollLeft = cachedGridRoot.scrollLeft;
  }

  function ensureCardPositionsFor(root: HTMLElement): void {
    const rootChanged = cachedGridRoot !== root;
    const scrolled =
      cachedGridRoot === root &&
      (root.scrollTop !== cachedScrollTop || root.scrollLeft !== cachedScrollLeft);
    if (rootChanged || scrolled || positionCache.length === 0) {
      cacheCardPositions(root);
    }
  }

  function updateTargetFromPoint(x: number, y: number): void {
    const el = document.elementFromPoint(x, y);
    const groupEl = el?.closest?.("[data-group-id]") as HTMLElement | null;
    if (groupEl) {
      const groupId = groupEl.getAttribute("data-group-id");
      state.dropGroupId = groupId || null;
      state.dropBeforeAppId = null;
      state.dropEnd = false;
      return;
    }

    const gridEl = el?.closest?.(".grid") as HTMLElement | null;
    const active = opts.getActiveGroup();
    if (gridEl && active) {
      ensureCardPositionsFor(gridEl);
      const computed =
        positionCache.length > 0
          ? computeInsertTargetFromCards({ cards: positionCache, x, y })
          : computeInsertTargetFromGrid({
              root: gridEl,
              x,
              y,
              excludeAppId: pending?.appId ?? null,
            });
      state.dropBeforeAppId = computed.beforeAppId;
      state.dropGroupId = null;
      state.dropEnd = computed.end;
      return;
    }

    state.dropBeforeAppId = null;
    state.dropGroupId = null;
    state.dropEnd = true;
  }

  function flushMoveFrame(): void {
    dragFrame = null;
    const point = pendingPointer;
    if (!point || !pending) return;
    pendingPointer = null;
    updateTargetFromPoint(point.x, point.y);
  }

  function scheduleMoveUpdate(x: number, y: number): void {
    pendingPointer = { x, y };
    if (dragFrame != null) return;
    dragFrame = window.requestAnimationFrame(flushMoveFrame);
  }

  function onMove(ev: MouseEvent): void {
    if (!pending) return;
    if (!state.dragging) {
      if (!isDraggingEnough(ev)) return;
      state.dragging = true;
      state.draggedAppId = pending.appId;
      cacheCardPositions();
    }
    scheduleMoveUpdate(ev.clientX, ev.clientY);
    ev.preventDefault();
  }

  function onUp(ev: MouseEvent): void {
    if (!pending) return;
    if (dragFrame != null) {
      window.cancelAnimationFrame(dragFrame);
      dragFrame = null;
    }
    pendingPointer = null;
    if (state.dragging) {
      updateTargetFromPoint(ev.clientX, ev.clientY);
    }
    const active = opts.getActiveGroup();
    if (state.dragging && active) {
      let toGroupId = active.id;
      let toIndex = active.apps.length;

      if (state.dropGroupId) {
        toGroupId = state.dropGroupId;
        toIndex = 0;
      } else if (state.dropBeforeAppId) {
        const idx = active.apps.findIndex((a) => a.id === state.dropBeforeAppId);
        if (idx >= 0) toIndex = idx;
      }

      const moved = moveAppByDragPayload(
        opts.groups,
        { appId: pending.appId, fromGroupId: pending.fromGroupId },
        toGroupId,
        toIndex,
      );
      if (moved.moved) {
        opts.scheduleSave();
        if (moved.toGroupName && moved.toGroupName !== active.name) {
          opts.showToast(t("toast.movedToGroup", { group: moved.toGroupName }));
        }
      }
      suppressClickUntil = Date.now() + 250;
    }
    stopDrag();
    ev.preventDefault();
  }

  function onMouseDownApp(ev: MouseEvent, appId: string): void {
    if (ev.button !== 0) return;
    const group = opts.getActiveGroup();
    if (!group) return;
    pending = {
      startX: ev.clientX,
      startY: ev.clientY,
      appId,
      fromGroupId: group.id,
    };
    clearIndicators();
    window.addEventListener("mousemove", onMove, true);
    window.addEventListener("mouseup", onUp, true);
    ev.preventDefault();
  }

  function shouldSuppressClick(): boolean {
    return Date.now() < suppressClickUntil;
  }

  return {
    state,
    onMouseDownApp,
    shouldSuppressClick,
    stopDrag,
  };
}
