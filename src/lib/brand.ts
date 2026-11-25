// Official Creatora brand identity — PART 1 of the master product prompt.
export const brand = {
  primary: "#FF6B35", // Sunset Orange
  primaryHover: "#FF8557", // Orange Hover
  primaryHighlight: "#FFAA70", // Peach Glow
  // Dark theme
  background: "#120D0A", // Obsidian
  surface: "#191512", // Deep Charcoal
  surfaceElevated: "#241710", // Dark Ember
  surfaceMuted: "#30221A", // Elevated Surface
  // Text
  foreground: "#FFF7F2", // Warm White
  foregroundMuted: "#B9A79C", // Muted Sand
  // Borders
  border: "#463126",
  // Semantic
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#60A5FA",
  // Display typography: Sora for headings, DM Sans for interface text,
  // monospace for technical metadata.
  displayFont: `"Sora", "Inter", system-ui, sans-serif`,
  sansFont: `"DM Sans", "Geist", system-ui, sans-serif`,
  monoFont: `"Geist Mono", "SFMono-Regular", ui-monospace, monospace`,
} as const;

export const brandLight = {
  background: "#FFF7F2",
  surface: "#FFF1E6",
  surfaceElevated: "#FFF6ED",
  foreground: "#120D0A",
  foregroundMuted: "#5A4B42",
  border: "#E6C9A8",
} as const;

export const colors = {
  primary: brand.primary,
  hover: brand.primaryHover,
  highlight: brand.primaryHighlight,
  success: brand.success,
  warning: brand.warning,
  error: brand.error,
  info: brand.info,
} as const;

export const siteName = "Creatora";
export const tagline = "Create Beyond Imagination.";
