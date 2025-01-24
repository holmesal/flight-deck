import { TerrainLayer } from "deck.gl/typed";

const TERRAIN_IMAGE = `https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.png?access_token=${
  import.meta.env.VITE_MAPBOX_TOKEN
}`;

// Optionally include one of these as the texture
const SURFACE_IMAGES = {
  satellite: `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.png?access_token=${
    import.meta.env.VITE_MAPBOX_TOKEN
  }`,
  standardOil: `https://api.mapbox.com/styles/v1/alonso-personal/cm6e3fcd700dx01qmeooedssx/tiles/256/{z}/{x}/{y}@2x?access_token=${
    import.meta.env.VITE_MAPBOX_TOKEN
  }`,
};

export const EXAGGERATION = 1.2;

export const terrainLayer = new TerrainLayer({
  id: "terrain",
  minZoom: 0,
  maxZoom: 23,
  strategy: "no-overlap",
  // Map height data from tile images to world height - see mapbox docs for a description of this
  elevationDecoder: {
    rScaler: 6553.6 * EXAGGERATION,
    gScaler: 25.6 * EXAGGERATION,
    bScaler: 0.1 * EXAGGERATION,
    offset: -10000 * EXAGGERATION,
  },
  elevationData: TERRAIN_IMAGE,
  texture: SURFACE_IMAGES.satellite,
  tileSize: 256,
  material: {
    diffuse: 1,
  },
  // Set this to "terrain+draw" to get underlying polygons, or just "terrain" for transparent
  operation: "terrain+draw",
});
