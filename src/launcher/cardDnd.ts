import type { Group } from "./types";

export type CardDragPayload = {
  appId: string;
  fromGroupId: string;
};

export function moveAppByDragPayload(
  groups: Group[],
  payload: CardDragPayload,
  toGroupId: string,
  toIndex?: number,
): { moved: boolean; toGroupName?: string } {
  const fromGroup = groups.find((g) => g.id === payload.fromGroupId);
  const toGroup = groups.find((g) => g.id === toGroupId);
  if (!fromGroup || !toGroup) return { moved: false };

  const fromIndex = fromGroup.apps.findIndex((a) => a.id === payload.appId);
  if (fromIndex < 0) return { moved: false };

  const [app] = fromGroup.apps.splice(fromIndex, 1);
  if (!app) return { moved: false };

  const insertBase = typeof toIndex === "number" ? toIndex : toGroup.apps.length;
  const maxIndex = toGroup.apps.length;
  let insertAt = Math.max(0, Math.min(maxIndex, Math.floor(insertBase)));
  if (
    fromGroup.id === toGroup.id &&
    fromIndex < insertAt &&
    insertAt !== toGroup.apps.length
  ) {
    insertAt = Math.max(0, insertAt - 1);
  }

  toGroup.apps.splice(insertAt, 0, app);
  return { moved: true, toGroupName: toGroup.name };
}
