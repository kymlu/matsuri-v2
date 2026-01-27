export const colorPalette = {
  // Rainbow with 2 tints each
  rainbow: {
    red: ["#D9534F", "#E48B88", "#F1B8B5"],
    orange: ["#F08A00", "#F5B04C", "#F9CF8A"],
    yellow: ["#F2D600", "#F7E44D", "#FBEF8A"],
    green: ["#5CB85C", "#7BC77B", "#A1D4A1"],
    blue: ["#337AB7", "#6699CC", "#99BBDD"],
    indigo: ["#5B4B9B", "#8170B5", "#A399CC"],
    violet: ["#A366CC", "#B998D1", "#D1B2E0"],
    pink: ["#E83E8C", "#EF7BB2", "#F5A6CB"],
  },

  // Neutral colors
  browns: ["#5C4033", "#8B5E3C", "#D2B48C"],
  greys: ["#333333", "#888888", "#DDDDDD"],

  offWhite: "#F1F1F1",
  lightGrey: "#C3C3C3",
  paleGrey: "#D4D4D4",
  primary: "#AB1010",

  // Helper: return all colors flattened
  allColors(): string[] {
    return [
      ...Object.values(this.rainbow).flat(),
      ...this.browns,
      ...this.greys,
    ];
  },

  textContrast: {} as Record<string, "#000000" | "#FFFFFF">,

  // Initialize the cached text contrast
  initTextContrast() {
    const hexToRgb = (hex: string): [number, number, number] => {
      const cleaned = hex.replace("#", "");
      const bigint = parseInt(cleaned, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return [r, g, b];
    };

    const getLuminance = (hex: string) => {
      const [r, g, b] = hexToRgb(hex).map((c) => c / 255);
      const srgb = [r, g, b].map((v) =>
        v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
      );
      return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
    };

    this.allColors().forEach((c) => {
      this.textContrast[c] = getLuminance(c) > 0.5 ? "#000000" : "#FFFFFF";
    });
  },

  // Helper: get readable text color safely
  getTextColor(bg: string): string {
    return this.textContrast[bg] || "#000000"; // default to black if missing
  },
};

colorPalette.initTextContrast();