export type AppEntry = {
  id: string;
  name: string;
  path: string;
  args?: string;
  runAsAdmin: boolean;
  keywords?: string;
  note?: string;
  content?: string;
  icon?: string;
  addedAt: number;
};

export type UiLanguage = "en" | "zh-CN";

export type Group = {
  id: string;
  name: string;
  apps: AppEntry[];
};

export type UiSettings = {
  language: UiLanguage;
  cardWidth: number;
  cardHeight: number;
  cardMaskOpacity: number;
  controlMaskOpacity: number;
  toggleHotkey: string;
  theme: "dark" | "light";
  sidebarWidth: number;
  fontFamily: string;
  fontColor: string;
  fontSize: number;
  cardFontSize: number;
  cardIconScale: number;
  dblClickBlankToHide: boolean;
  alwaysOnTop: boolean;
  hideOnStartup: boolean;
  useRelativePath: boolean;
  enableGroupDragSort: boolean;
  autoStart: boolean;
  customBackgroundEnabled: boolean;
  customBackgroundPath: string;
  customBackgroundBlur: number;
  customBackgroundScaleX: number;
  customBackgroundScaleY: number;
};

export type LauncherState = {
  version: 1;
  activeGroupId: string;
  groups: Group[];
  settings: UiSettings;
};
