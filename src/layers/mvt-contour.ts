import { MVTLayer } from "deck.gl/typed";
import { _TerrainExtension as TerrainExtension } from "@deck.gl/extensions/typed";

type PropertiesType = {
  properties: (
    | {
        layerName: "landcover";
        class: "wood" | "scrub" | "grass" | "crop" | "snow";
      }
    | {
        layerName: "hillshade";
        class: "shadow" | "highlight";
      }
    | {
        layerName: "contour";
      }
  ) & {
    level: number;
    ele: number;
    index: number;
  };
};

// Displays hillshades as shaded polygons - these are lower res than a bitmap hillshade
export const mvtHillshadeLayer = new MVTLayer<PropertiesType>({
  id: "mvtHillshadeLayer",
  data: [
    `https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2/{z}/{x}/{y}.mvt?access_token=${
      import.meta.env.VITE_MAPBOX_TOKEN
    }`,
  ],
  binary: false,
  dataTransform: (data) => {
    return data.filter((d) => d.properties.layerName === "hillshade");
  },
  filled: true,
  getFillColor: (f: PropertiesType) => {
    switch (f.properties.level) {
      case 94:
        return [255, 255, 255];
      case 90:
        return [245, 245, 245];
      case 89:
        return [235, 235, 235];
      case 78:
        return [220, 220, 220];
      case 67:
        return [210, 210, 210];
      case 56:
        return [200, 200, 200];
      default:
        return [240, 240, 240];
    }
  },
  opacity: 0.05,
  stroked: false,
  // terrainDrawMode: "drape",
  extensions: [new TerrainExtension()],
  shadowEnabled: false,
});

//
// Contours
//
export const mvtContourLayer = new MVTLayer<PropertiesType>({
  id: "mvtContourLayer",
  data: [
    `https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2/{z}/{x}/{y}.mvt?access_token=${
      import.meta.env.VITE_MAPBOX_TOKEN
    }`,
  ],
  binary: false,
  dataTransform: (data) => {
    return data.filter((d) => d.properties.layerName === "contour");
  },
  filled: false,
  stroked: true,
  antialias: true,
  getLineWidth: (f: PropertiesType) => {
    if (f.properties.layerName !== "contour") return 0;
    if (f.properties.ele % 50 === 0) {
      return 5;
    } else if (f.properties.ele % 20 === 0) {
      return 2;
    } else {
      return 0;
    }
  },
  lineWidthMinPixels: 1,
  getLineColor: [0, 0, 0],
  shadowEnabled: false,

  // Drape over the terrain layer
  terrainDrawMode: "drape",
  extensions: [new TerrainExtension()],
});
