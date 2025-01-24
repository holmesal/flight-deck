# flight.deck

> 4k 60FPS geospatial flight path rendering using [deck.gl](https://deck.gl), [hubble.gl](http://hubble.gl), and [SolidJS](https://www.solidjs.com).

> A good starting point for your own explorations!

# UI

`npm i`, then `npm start`

- Mouse controls to frame the camera
- Buttons above the keyframe indicators to store the current camera state into that keyframe
- A timeline slider to preview the animation
- A render button
- Time to render depends on GPU, but frame timings are guaranteed

https://github.com/user-attachments/assets/1acfc4ea-3e42-4abe-ba2b-017c1a81a6a6

# Renders

https://github.com/user-attachments/assets/147bdc54-99e6-4c9c-9e62-2094cd21c422

https://github.com/user-attachments/assets/7174c466-0918-44e2-9d92-811ffca9171d

https://github.com/user-attachments/assets/3ed275f8-50eb-41be-925f-5212f5aa8bd6

https://github.com/user-attachments/assets/f16a30fd-b168-453a-a320-046568a3627c

# Why?

I've started recording my glider flights on a gopro, which look something like this:

https://github.com/user-attachments/assets/1162afa6-e516-4e47-a1e6-4f9d31b0915e

I'd like to start making some longer-form videos from them, but each thermal climb consists of turning in tight circles for several minutes (at least). Some folks find that nauseating to watch, and I'd like to find a way to time-compress these parts.

To preserve some continuity in the flight, my bright idea is to "fast-forward" these segments with a 3D map animation viewed from the side.

On the video side, I need:

- 4k resolution
- 60FPS (or 24, but either way - a guaranteed framerate)

Also, I love building shit with maps and I've been looking for an excuse to try out SolidJS and DeckGL.

# The map

On the map rendering side, this essentially renders the following things in `deck.gl`, and then animates it with `hubble.gl`:

- IGC flight trace
- Satellite imagery
- Elevation data
- Some vector map data

### Flight path

IGC files are essentially a set of GPS fixes with some header information about the pilot, any task declaration, etc.

First I load and parse the IGC file, and then translate some portion of the incoming path timestamps (which are recorded in unix time) into milliseconds-since-animation-start.

I then create a DeckGL "TripsLayer", which has a useful `currentTime` property that controls the position of the head by interpolating among a set of `timings` and positions that you give it. Often "Trips" are rendered with a faded trail, but I disabled that here (in reality, I'd probably want to fade some portion of the up-to-5-hour flight).

Finally - I wanted a shadow to make it easier to see the relief but didn't have great success with enabling the (experimental) shadow rendering in deck.gl itself. I hacked around this by rendering a _second_ `TripsLayer` with a dark color, but instead of rendering it at the actual elevation in space, I render it slightly offset above the surface of the terrain layer (see below). This looks pretty good, especially from afar! I drive the animation with the exact same `currentTime` property.

Beneath that, I render several layers of map data, starting with terrain.

### Terrain

Terrain comes in from mapbox's [`terrain-rgb`](https://docs.mapbox.com/data/tilesets/reference/mapbox-terrain-rgb-v1/) tile source, which provides elevation data encoded in the red, green, and blue pixels of a PNG image.

This gets passed through an elevation decoder to turn each pixel into an actual elevation. This is described in the docs as `height = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1)`.

Note that once you add terrain, everything else that you render needs to either be (a) painted on the terrain, or (b) up at some actual elevation in space above the terrain - or else it will render below the terrain!

I use deck.gl's `operation: terrain+draw` to both render the terrain itself, and also allow other layers to reference the terrain to draw on top.

### Hillshades

Hillshades make the terrain "pop" by adding areas of light and shadow based on a simulated light source (I think this is usually from the north west by convention).

There are two different ways to add hillshades - vector and raster. Vector hillshades are vector shapes that describe areas of light and shadow, which you draw and then fill with appropriate colors. Raster hillshades are tiled images (just like satellite image tiles) that only contain highlights and shadows on an otherwise transparent backdrop, so you can overlay them and then use opacity to control the strength.

Raster hillshades have quite a bit larger "resolution" since they work at the pixel level (and you obviously load higher zoom levels of tiles as you zoom in), and I found that they looked quite a bit better than the vector hillshades for me.

### Basemap

I usually used satellite imagery painted on top of the terrain - but I also experimented a bit with pulling in various map style from mapbox to render stylistic maps or contour lines.

The only gotcha with these was to make sure that they use `terrainDrawMode: "drape"` to properly overlay the terrain layer.

## The UI

The UI is very simple - just a map view, a timeline/scrubber, the ability to store the current camera view into one of two keyframes, and a render button.

I initially built this in React, which I'm very comfortable with and have worked in since the very early days. `hubble.gl` also has some nice react hooks that work pretty well out-of-the-box.

However, I didn't love the way that things were scaling as I added more map interactions.

I'd been eyeing SolidJS for a while but hadn't really had a use-case where having fine-grained control over the data flow was really important - but this was a great chance to try it out!

In short, I loved it. I put everything in a single, central `Store`, and made good use of `provide()` for updates that should mutate more than one property at a time. It removed a whole class of fighting-with-re-renders issue that can be rough in React, and I felt like I was spending a lot more time working on the core functionality.

Other than that, it was pretty bog-standard tailwind and vite. React is still great (especially the community), but this "big uncontrolled component ish thing" case of the Map view was a really great advertisement for Solid in my book.

# Running for yourself

Add a `.env.local` containing:

```
VITE_MAPBOX_TOKEN=your-token
```

... and then just `npm start`!

# Other approaches

I tried this a few other ways before landing on this combo. There's an example floating around of rendering a `mapbox.gl` map animation, but I had a hard time with high resolutions and seeking. In general, it felt a bit more like I was trying to hack a rendering pipeline out of a client library, whereas with deck (and especially hubble), it felt more purpose-built for rendering a specific frame at a specific time, which was great for this.
