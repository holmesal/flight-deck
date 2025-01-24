import { BitmapLayer, TileLayer } from "deck.gl/typed";
import { _TerrainExtension as TerrainExtension } from "@deck.gl/extensions/typed";

const TILE_URL = `https://api.mapbox.com/styles/v1/alonso-personal/cm6e1ok8h00cn01qrhiflend8/tiles/256/{z}/{x}/{y}@2x?access_token=${
  import.meta.env.VITE_MAPBOX_TOKEN
}`;

// Raster hillshades are higher res than vector ones, but can't be (easily) adjusted live for sun direction or etc
export const rasterHillshadeLayer = new TileLayer({
  id: "raster-hillshades",
  data: TILE_URL,
  tileSize: 256,
  opacity: 0.1,
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

  terrainDrawMode: "drape", // required to not clip through terrain!
  extensions: [new TerrainExtension()],
});
