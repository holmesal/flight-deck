import { produce } from "solid-js/store";
import { CameraKeyframe, pickedCameraFrame, setState, state } from "../store";

export default function Timeline() {
  const focusOnKeyframe = (kf: CameraKeyframe) => {
    setState(
      produce((state) => {
        state.focusedKeyframe = kf;
        state.timeFrac = kf.timeFrac;
      })
    );
  };

  return (
    <div
      class="flex flex-col transition-opacity"
      classList={{
        "pointer-events-none opacity-50": state.rendering,
      }}
    >
      <div class="relative flex flex-col self-stretch mx-10 mb-6 ">
        <div class="min-h-15 w-full flex flex-row items-end">
          {state.cameraKeyframes.map((kf, idx) => {
            const isFocusedKeyframe = state.focusedKeyframe?.id === kf.id;
            return (
              <div
                class="absolute flex flex-col items-center w-5 -ml-2.5 pb-4"
                style={{ left: kf.timeFrac * 100 + "%" }}
              >
                {/* Button to store the current camera in a given keyframe */}
                <button
                  class="mb-3 text-xs hover:cursor-pointer"
                  title="Save camera"
                  onClick={() => {
                    setState("cameraKeyframes", idx, "frame", (frame) => ({
                      ...frame,
                      ...pickedCameraFrame(state.cameraFrame),
                    }));
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    class="size-5"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 3a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25 5.5a.75.75 0 0 1-1.08 0l-5.25-5.5a.75.75 0 1 1 1.08-1.04l3.96 4.158V3.75A.75.75 0 0 1 10 3Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>

                {/* Button that shows keyframe active state and allows jumping to it */}
                <button
                  class="w-5 h-5 rounded-full bg-cyan-600 flex items-center justify-center text-xs font-bold select-none text-cyan-100 hover:bg-cyan-300 hover:cursor-pointer transition-all duration-100"
                  classList={{
                    "opacity-40": state.focusedKeyframe && !isFocusedKeyframe,
                    "outline-cyan-400 outline-offset-4 outline-2":
                      isFocusedKeyframe,
                  }}
                  onClick={() => focusOnKeyframe(kf)}
                  title="Jump to keyframe"
                >
                  <span>{idx + 1}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Slider */}
        <div class="h-10 w-full bg-stone-900">
          <input
            type="range"
            class="flex-1 timelineSlider hover:cursor-ew-resize w-full h-full"
            min={0}
            max={1}
            step={0.0001}
            value={state.timeFrac}
            onInput={(ev) =>
              setState(
                produce((state) => {
                  state.timeFrac = parseFloat(ev.target.value);
                  state.focusedKeyframe = state.cameraKeyframes.find(
                    (kf) => kf.timeFrac === state.timeFrac
                  );
                })
              )
            }
          />
        </div>
      </div>
    </div>
  );
}
