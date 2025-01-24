import type { Component } from "solid-js";
import Map, { renderVideo } from "./components/Map";
import Timeline from "./components/Timeline";
import { state } from "./store";

const App: Component = () => {
  return (
    <div class="w-full h-full flex flex-row">
      <div class="w-full h-full flex flex-col overflow-hidden">
        <div class="flex flex-row justify-between items-center p-4">
          <h1>flight.deck</h1>

          {/* Render button */}
          <button
            class="p-2 border rounded-lg inline-flex items-center"
            onClick={renderVideo}
            disabled={state.rendering}
          >
            {state.rendering ? (
              <>
                <svg
                  class=" ml-1 mr-3 size-5 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                rendering...
              </>
            ) : (
              "render"
            )}
          </button>
        </div>

        {/* Map */}
        <div class="flex-1 flex items-center justify-center">
          <Map />
        </div>

        {/* Timeline */}
        <div>
          <Timeline />
        </div>
      </div>
    </div>
  );
};

export default App;
