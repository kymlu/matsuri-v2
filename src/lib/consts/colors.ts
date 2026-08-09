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

  white: "#FFFFFF",
  black: "#000000",
  offWhite: "#F2F2F2",
  grey: "#666666",
  midGrey: "#999999",
  lightGrey: "#CDCDCD",
  paleGrey: "#D4D4D4",
  primary: "#AB1010",

  actionOutlineColours: [
    "#F3C300", "#875692", "#F38400", "#A1CAF1",
    "#D44BA6", "#C2B280", "#848482", "#008856",
    "#E68FAC", "#0067A5", "#F99379", "#604E97",
    "#F6A600", "#B3446C", "#DCD300", "#64200F"
  ],

  // Helper: return all colors flattened
  allColors(): string[] {
    return [
      ...Object.values(this.rainbow).flat(),
      ...this.browns,
      ...this.greys,
      ...this.actionOutlineColours,
    ];
  },
  
  gridObjectColors(): string[] {
    return [
      ...Object.values(this.rainbow).flat(),
      ...this.browns,
      ...this.greys,
    ];
  },

  textContrast: {} as Record<string, "#000000" | "#FFFFFF">,

  // Initialize the cached text contrast
  initTextContrast() {
    this.allColors().forEach((c) => {
      this.textContrast[c] = getTextColorForBg(c);
    });
  },

  // Helper: get readable text color safely
  getTextColor(bg: string): string {
    const textColour = this.textContrast[bg];
    if (textColour) {
      return textColour;
    } else {
      this.textContrast[bg] = getTextColorForBg(bg);
      return this.textContrast[bg];
    }
  },

  lighterColors(): Record<string, string> {
    return {
      "#D9534F": "#E8706C",
      "#E48B88": "#F0AAAB",
      "#F1B8B5": "#F5D1CE",
      "#F08A00": "#F5A933",
      "#F5B04C": "#F8C870",
      "#F9CF8A": "#FBE0B5",
      "#F2D600": "#F5E033",
      "#F7E44D": "#FAF080",
      "#FBEF8A": "#FDF5B8",
      "#5CB85C": "#7ED47E",
      "#7BC77B": "#99D499",
      "#A1D4A1": "#B8DFB8",
      "#337AB7": "#6699CC",
      "#6699CC": "#99BBDD",
      "#99BBDD": "#BBD0E8",
      "#5B4B9B": "#8170B5",
      "#8170B5": "#A399CC",
      "#A399CC": "#BAB3D9",
      "#A366CC": "#B998D1",
      "#B998D1": "#CEB8DD",
      "#D1B2E0": "#DCC7E8",
      "#E83E8C": "#EF7BB2",
      "#EF7BB2": "#F5A6CB",
      "#F5A6CB": "#F9C5DD",
      "#5C4033": "#8B5E3C",
      "#8B5E3C": "#B8927A",
      "#D2B48C": "#E0C9A8",
      "#333333": "#666666",
      "#888888": "#BBBBBB",
      "#DDDDDD": "#FFFFFF",
    }
  }
};

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

const getTextColorForBg = (colour: string) => {
  return getLuminance(colour) > 0.22 ? "#000000" : "#FFFFFF";
}

colorPalette.initTextContrast();
