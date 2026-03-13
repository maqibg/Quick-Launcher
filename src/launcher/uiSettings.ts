import type { UiSettings } from "./types";
import { resolveFontFamilyCss } from "./fonts";
import { normalizeUiLanguage } from "./i18n";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function normalizeTheme(value: unknown): "dark" | "light" {
  return value === "light" ? "light" : "dark";
}

export function getDefaultFontColor(theme: "dark" | "light"): string {
  return theme === "light" ? "#0b1220" : "#e9edf3";
}

export function normalizeFontColor(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!HEX_COLOR_RE.test(trimmed)) return "";
  if (trimmed.length === 4) {
    const [hash, r, g, b] = trimmed;
    return `${hash}${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return trimmed.toLowerCase();
}

export function clampCardWidth(value: number): number {
  return clamp(Math.round(value), 50, 480);
}

export function clampCardHeight(value: number): number {
  return clamp(Math.round(value), 40, 360);
}

export function clampMaskOpacity(value: number): number {
  // Percent multiplier for base alpha. 100 means default.
  return clamp(Math.round(value), 0, 200);
}

export function clampSidebarWidth(value: number): number {
  return clamp(Math.round(value), 160, 320);
}

export function clampFontSize(value: number): number {
  return clamp(Math.round(value), 10, 22);
}

export function clampCardFontSize(value: number): number {
  return clamp(Math.round(value), 9, 18);
}

export function clampCardIconScale(value: number, max: number): number {
  return clamp(Math.round(value), 16, Math.max(16, Math.round(max)));
}

export function clampBackgroundBlur(value: number): number {
  return clamp(Math.round(value), 0, 40);
}

export function clampBackgroundScale(value: number): number {
  return clamp(Math.round(value), 50, 200);
}

export function applyLoadedUiSettings(target: UiSettings, loaded: UiSettings): void {
  const maybeLanguage = (loaded as any).language;
  if (typeof maybeLanguage === "string" && maybeLanguage.trim()) {
    target.language = normalizeUiLanguage(maybeLanguage);
  }
  target.cardWidth = clampCardWidth(loaded.cardWidth);
  target.cardHeight = clampCardHeight(loaded.cardHeight);

  const maybeCardMaskOpacity = (loaded as any).cardMaskOpacity;
  if (typeof maybeCardMaskOpacity === "number") {
    target.cardMaskOpacity = clampMaskOpacity(maybeCardMaskOpacity);
  }
  const maybeControlMaskOpacity = (loaded as any).controlMaskOpacity;
  if (typeof maybeControlMaskOpacity === "number") {
    target.controlMaskOpacity = clampMaskOpacity(maybeControlMaskOpacity);
  }

  target.toggleHotkey = loaded.toggleHotkey ?? "";
  target.theme = normalizeTheme((loaded as any).theme);

  const maybeSidebar = (loaded as any).sidebarWidth;
  if (typeof maybeSidebar === "number") target.sidebarWidth = clampSidebarWidth(maybeSidebar);

  const maybeFontFamily = (loaded as any).fontFamily;
  if (typeof maybeFontFamily === "string" && maybeFontFamily.trim()) {
    target.fontFamily = maybeFontFamily.trim();
  }

  const maybeFontColor = (loaded as any).fontColor;
  if (typeof maybeFontColor === "string") {
    target.fontColor = normalizeFontColor(maybeFontColor);
  }

  const maybeFontSize = (loaded as any).fontSize;
  if (typeof maybeFontSize === "number") target.fontSize = clampFontSize(maybeFontSize);

  const maybeCardFontSize = (loaded as any).cardFontSize;
  if (typeof maybeCardFontSize === "number") {
    target.cardFontSize = clampCardFontSize(maybeCardFontSize);
  }

  const maybeIconScale = (loaded as any).cardIconScale;
  if (typeof maybeIconScale === "number") target.cardIconScale = Math.round(maybeIconScale);

  const maybeDblClick = (loaded as any).dblClickBlankToHide;
  if (typeof maybeDblClick === "boolean") target.dblClickBlankToHide = maybeDblClick;

  const maybeAlwaysOnTop = (loaded as any).alwaysOnTop;
  if (typeof maybeAlwaysOnTop === "boolean") target.alwaysOnTop = maybeAlwaysOnTop;

  const maybeHideOnStartup = (loaded as any).hideOnStartup;
  if (typeof maybeHideOnStartup === "boolean") target.hideOnStartup = maybeHideOnStartup;

  const maybeRelativePath = (loaded as any).useRelativePath;
  if (typeof maybeRelativePath === "boolean") target.useRelativePath = maybeRelativePath;

  const maybeGroupDragSort = (loaded as any).enableGroupDragSort;
  if (typeof maybeGroupDragSort === "boolean") target.enableGroupDragSort = maybeGroupDragSort;

  const maybeAutoStart = (loaded as any).autoStart;
  if (typeof maybeAutoStart === "boolean") target.autoStart = maybeAutoStart;

  const maybeBackgroundEnabled = (loaded as any).customBackgroundEnabled;
  if (typeof maybeBackgroundEnabled === "boolean") {
    target.customBackgroundEnabled = maybeBackgroundEnabled;
  }

  const maybeBackgroundPath = (loaded as any).customBackgroundPath;
  if (typeof maybeBackgroundPath === "string") {
    target.customBackgroundPath = maybeBackgroundPath;
  }

  const maybeBackgroundBlur = (loaded as any).customBackgroundBlur;
  if (typeof maybeBackgroundBlur === "number") {
    target.customBackgroundBlur = clampBackgroundBlur(maybeBackgroundBlur);
  }
  const maybeBackgroundScaleX = (loaded as any).customBackgroundScaleX;
  if (typeof maybeBackgroundScaleX === "number") {
    target.customBackgroundScaleX = clampBackgroundScale(maybeBackgroundScaleX);
  }
  const maybeBackgroundScaleY = (loaded as any).customBackgroundScaleY;
  if (typeof maybeBackgroundScaleY === "number") {
    target.customBackgroundScaleY = clampBackgroundScale(maybeBackgroundScaleY);
  }
}

export function computeAppStyle(settings: UiSettings): Record<string, string> {
  const width = clampCardWidth(settings.cardWidth);
  const height = clampCardHeight(settings.cardHeight);
  const theme = normalizeTheme(settings.theme);

  const iconMax = Math.min(width, height) * 0.82;
  const icon = clampCardIconScale(settings.cardIconScale, iconMax);
  const iconImg = Math.max(12, Math.round(icon * 0.72));
  const fontColor = normalizeFontColor(settings.fontColor) || getDefaultFontColor(theme);

  return {
    "--card-min-width": `${width}px`,
    "--card-height": `${height}px`,
    "--card-icon-size": `${icon}px`,
    "--card-icon-img-size": `${iconImg}px`,
    "--card-font-size": `${clampCardFontSize(settings.cardFontSize)}px`,
    "--ui-card-mask-opacity": `${clampMaskOpacity(settings.cardMaskOpacity)}`,
    "--ui-control-mask-opacity": `${clampMaskOpacity(settings.controlMaskOpacity)}`,
    "--sidebar-width": `${clampSidebarWidth(settings.sidebarWidth)}px`,
    "--font-family": resolveFontFamilyCss(settings.fontFamily),
    "--text": fontColor,
    "--font-size": `${clampFontSize(settings.fontSize)}px`,
  };
}
