export type FontFamilyOption = {
  value: string;
  label: string;
};

export const FONT_FAMILY_OPTIONS: FontFamilyOption[] = [
  { value: "maye", label: "Maye Lite" },
  { value: "system", label: "System" },
  { value: "segoe", label: "Segoe UI" },
  { value: "inter", label: "Inter" },
  { value: "mono", label: "Monospace" },
];

export function resolveFontFamilyCss(value: string): string {
  const key = (value || "").trim().toLowerCase();
  switch (key) {
    case "maye":
      return [
        "Segoe UI",
        "Microsoft YaHei UI",
        "system-ui",
        "-apple-system",
        "Roboto",
        "Helvetica",
        "Arial",
        "sans-serif",
      ].join(", ");
    case "system":
      return [
        "system-ui",
        "-apple-system",
        "Segoe UI",
        "Roboto",
        "Helvetica",
        "Arial",
        "sans-serif",
      ].join(", ");
    case "segoe":
      return [
        "Segoe UI",
        "system-ui",
        "-apple-system",
        "Roboto",
        "Helvetica",
        "Arial",
        "sans-serif",
      ].join(", ");
    case "inter":
      return [
        "Inter",
        "system-ui",
        "-apple-system",
        "Segoe UI",
        "Roboto",
        "Helvetica",
        "Arial",
        "sans-serif",
      ].join(", ");
    case "mono":
      return [
        "ui-monospace",
        "SFMono-Regular",
        "SF Mono",
        "Menlo",
        "Consolas",
        "Liberation Mono",
        "monospace",
      ].join(", ");
    default:
      return value?.trim() ? value.trim() : resolveFontFamilyCss("system");
  }
}

