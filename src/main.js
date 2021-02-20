import { LandCoverServer, IllinoisLandCoverServer } from './LandCover.js';
import Text from './Text.js';

const stateConfigs = new Map(
  [['Illinois', {
    Class: IllinoisLandCoverServer,
    baseURL: 'https://thawing-ocean-28786.herokuapp.com/http://imperialis.inhs.illinois.edu/arcgis/rest/services/Land_Cover/Presettlement_Land_Cover_All/MapServer/0/query?',
    coverFieldName: 'LAND_CODE',
    spatialReference: 3857,
    source: 'Data from the Illinois Natural History Survey\'s "<a href="https://clearinghouse.isgs.illinois.edu/data/landcover/illinois-landcover-early-1800s">Illinois Landcover in the Early 1800s</a>".'
  }],
   ['Michigan', {
     Class: LandCoverServer,
     baseURL: 'https://services1.arcgis.com/7w1SUsLNZbGKoz6h/arcgis/rest/services/Michigan_vegetation_c1800/FeatureServer/0/query?',
     coverFieldName: 'COVERTYPE',
     spatialReference: 3857,
     source: 'Data from the Michigan State University\'s "<a href="https://mnfi.anr.msu.edu/resources/vegetation-circa-1800">Vegetation circa 1800</a>".'

   }]
  ]
);

async function whatState(position) {
  // folks are unlikely to move between Illinois and Michigan while
  // they in the same session, so we can cache this value in temporary
  // storage and save the network call
  let state = sessionStorage.getItem('state');
  if (state === null) {
    const baseURL = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Current/MapServer/84/query?';
    const params = new URLSearchParams({
      geometry: position,
      geometryType: 'esriGeometryPoint',
      inSR: 4326,
      spatialRel: 'esriSpatialRelIntersects',
      returnGeometry: false,
      f: 'pjson'
    });
    const url = baseURL + params.toString();
    const response = await fetch(url);
    const json = await response.json();

    state = json.features[0].attributes.BASENAME;
    sessionStorage.setItem('state', state);
  }
  return state;
}

async function historicLandCover(browserPosition) {
  const position = [browserPosition.coords.longitude, browserPosition.coords.latitude];
  const state = await whatState(position);
  const stateConfig = stateConfigs.get(state);
  if (stateConfig) {
    const landCoverServer = new stateConfig.Class(
      stateConfig.baseURL,
      stateConfig.coverFieldName,
      stateConfig.spatialReference
    );
    const text = new Text(document.getElementById('content'));

    const localVegetation = await landCoverServer.cover(position);
    text.currentCover(localVegetation);

    const nearbyVegetation = landCoverServer.coversWithinBuffer(
      position,
      1.0
    );
    await text.nearbyCovers(nearbyVegetation);
    text.footer(stateConfig.source);
  } else {
    document.getElementById('content').innerHTML = '<p>Sorry friends, we don\'t have data for your state.</p>';
  }
}

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      historicLandCover,
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          document.getElementById('content').innerHTML = '<p>We need your current location</p> <p>You may need grant your web browser permission to access your location in your system settings.</p>';
        }
      }
    );
  } else {
    document.getElementById('content').innerHTML = 'Geolocation is not supported by this browser.';
  }
}

window.getLocation = getLocation;
