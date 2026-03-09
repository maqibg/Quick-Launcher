import type { AppEntry } from "./types";
import { createId } from "./utils";

export const URL_PREFIX = "url:";
export const SCRIPT_PREFIX = "script:";
export const BUILTIN_PREFIX = "builtin:";

export type EntryKind = "desktop" | "uwp" | "url" | "script" | "builtin";

export type BuiltinItem = {
  id: string;
  name: string;
  description: string;
  iconText: string;
  iconKind: string;
  colorStart: string;
  colorEnd: string;
  preferBuiltinIcon?: boolean;
};

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function makeRoundedIcon(iconText: string, colorStart: string, colorEnd: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${colorStart}" />
          <stop offset="100%" stop-color="${colorEnd}" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#bg)" />
      <text x="32" y="40" text-anchor="middle" font-size="18" font-family="Segoe UI, Arial, sans-serif" font-weight="700" fill="white">${iconText}</text>
    </svg>
  `.trim();
  return svgToDataUrl(svg);
}

function makeBuiltinIcon(iconKind: string, colorStart: string, colorEnd: string): string {
  const commonStroke =
    'stroke="white" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" fill="none"';

  const iconMarkup = (() => {
    switch (iconKind) {
      case "power":
        return `<path ${commonStroke} d="M32 12v16"/><path ${commonStroke} d="M20 18a16 16 0 1 0 24 0"/>`;
      case "restart":
        return `<path ${commonStroke} d="M44 22a14 14 0 1 0 2 13"/><path ${commonStroke} d="M44 14v10H34"/>`;
      case "sleep":
        return `<path fill="white" d="M39 14c-6 3-9 10-7 16 2 7 8 11 15 11-3 5-9 8-16 7-10-1-18-10-17-21 1-9 7-15 14-17 4-1 8 0 11 4Z"/>`;
      case "logout":
        return `<path ${commonStroke} d="M28 14H18a4 4 0 0 0-4 4v28a4 4 0 0 0 4 4h10"/><path ${commonStroke} d="M34 22l10 10-10 10"/><path ${commonStroke} d="M22 32h22"/>`;
      case "lock":
        return `<rect x="18" y="28" width="28" height="22" rx="6" fill="white"/><path d="M24 28v-5a8 8 0 1 1 16 0v5" ${commonStroke}/>`;
      case "monitor-off":
        return `<rect x="14" y="16" width="36" height="24" rx="4" ${commonStroke}/><path ${commonStroke} d="M26 46h12"/><path ${commonStroke} d="M22 52h20"/><path ${commonStroke} d="M18 20l28 16"/>`;
      case "eye-off":
        return `<path ${commonStroke} d="M12 32c5-9 12-14 20-14s15 5 20 14c-5 9-12 14-20 14S17 41 12 32Z"/><circle cx="32" cy="32" r="6" fill="white"/><path ${commonStroke} d="M16 18l32 28"/>`;
      case "eye":
        return `<path ${commonStroke} d="M12 32c5-9 12-14 20-14s15 5 20 14c-5 9-12 14-20 14S17 41 12 32Z"/><circle cx="32" cy="32" r="6" fill="white"/>`;
      case "volume-up":
        return `<path fill="white" d="M18 28h8l10-8v24l-10-8h-8z"/><path ${commonStroke} d="M42 25c3 2 4 4 4 7s-1 5-4 7"/><path ${commonStroke} d="M46 20c4 3 6 7 6 12s-2 9-6 12"/>`;
      case "volume-down":
        return `<path fill="white" d="M18 28h8l10-8v24l-10-8h-8z"/><path ${commonStroke} d="M42 26c2 1.5 3 3.5 3 6s-1 4.5-3 6"/>`;
      case "volume-mute":
        return `<path fill="white" d="M18 28h8l10-8v24l-10-8h-8z"/><path ${commonStroke} d="M42 25l10 14"/><path ${commonStroke} d="M52 25 42 39"/>`;
      case "media-prev":
        return `<path fill="white" d="M18 20h4v24h-4zM24 32l18-12v24z"/>`;
      case "media-play-pause":
        return `<path fill="white" d="M22 20l20 12-20 12zM46 20h4v24h-4z"/>`;
      case "media-next":
        return `<path fill="white" d="M42 20h4v24h-4zM22 20l18 12-18 12z"/>`;
      case "settings":
        return `<path ${commonStroke} d="M32 18v-4M32 50v-4M18 32h-4M50 32h-4M22 22l-3-3M45 45l-3-3M22 42l-3 3M45 19l-3 3"/><circle cx="32" cy="32" r="8" fill="white"/>`;
      case "sliders":
        return `<path ${commonStroke} d="M18 20h28"/><circle cx="28" cy="20" r="4" fill="white"/><path ${commonStroke} d="M18 32h28"/><circle cx="40" cy="32" r="4" fill="white"/><path ${commonStroke} d="M18 44h28"/><circle cx="24" cy="44" r="4" fill="white"/>`;
      case "desktop":
        return `<rect x="14" y="16" width="36" height="24" rx="4" ${commonStroke}/><path ${commonStroke} d="M26 46h12"/><path ${commonStroke} d="M22 52h20"/>`;
      case "folder-up":
        return `<path fill="white" d="M14 22h13l4 4h19v20a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6z"/><path ${commonStroke} d="M32 42V28"/><path ${commonStroke} d="M26 34l6-6 6 6"/>`;
      case "terminal":
        return `<rect x="12" y="16" width="40" height="32" rx="6" ${commonStroke}/><path ${commonStroke} d="M20 24l8 8-8 8"/><path ${commonStroke} d="M32 40h12"/>`;
      case "calculator":
        return `<rect x="18" y="14" width="28" height="36" rx="6" ${commonStroke}/><rect x="22" y="18" width="20" height="8" rx="2" fill="white"/><path ${commonStroke} d="M24 34h4M24 42h4M32 34h4M32 42h4M40 34h0M40 42h0"/>`;
      case "palette":
        return `<path fill="white" d="M32 14c-11 0-20 8-20 18s9 18 20 18c3 0 5-2 5-5 0-3 2-5 5-5 5 0 10-4 10-10 0-9-9-16-20-16Z"/><circle cx="24" cy="28" r="2.5" fill="#0F172A"/><circle cx="32" cy="24" r="2.5" fill="#0F172A"/><circle cx="39" cy="30" r="2.5" fill="#0F172A"/><circle cx="28" cy="37" r="2.5" fill="#0F172A"/>`;
      case "note":
        return `<path fill="white" d="M20 14h18l10 10v26a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4Z"/><path d="M38 14v10h10" ${commonStroke}/><path d="M24 34h16M24 42h12" ${commonStroke}/>`;
      case "remote":
        return `<rect x="10" y="18" width="18" height="12" rx="3" ${commonStroke}/><rect x="36" y="34" width="18" height="12" rx="3" ${commonStroke}/><path ${commonStroke} d="M28 24h8M36 24l-4-4M36 24l-4 4"/>`;
      case "registry":
        return `<rect x="16" y="16" width="10" height="10" rx="2" fill="white"/><rect x="28" y="26" width="10" height="10" rx="2" fill="white"/><rect x="16" y="38" width="10" height="10" rx="2" fill="white"/><rect x="40" y="16" width="10" height="10" rx="2" fill="white"/><path ${commonStroke} d="M26 21h14M33 26v12M26 43h14"/>`;
      case "gauge":
        return `<path ${commonStroke} d="M18 40a14 14 0 1 1 28 0"/><path ${commonStroke} d="M32 34l8-6"/><circle cx="32" cy="40" r="3" fill="white"/>`;
      case "shield":
        return `<path fill="white" d="M32 12l16 6v11c0 10-6 18-16 23-10-5-16-13-16-23V18z"/>`;
      case "windows":
        return `<path fill="white" d="M12 18l18-3v16H12zm22-4 18-3v20H34zm-22 22h18v16l-18-3zm22 0h18v19l-18-3z"/>`;
      case "cert":
        return `<path fill="white" d="M18 18h28v20H18z"/><path ${commonStroke} d="M24 26h16M24 32h10"/><circle cx="42" cy="42" r="6" fill="white"/><path ${commonStroke} d="M42 48l-3 6M42 48l3 6"/>`;
      default:
        return `<text x="32" y="40" text-anchor="middle" font-size="18" font-family="Segoe UI, Arial, sans-serif" font-weight="700" fill="white">${iconKind.slice(0, 2).toUpperCase()}</text>`;
    }
  })();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${colorStart}" />
          <stop offset="100%" stop-color="${colorEnd}" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#bg)" />
      ${iconMarkup}
    </svg>
  `.trim();
  return svgToDataUrl(svg);
}

export const BUILTIN_ITEMS: BuiltinItem[] = [
  { id: "show-desktop", name: "回到桌面", description: "打开桌面", iconText: "DS", iconKind: "desktop", colorStart: "#38BDF8", colorEnd: "#0F766E" },
  { id: "shutdown", name: "关机", description: "立即关闭 Windows", iconText: "P", iconKind: "power", colorStart: "#4A90E2", colorEnd: "#2757C7", preferBuiltinIcon: true },
  { id: "restart", name: "重启", description: "立即重启 Windows", iconText: "R", iconKind: "restart", colorStart: "#4A90E2", colorEnd: "#2757C7", preferBuiltinIcon: true },
  { id: "sleep", name: "休眠", description: "进入睡眠状态", iconText: "Z", iconKind: "sleep", colorStart: "#4A90E2", colorEnd: "#2757C7", preferBuiltinIcon: true },
  { id: "hibernate", name: "睡眠", description: "进入休眠状态", iconText: "H", iconKind: "sleep", colorStart: "#4A90E2", colorEnd: "#2757C7", preferBuiltinIcon: true },
  { id: "signout", name: "注销", description: "注销当前用户", iconText: "O", iconKind: "logout", colorStart: "#4A90E2", colorEnd: "#2757C7", preferBuiltinIcon: true },
  { id: "lock", name: "锁屏", description: "锁定当前桌面", iconText: "L", iconKind: "lock", colorStart: "#4A90E2", colorEnd: "#2757C7", preferBuiltinIcon: true },
  { id: "turn-off-display", name: "关闭显示器", description: "立即关闭显示器", iconText: "D", iconKind: "monitor-off", colorStart: "#4A90E2", colorEnd: "#2757C7", preferBuiltinIcon: true },
  { id: "prevent-sleep", name: "禁止息屏", description: "开启演示模式，阻止息屏", iconText: "NS", iconKind: "eye-off", colorStart: "#4A90E2", colorEnd: "#2757C7", preferBuiltinIcon: true },
  { id: "allow-sleep", name: "允许息屏", description: "关闭演示模式，恢复息屏", iconText: "AS", iconKind: "eye", colorStart: "#4A90E2", colorEnd: "#2757C7", preferBuiltinIcon: true },
  { id: "volume-up", name: "音量+", description: "提高系统音量", iconText: "V+", iconKind: "volume-up", colorStart: "#4A90E2", colorEnd: "#2757C7", preferBuiltinIcon: true },
  { id: "volume-down", name: "音量-", description: "降低系统音量", iconText: "V-", iconKind: "volume-down", colorStart: "#4A90E2", colorEnd: "#2757C7", preferBuiltinIcon: true },
  { id: "mute", name: "静音", description: "切换系统静音", iconText: "M", iconKind: "volume-mute", colorStart: "#4A90E2", colorEnd: "#2757C7", preferBuiltinIcon: true },
  { id: "media-prev", name: "上一首", description: "发送媒体上一首按键", iconText: "⏮", iconKind: "media-prev", colorStart: "#4A90E2", colorEnd: "#2757C7", preferBuiltinIcon: true },
  { id: "media-play-pause", name: "播放暂停", description: "发送媒体播放暂停按键", iconText: "⏯", iconKind: "media-play-pause", colorStart: "#4A90E2", colorEnd: "#2757C7", preferBuiltinIcon: true },
  { id: "media-next", name: "下一首", description: "发送媒体下一首按键", iconText: "⏭", iconKind: "media-next", colorStart: "#4A90E2", colorEnd: "#2757C7", preferBuiltinIcon: true },
  { id: "this-pc", name: "此电脑", description: "打开此电脑", iconText: "PC", iconKind: "desktop", colorStart: "#38BDF8", colorEnd: "#0F766E" },
  { id: "recycle-bin", name: "回收站", description: "打开回收站", iconText: "RB", iconKind: "desktop", colorStart: "#38BDF8", colorEnd: "#0F766E" },
  { id: "control-panel", name: "控制面板", description: "打开控制面板", iconText: "CP", iconKind: "settings", colorStart: "#38BDF8", colorEnd: "#0F766E" },
  { id: "god-mode", name: "上帝模式", description: "打开 God Mode", iconText: "GM", iconKind: "settings", colorStart: "#38BDF8", colorEnd: "#0F766E", preferBuiltinIcon: true },
  { id: "system-config", name: "系统配置", description: "打开系统配置", iconText: "MC", iconKind: "sliders", colorStart: "#38BDF8", colorEnd: "#0F766E", preferBuiltinIcon: true },
  { id: "env-vars", name: "环境变量", description: "打开环境变量设置", iconText: "EV", iconKind: "sliders", colorStart: "#38BDF8", colorEnd: "#0F766E", preferBuiltinIcon: true },
  { id: "network-connections", name: "网络连接", description: "打开网络连接", iconText: "NC", iconKind: "desktop", colorStart: "#38BDF8", colorEnd: "#0F766E" },
  { id: "network", name: "网络", description: "打开网络", iconText: "NW", iconKind: "desktop", colorStart: "#38BDF8", colorEnd: "#0F766E" },
  { id: "printers", name: "打印机", description: "打开打印机文件夹", iconText: "PR", iconKind: "desktop", colorStart: "#38BDF8", colorEnd: "#0F766E" },
  { id: "startup-folder", name: "启动目录", description: "打开启动文件夹", iconText: "ST", iconKind: "folder-up", colorStart: "#38BDF8", colorEnd: "#0F766E" },
  { id: "common-startup-folder", name: "系统启动目录", description: "打开公共启动文件夹", iconText: "CS", iconKind: "folder-up", colorStart: "#38BDF8", colorEnd: "#0F766E", preferBuiltinIcon: true },
  { id: "cmd", name: "命令提示符", description: "打开 cmd", iconText: "C", iconKind: "terminal", colorStart: "#6B7280", colorEnd: "#111827" },
  { id: "powershell", name: "PowerShell", description: "打开 PowerShell", iconText: "PS", iconKind: "terminal", colorStart: "#6B7280", colorEnd: "#111827" },
  { id: "calculator", name: "计算器", description: "打开计算器", iconText: "=", iconKind: "calculator", colorStart: "#64748B", colorEnd: "#334155" },
  { id: "paint", name: "画板", description: "打开画板", iconText: "PT", iconKind: "palette", colorStart: "#64748B", colorEnd: "#334155" },
  { id: "notepad", name: "记事本", description: "打开记事本", iconText: "N", iconKind: "note", colorStart: "#64748B", colorEnd: "#334155" },
  { id: "hosts", name: "Hosts", description: "打开 hosts 文件", iconText: "HT", iconKind: "note", colorStart: "#64748B", colorEnd: "#334155", preferBuiltinIcon: true },
  { id: "remote-desktop", name: "远程桌面", description: "打开远程桌面连接", iconText: "RD", iconKind: "remote", colorStart: "#64748B", colorEnd: "#334155" },
  { id: "volume-mixer", name: "音量合成器", description: "打开音量合成器", iconText: "VM", iconKind: "volume-up", colorStart: "#64748B", colorEnd: "#334155", preferBuiltinIcon: true },
  { id: "registry-editor", name: "注册表编辑器", description: "打开注册表编辑器", iconText: "RE", iconKind: "registry", colorStart: "#64748B", colorEnd: "#334155", preferBuiltinIcon: true },
  { id: "group-policy", name: "组策略", description: "打开本地组策略编辑器", iconText: "GP", iconKind: "note", colorStart: "#64748B", colorEnd: "#334155", preferBuiltinIcon: true },
  { id: "services", name: "服务", description: "打开服务管理器", iconText: "SV", iconKind: "settings", colorStart: "#64748B", colorEnd: "#334155", preferBuiltinIcon: true },
  { id: "task-scheduler", name: "任务计划", description: "打开任务计划程序", iconText: "TS", iconKind: "settings", colorStart: "#64748B", colorEnd: "#334155", preferBuiltinIcon: true },
  { id: "resource-monitor", name: "资源监视器", description: "打开资源监视器", iconText: "RM", iconKind: "gauge", colorStart: "#64748B", colorEnd: "#334155", preferBuiltinIcon: true },
  { id: "device-manager", name: "设备管理器", description: "打开设备管理器", iconText: "DM", iconKind: "desktop", colorStart: "#64748B", colorEnd: "#334155", preferBuiltinIcon: true },
  { id: "computer-management", name: "计算机管理", description: "打开计算机管理", iconText: "CM", iconKind: "desktop", colorStart: "#64748B", colorEnd: "#334155", preferBuiltinIcon: true },
  { id: "event-viewer", name: "事件查看器", description: "打开事件查看器", iconText: "ET", iconKind: "note", colorStart: "#64748B", colorEnd: "#334155", preferBuiltinIcon: true },
  { id: "user-certificates", name: "用户证书", description: "打开当前用户证书管理器", iconText: "UC", iconKind: "cert", colorStart: "#64748B", colorEnd: "#334155", preferBuiltinIcon: true },
  { id: "computer-certificates", name: "计算机证书", description: "打开计算机证书管理器", iconText: "CC", iconKind: "cert", colorStart: "#64748B", colorEnd: "#334155", preferBuiltinIcon: true },
  { id: "programs-features", name: "程序和功能", description: "打开程序和功能", iconText: "PF", iconKind: "windows", colorStart: "#64748B", colorEnd: "#334155", preferBuiltinIcon: true },
  { id: "windows-features", name: "Windows 功能", description: "启用或关闭 Windows 功能", iconText: "WF", iconKind: "windows", colorStart: "#64748B", colorEnd: "#334155", preferBuiltinIcon: true },
];

export function getBuiltinFallbackIcon(item: BuiltinItem): string {
  return makeBuiltinIcon(item.iconKind, item.colorStart, item.colorEnd);
}

export function getEntryKind(path: string): EntryKind {
  const raw = path.trim().toLowerCase();
  if (raw.startsWith("uwp:")) return "uwp";
  if (raw.startsWith(URL_PREFIX)) return "url";
  if (raw.startsWith(SCRIPT_PREFIX)) return "script";
  if (raw.startsWith(BUILTIN_PREFIX)) return "builtin";
  return "desktop";
}

export function isUwpEntry(path: string): boolean {
  return getEntryKind(path) === "uwp";
}

export function isUrlEntry(path: string): boolean {
  return getEntryKind(path) === "url";
}

export function isScriptEntry(path: string): boolean {
  return getEntryKind(path) === "script";
}

export function isBuiltinEntry(path: string): boolean {
  return getEntryKind(path) === "builtin";
}

export function getUrlTarget(path: string): string {
  return isUrlEntry(path) ? path.slice(URL_PREFIX.length) : path;
}

export function getBuiltinId(path: string): string | null {
  return isBuiltinEntry(path) ? path.slice(BUILTIN_PREFIX.length) : null;
}

export function createUrlEntry(payload: {
  name: string;
  target: string;
  keywords?: string;
  note?: string;
}): AppEntry {
  return {
    id: createId(),
    name: payload.name.trim(),
    path: `${URL_PREFIX}${payload.target.trim()}`,
    args: "",
    runAsAdmin: false,
    keywords: payload.keywords?.trim() || "",
    note: payload.note?.trim() || "",
    icon: makeRoundedIcon("U", "#38BDF8", "#2563EB"),
    addedAt: Date.now(),
  };
}

export function createScriptEntry(payload: {
  name: string;
  content: string;
  keywords?: string;
  note?: string;
}): AppEntry {
  return {
    id: createId(),
    name: payload.name.trim(),
    path: `${SCRIPT_PREFIX}${createId()}`,
    args: "",
    runAsAdmin: false,
    keywords: payload.keywords?.trim() || "",
    note: payload.note?.trim() || "",
    content: payload.content,
    icon: makeRoundedIcon("S", "#6366F1", "#1D4ED8"),
    addedAt: Date.now(),
  };
}

export function createBuiltinEntry(item: BuiltinItem): AppEntry {
  return {
    id: createId(),
    name: item.name,
    path: `${BUILTIN_PREFIX}${item.id}`,
    args: "",
    runAsAdmin: false,
    keywords: "",
    note: item.description,
    icon: getBuiltinFallbackIcon(item),
    addedAt: Date.now(),
  };
}
