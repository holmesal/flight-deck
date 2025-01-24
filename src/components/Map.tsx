import {
  Deck,
  Layer,
  LinearInterpolator,
  MapViewState,
  PostProcessEffect,
} from "@deck.gl/core/typed";
import { fxaa } from "@luma.gl/shadertools";
import {
  DeckAnimation,
  linear,
  AnimationManager,
  DeckAdapter,
  WebMEncoder,
  // @ts-ignore
} from "@hubble.gl/core";
import { createEffect, onMount } from "solid-js";
import { setState, state } from "../store";
import {
  flightDataSource,
  flightTraceLayer,
  flightTraceShadowLayer,
} from "../layers/flight";
import { terrainLayer } from "../layers/terrain";
import { rasterHillshadeLayer } from "../layers/raster-hillshade";

// Multiply this by 4 to get 4k video, via the device pixel ratio
const RESOLUTION = {
  width: 960,
  height: 540,
};
// This converts the above to 4k resolution if 4, etc
const EXPORT_PIXEL_DENSITY = 4;
const FILENAME = "render";

const animation = new DeckAnimation({
  // Make these non-static later
  getLayers: (a: DeckAdapter) =>
    a.applyLayerKeyframes([
      // Terrain layer - both renders and provides a data source for the others
      terrainLayer,

      // For testing - satellite layer
      // satelliteLayer,

      // Experimental hillshades
      // mvtHillshadeLayer,
      rasterHillshadeLayer,

      // Cool topo contours
      // mvtContourLayer,

      // Fake shadow underneath the path
      flightTraceShadowLayer,

      // Flight trace itself
      flightTraceLayer,
    ]),
  // Animate the line path and shadow from 0 to state.duration
  layerKeyframes: [
    {
      id: "flightTrace",
      timings: [0, state.duration],
      keyframes: [{ currentTime: 0 }, { currentTime: state.duration }],
    },
    {
      id: "flightTraceShadow",
      timings: [0, state.duration],
      keyframes: [{ currentTime: 0 }, { currentTime: state.duration }],
    },
  ],
  // Don't set camera keyframes here, set them below
});

// Create the animation manager and adapter
const animationManager = new AnimationManager({ animations: [animation] });
export const adapter = new DeckAdapter({ animationManager });

// Handy function to seek to the store's current time
const seekToCurrentTime = () => {
  adapter.seek({ timeMs: state.timeFrac * state.duration });
};

// Video format config
const formatConfigs = {
  webm: {
    quality: 0.8,
  },
};

const setProps = () => {
  deck.setProps(adapter.getProps({ onNextFrame: setProps }));
};

export let deck: Deck;

export function renderVideo() {
  setState("rendering", true);
  adapter.render({
    Encoder: WebMEncoder,
    formatConfigs,
    timecode: {
      start: 0,
      end: state.duration,
      framerate: 60,
    },
    filename: FILENAME,
    onStopped: () => setState("rendering", false),
    onSave: (blob: Blob) => {
      setState("rendering", false);
      adapter.videoCapture.download(blob);
    },
    onComplete: () => {
      setState("rendering", false);
      setProps();
    },
  });
  deck.redraw("finished-rendering");
}

export default function Map() {
  let ref;
  onMount(() => {
    deck = new Deck({
      initialViewState: state.cameraFrame,
      onViewStateChange: ({ viewState }) => {
        // If the view is locked to the path, overwrite the lat/lon - this effectively prevents moving the camera
        if (state.cameraLockedToPath) {
          viewState.longitude = state.cameraFrame.longitude;
          viewState.latitude = state.cameraFrame.latitude;
        }
        deck.setProps({ viewState });
        if (!state.rendering) {
          setState("cameraFrame", viewState);
        }
      },
      onLoad: seekToCurrentTime,
      controller: {
        dragPan: state.cameraLockedToPath ? false : true,
      },
      parent: ref,
      style: { position: "unset" },
      width: RESOLUTION.width,
      height: RESOLUTION.height,

      effects: [
        // Play with this, it's subtle
        new PostProcessEffect(fxaa),
      ],
      // These are set below by animation.setOnLayersUpdate()
      // layers: [satelliteLayer, flightTraceLayer],

      // most video formats don't fully support transparency, so use a black background
      parameters: {
        clearColor: [0, 0, 0, 1],
      },

      // Next - would be nice to preview in a lower pixel density and then render in a higher one
      useDevicePixels: EXPORT_PIXEL_DENSITY,
    });

    // Associate the adapter with the deck instance
    adapter.setDeck(deck);

    // When the animation changes the camera, update Deck and save the new camera in the store
    animation.setOnCameraUpdate((viewState: MapViewState) => {
      deck.setProps({ viewState });
      setState("cameraFrame", { ...viewState });
    });

    // Update deck layers when animation layers update
    // Note - this is also called every time the camera frame changes
    animation.setOnLayersUpdate((layers: Layer[]) => {
      deck.setProps({ layers });
    });

    deck.setProps({
      ...adapter.getProps({ onNextFrame: setProps }),
      // onLoad: render
    });
  });

  createEffect(() => {
    const { cameraKeyframe } = adapter.animationManager.getKeyframes("deck");

    // If the camera is locked to the path, then interpolate it along the path
    if (state.cameraLockedToPath) {
      const timings = flightDataSource.timings;
      const interp = new LinearInterpolator();
      interp.initializeProps(
        state.cameraKeyframes[0].frame,
        state.cameraKeyframes[1].frame
      );
      adapter.animationManager.setKeyframes("deck", {
        cameraKeyframe: {
          ...cameraKeyframe, // fiddly!
          timings,
          keyframes: flightDataSource.timings.map((t, idx) => {
            const [longitude, latitude, elevation] =
              flightDataSource.fixes[idx];
            const camera = interp.interpolateProps(
              state.cameraKeyframes[0].frame,
              state.cameraKeyframes[1].frame,
              t / state.duration
            );
            return {
              ...camera,
              // The terrain can glitch sometimes because even with constant zoom the interpolator sometimes returns, say 12, and sometimes 11.999999999
              // I think there's a break in the terrain data at zoom level 12, so this glitch looks bad
              // A good solution is to just allow 3 decimal places of precision on the zoom level, which keeps it locked at 12
              zoom: Math.round(camera.zoom * 1000) / 1000,
              longitude,
              latitude,
              position: [0, 0, elevation], // Make sure to look at the tip of the path, not the ground beneath
            };
          }),
          easings: linear,
        },
      });
    } else {
      adapter.animationManager.setKeyframes("deck", {
        cameraKeyframe: {
          ...cameraKeyframe, // fiddly! don't lose any camera props
          timings: state.cameraKeyframes.map(
            (kf) => kf.timeFrac * state.duration
          ),
          keyframes: state.cameraKeyframes.map((kf) => kf.frame),
          easings: linear,
        },
      });
    }
  });

  // Seek to the current time every time the store's timeFrac changes
  createEffect(() => {
    seekToCurrentTime();
  });

  return (
    <div
      class="relative"
      classList={{
        "pointer-events-none": state.rendering,
      }}
    >
      <div ref={ref} />
    </div>
  );
}
