/* eslint-disable no-restricted-syntax */
import Cover from './Cover.js';
import Point from './Point.js';

class LandCoverServer {
  constructor(baseURL, coverFieldName, spatialReference) {
    this.baseURL = baseURL;
    this.coverFieldName = coverFieldName;
    this.spatialReference = spatialReference;
  }

  async cover(position) {
    const params = new URLSearchParams({
      geometry: position,
      geometryType: 'esriGeometryPoint',
      inSR: 4326,
      spatialRel: 'esriSpatialRelIntersects',
      f: 'pjson',
      returnGeometry: false,
      outFields: [this.coverFieldName]
    });
    const url = this.baseURL + params.toString();
    const response = await fetch(url);
    const json = await response.json();

    return json.features[0].attributes[this.coverFieldName];
  }

  async* coversWithinBuffer(position, buffer = 0, currentCover) {
    const params = new URLSearchParams({
      geometry: position,
      geometryType: 'esriGeometryPoint',
      inSR: 4326,
      spatialRel: 'esriSpatialRelIntersects',
      f: 'pjson',
      distance: buffer,
      units: 'esriSRUnit_StatuteMile',
      where: `${this.coverFieldName} <> '${currentCover}'`,
      outFields: [this.coverFieldName]
    });
    const url = this.baseURL + params.toString();
    const response = await fetch(url);
    const json = await response.json();

    const currentPoint = await this.project(position);

    for (const feature of json.features) {
      const cover = new Cover(feature.geometry.rings[0], feature.attributes[this.coverFieldName]);

      // change the origin point for the polygons to where the user is right
      // now. this simplifies a lot of calculations of distance and direction
      cover.center(currentPoint);
      yield cover;
    }
  }

  async project(position) {
    const baseProjectionURL = 'https://gisapps.cityofchicago.org/arcgis/rest/services/Utilities/Geometry/GeometryServer/project?';
    const params = new URLSearchParams({
      inSR: 4326,
      outSR: this.spatialReference,
      geometries: position,
      f: 'pjson'
    });
    const url = baseProjectionURL + params.toString();

    const response = await fetch(url);
    const json = await response.json();

    return new Point(json.geometries[0].x, json.geometries[0].y);
  }
}

export { LandCoverServer as default };
