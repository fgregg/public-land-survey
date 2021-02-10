"use strict";

import { LandCoverServer } from "./LandCover.js";
import { Text } from "./Text.js";

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(historicLandCover);
  } else { 
    x.innerHTML = "Geolocation is not supported by this browser.";
  }
}

async function historicLandCover(browser_position) {
    const position = [browser_position.coords.longitude, browser_position.coords.latitude]
    const landCoverServer = new LandCoverServer('COVERTYPE')
    const text = new Text(document.getElementById("main"))

    const local_vegetation = await landCoverServer.cover(position)
    text.current_cover(local_vegetation)

    const nearby_vegetation = landCoverServer.covers_within_buffer(position, 1.0, local_vegetation.OBJECTID)
    text.nearby_covers(nearby_vegetation)
}

window.addEventListener('load', getLocation)
