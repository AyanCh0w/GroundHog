// Color schemes and intensity settings for each data type

export type HeatmapConfig = {
  color: any;
  intensity: any;
  weight: any;
  radius: any;
  opacity: any;
};

export type HeatmapConfigs = {
  moisture: HeatmapConfig;
  temperature: HeatmapConfig;
  pH: HeatmapConfig;
  EC: HeatmapConfig;
};

export const heatmapConfigs: HeatmapConfigs = {
  moisture: {
    color: [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0,
      "rgba(33,102,172,0)",
      0.2,
      "rgb(103,169,207)",
      0.4,
      "rgb(209,229,240)",
      0.6,
      "rgb(253,219,199)",
      0.8,
      "rgb(239,138,98)",
      1,
      "rgb(178,24,43)",
    ],
    intensity: ["interpolate", ["linear"], ["zoom"], 10, 1, 22, 4],
    weight: ["interpolate", ["linear"], ["get", "moisture"], 0, 0, 1, 1],
    radius: ["interpolate", ["linear"], ["zoom"], 10, 20, 22, 80],
    opacity: ["interpolate", ["linear"], ["zoom"], 10, 0.7, 22, 0.9],
  },
  temperature: {
    color: [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0,
      "rgba(0,0,255,0)",
      0.2,
      "rgb(0,255,255)",
      0.4,
      "rgb(0,255,0)",
      0.6,
      "rgb(255,255,0)",
      0.8,
      "rgb(255,128,0)",
      1,
      "rgb(255,0,0)",
    ],
    intensity: ["interpolate", ["linear"], ["zoom"], 10, 1, 22, 4],
    weight: ["interpolate", ["linear"], ["get", "temperature"], 0, 0, 40, 1],
    radius: ["interpolate", ["linear"], ["zoom"], 10, 20, 22, 80],
    opacity: ["interpolate", ["linear"], ["zoom"], 10, 0.7, 22, 0.9],
  },
  pH: {
    color: [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0,
      "rgba(255,255,255,0)",
      0.2,
      "rgb(173,216,230)",
      0.4,
      "rgb(144,238,144)",
      0.6,
      "rgb(255,255,0)",
      0.8,
      "rgb(255,165,0)",
      1,
      "rgb(255,0,0)",
    ],
    intensity: ["interpolate", ["linear"], ["zoom"], 10, 1, 22, 4],
    weight: ["interpolate", ["linear"], ["get", "pH"], 0, 0, 14, 1],
    radius: ["interpolate", ["linear"], ["zoom"], 10, 20, 22, 80],
    opacity: ["interpolate", ["linear"], ["zoom"], 10, 0.7, 22, 0.9],
  },
  EC: {
    color: [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0,
      "rgba(255,255,255,0)",
      0.2,
      "rgb(0,191,255)",
      0.4,
      "rgb(30,144,255)",
      0.6,
      "rgb(0,0,255)",
      0.8,
      "rgb(138,43,226)",
      1,
      "rgb(75,0,130)",
    ],
    intensity: ["interpolate", ["linear"], ["zoom"], 10, 1, 22, 4],
    weight: ["interpolate", ["linear"], ["get", "EC"], 0, 0, 5, 1],
    radius: ["interpolate", ["linear"], ["zoom"], 10, 20, 22, 80],
    opacity: ["interpolate", ["linear"], ["zoom"], 10, 0.7, 22, 0.9],
  },
};
