import LandCoverServer from './LandCover.js';
import Text from './Text.js';

async function historicLandCover(browserPosition) {
  const position = [browserPosition.coords.longitude, browserPosition.coords.latitude];
  const landCoverServer = new LandCoverServer('COVERTYPE');
  const text = new Text(document.getElementById('main'));

  const localVegetation = await landCoverServer.cover(position);
  text.currentCover(localVegetation);

  const nearbyVegetation = landCoverServer.coversWithinBuffer(
    position,
    1.0,
    localVegetation.OBJECTID
  );
  text.nearbyCovers(nearbyVegetation);
}

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(historicLandCover);
  } else {
    document.getElementById('main').innerHTML = 'Geolocation is not supported by this browser.';
  }
}

window.addEventListener('load', getLocation);
