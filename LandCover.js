/* eslint-disable no-restricted-syntax */
import Cover from './Cover.js';
import Point from './Point.js';

class LandCoverServer {
  constructor(coverFieldName) {
    this.baseURL = 'https://services1.arcgis.com/7w1SUsLNZbGKoz6h/arcgis/rest/services/Michigan_vegetation_c1800/FeatureServer/0/query?';
    this.coverFieldName = coverFieldName;
    this.projectedPoints = new Map();
  }

  async cover(position) {
    const params = new URLSearchParams({
      geometry: position,
      geometryType: 'esriGeometryPoint',
      inSR: 4326,
      spatialRel: 'esriSpatialRelIntersects',
      f: 'pjson',
      returnGeometry: false,
      returnQueryGeometry: true,
      outFields: [this.coverFieldName, 'OBJECTID'],
    });
    const url = this.baseURL + params.toString();
    const response = await fetch(url);
    const json = await response.json();

    // cache the projected lat long
    this.projectedPoints.set(position.toString(), new Point(json.queryGeometry.x, json.queryGeometry.y));

    return {
      coverType: json.features[0].attributes[this.coverFieldName],
      OBJECTID: json.features[0].attributes.OBJECTID,
    };
  }

  async* coversWithinBuffer(position, buffer = 0, excludeObject) {
    const params = new URLSearchParams({
      geometry: position,
      geometryType: 'esriGeometryPoint',
      inSR: 4326,
      spatialRel: 'esriSpatialRelIntersects',
      f: 'pjson',
      distance: buffer,
      units: 'esriSRUnit_StatuteMile',
      where: `OBJECTID <> ${excludeObject}`,
      outFields: [this.coverFieldName],
    });
    const url = this.baseURL + params.toString();
    const response = await fetch(url);
    const json = await response.json();

    // could make his more robust and if we haven't seen lat longs before then
    // query the server
    const currentPoint = this.projectedPoints.get(position.toString());

    for (const feature of json.features) {
      const cover = new Cover(feature.geometry.rings[0], feature.attributes[this.coverFieldName]);
      cover.center(currentPoint);
      yield cover;
    }
  }
}

export { LandCoverServer as default };
