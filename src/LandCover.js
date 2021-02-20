/* eslint-disable max-classes-per-file */
/* eslint-disable no-restricted-syntax */
import Cover from './Cover.js';
import Point from './Point.js';

export class LandCoverServer {
  constructor(baseURL, coverFieldName, spatialReference) {
    this.baseURL = baseURL;
    this.coverFieldName = coverFieldName;
    this.spatialReference = spatialReference;
    this.outFields = [this.coverFieldName];
    this.currentCoverCode = undefined;
  }

  async cover(position) {
    const params = new URLSearchParams({
      geometry: position,
      geometryType: 'esriGeometryPoint',
      inSR: 4326,
      spatialRel: 'esriSpatialRelIntersects',
      f: 'pjson',
      returnGeometry: false,
      outFields: this.outFields
    });
    const url = this.baseURL + params.toString();
    const response = await fetch(url);
    const json = await response.json();

    this.currentCoverCode = json.features[0].attributes[this.coverFieldName];

    return this.coverType(json.features[0]);
  }

  async* coversWithinBuffer(position, buffer = 0) {
    const params = new URLSearchParams({
      geometry: position,
      geometryType: 'esriGeometryPoint',
      inSR: 4326,
      spatialRel: 'esriSpatialRelIntersects',
      f: 'pjson',
      distance: buffer,
      units: 'esriSRUnit_StatuteMile',
      where: `${this.coverFieldName} <> '${this.currentCoverCode}'`,
      outFields: this.outFields
    });
    const url = this.baseURL + params.toString();
    const response = await fetch(url);
    const json = await response.json();

    const currentPoint = await this.project(position);

    for (const feature of json.features) {
      const cover = new Cover(feature.geometry.rings[0], this.coverType(feature));

      // change the origin point for the polygons to where the user is right
      // now. this simplifies a lot of calculations of distance and direction
      cover.center(currentPoint);
      yield cover;
    }
  }

  coverType(feature) {
    return feature.attributes[this.coverFieldName];
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

export class IllinoisLandCoverServer extends LandCoverServer {
  coverType(feature) {
    const landLabels = new Map(
      [
        ['fi', 'agricultural field'],
        ['pl', 'plantation'],
        ['in', 'trail'],
        ['fa', 'farm'],
        ['or', 'orchard'],
        ['mo', 'mound'],
        ['pa', 'pasture'],
        ['mo', 'mound'],
        ['sp', 'spring'],
        ['hr', 'high ridge'],
        ['bl', 'bluff'],
        ['hr', 'high ridge'],
        ['is', 'island'],
        ['ro', 'rocky ground'],
        ['rv', 'ravine'],
        ['hi', 'hill'],
        ['rg', 'rough ground'],
        ['ll', 'low land'],
        ['dg', 'dry ground'],
        ['gl', 'glade'],
        ['le', 'ledge'],
        ['cl', 'cliff'],
        ['li', 'lick'],
        ['rl', 'rolling land'],
        ['sk', 'sinkhole'],
        ['ba', 'bayou'],
        ['wl', 'wetland'],
        ['ss', 'slash'],
        ['sa', 'swale'],
        ['bp', 'brush prairie'],
        ['pr', 'prairie'],
        ['wp', 'wet prairie'],
        ['sd', 'sandy prairie'],
        ['la', 'lake'],
        ['ri', 'river'],
        ['po', 'pond'],
        ['br', 'barrens'],
        ['bt', 'bottomland'],
        ['ft', 'forest'],
        ['ma', 'marsh'],
        ['sl', 'slough'],
        ['sw', 'swamp'],
        ['th', 'forest'],
        ['ti', 'forest']
      ]
    );
    const landCode = feature.attributes[this.coverFieldName];
    return landLabels.get(landCode);
  }
}
