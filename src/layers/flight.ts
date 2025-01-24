import IGCParser, { IGCFile } from "igc-parser";
import { TripsLayer } from "deck.gl/typed";
import { _TerrainExtension as TerrainExtension } from "@deck.gl/extensions/typed";

import rawFlight from "./flight.igc?raw";

// Next - render the task .cup file as cylinders for the AAT sectors
import rawTask from "./task.cup?raw";
import { EXAGGERATION } from "./terrain";

// Next - define a start timecode (e.g. the "source timecode" from a video editor) to easily cut an animation
// that starts at just the right "world time" and runs for a specified length
const START_TIMECODE = "";
const PLAYBACK_RATE = 50;

const flightTrace = IGCParser.parse(rawFlight);

// It's useful to keep track of the unix start and end times for the task
const fixTimes = {
  start: flightTrace.fixes[0].timestamp,
  end: flightTrace.fixes[flightTrace.fixes.length - 1].timestamp,
};

// Turn a unix timestamp into a relative local time
const localTime = (unixTime: number) =>
  (unixTime - fixTimes.start) / PLAYBACK_RATE;

// Reprocess flight trace into local time
export const flightDataSource = {
  timings: flightTrace.fixes.map((fix) => localTime(fix.timestamp)),
  fixes: flightTrace.fixes.map((fix) => [
    fix.longitude,
    fix.latitude,
    fix.gpsAltitude! * EXAGGERATION,
  ]),
};

// Create layer
export const flightTraceLayer = new TripsLayer<typeof flightDataSource>({
  id: "flightTrace",
  data: [flightDataSource], // TripsLayer is built to handle many trips
  getPath: (d) => d.fixes as [number, number, number][],
  getTimestamps: (d) => d.timings,
  getColor: (d) => [228, 91, 41],
  capRounded: true,
  jointRounded: true,
  fadeTrail: false,
  // trailLength: 100000,
  currentTime: 0,
  getWidth: (d) => 6,
  widthMinPixels: 2,
  billboard: true,
  // shadowEnabled: true, // Does not work - cannot cast on terrain layer - see fake shadow implementation below instead
});

// Fake "shadow"
export const flightTraceShadowLayer = new TripsLayer<typeof flightDataSource>({
  id: "flightTraceShadow",
  data: [flightDataSource], // TripsLayer is built to handle many trips
  getPath: (d) =>
    d.fixes.map((fix) => [fix[0], fix[1], 1] as [number, number, number]), // Fix the elevation at 1m "offset" (see terrainDrawMode below) to avoid z-fighting with terrain
  getTimestamps: (d) => d.timings,
  getColor: (d) => [0, 0, 0],
  opacity: 0.1,
  capRounded: true,
  jointRounded: true,
  fadeTrail: false,
  // trailLength: 100000,
  currentTime: 0,
  getWidth: 2,
  // getWidth: (d) => d.fixes.map((fix) => (fix[2] / 3000) * 100), // Next - improve the shadow simulation by varying the width with height of the path above
  widthMinPixels: 2,
  billboard: true,

  // @ts-ignore
  terrainDrawMode: "offset", // required to not clip through terrain! Interprets the third element in position as a relative height above terrain
  extensions: [new TerrainExtension()],
});
