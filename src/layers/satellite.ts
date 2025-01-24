import { TileLayer, BitmapLayer } from "deck.gl/typed";
import { _TerrainExtension as TerrainExtension } from "@deck.gl/extensions/typed";

const SURFACE_IMAGE = `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.png?access_token=${
  import.meta.env.VITE_MAPBOX_TOKEN
}`;

// Does what it says on the tin.
// Also see TerrainLayer, which is also capable of displaying a satellite image on top
export const satelliteLayer = new TileLayer({
  id: "satellite",
  data: SURFACE_IMAGE,
  tileSize: 256,
  maxZoom: 19,
  minZoom: 0,
  renderSubLayers: (props) => {
    const {
      bbox: { west, south, east, north },
    } = props.tile;

    return [
      new BitmapLayer(props, {
        data: null,
        image: props.data,
        bounds: [west, south, east, north],
      }),
    ];
  },

  // Hints that the tiles may have elevation and therefore might be visible in a 3d view when otherwise they would be below
  zRange: [0, 1000],

  terrainDrawMode: "drape", // required to not clip through terrain!
  extensions: [new TerrainExtension()],
});
