import { reactive } from "vue";
import type { Group } from "./types";

export type GroupRenameState = {
  open: boolean;
  groupId: string | null;
  name: string;
};

export function createGroupRenameModel(opts: {
  getGroupById: (id: string) => Group | undefined;
  scheduleSave: () => void;
}) {
  const rename = reactive<GroupRenameState>({
    open: false,
    groupId: null,
    name: "",
  });

  function openRename(group: Group): void {
    rename.open = true;
    rename.groupId = group.id;
    rename.name = group.name;
  }

  function closeRename(): void {
    rename.open = false;
    rename.groupId = null;
  }

  function saveRename(nextName: string): void {
    const id = rename.groupId;
    if (!id) return;
    const group = opts.getGroupById(id);
    if (!group) return;
    const trimmed = nextName.trim();
    if (trimmed) {
      group.name = trimmed;
      opts.scheduleSave();
    }
    closeRename();
  }

  return { rename, openRename, closeRename, saveRename };
}

