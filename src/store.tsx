import { MapViewState } from "@deck.gl/core/typed";
import { CommonViewState } from "@deck.gl/core/typed/views/view";
import { pick } from "lodash";
import { createStore } from "solid-js/store";

type CameraFrame = Required<Omit<MapViewState, keyof CommonViewState>>;

type PickedCameraFrame = Pick<
  CameraFrame,
  "latitude" | "longitude" | "bearing" | "pitch" | "position" | "zoom"
>;

export type CameraKeyframe = {
  id: string;
  timeFrac: number;
  frame: CameraFrame;
};

type Store = {
  // Are we currently rendering?
  rendering: boolean;
  // Should the camera precisely track the tip of the path as we render?
  cameraLockedToPath: boolean;
  // 0->1, progress through animation
  timeFrac: number;
  // Total duration of animation
  duration: number;
  // Full state of the camera
  cameraFrame: CameraFrame;
  // Start/end keyframes for the camera
  cameraKeyframes: CameraKeyframe[];
  // Currently focused keyframe, if any - can produce this by clicking a keyframe, or by seeking to the time that one exists at
  focusedKeyframe?: CameraKeyframe;
};

// Get animatable properties from the camera
export const pickedCameraFrame = (
  cameraFrame: CameraFrame
): PickedCameraFrame =>
  pick(cameraFrame, [
    "latitude",
    "longitude",
    "bearing",
    "pitch",
    "position",
    "zoom",
  ]);

// Should always be set on cameras, here for easy spreading
const commonCameraFrameProps = {
  minPitch: 0,
  maxPitch: 89.5,
  minZoom: 0,
  maxZoom: 99,
};

// Next - save/load from localstorage to maintain view after refresh
export const [state, setState] = createStore<Store>({
  timeFrac: 0,
  duration: 5000,
  rendering: false,
  cameraLockedToPath: false,
  cameraFrame: {
    latitude: 40.972516666666664,
    longitude: -74.99263333333333,
    zoom: 12,
    bearing: 0,
    pitch: 45,
    position: [0, 0, 0],
    ...commonCameraFrameProps,
  },
  cameraKeyframes: [
    {
      id: "0",
      timeFrac: 0,
      frame: {
        latitude: 40.972516666666664,
        longitude: -74.99263333333333,
        zoom: 14,
        bearing: 0,
        pitch: 45,
        position: [0, 0, 0],
        ...commonCameraFrameProps,
      },
    },
    {
      id: "1",
      timeFrac: 1,
      frame: {
        latitude: 40.972516666666664,
        longitude: -74.99263333333333,
        zoom: 12,
        bearing: 0,
        pitch: 45,
        position: [0, 0, 0],
        ...commonCameraFrameProps,
      },
    },
  ] as CameraKeyframe[],
});
