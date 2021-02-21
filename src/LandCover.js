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
      outSR: this.spatialReference,
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
      outSR: this.spatialReference,
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
    return feature.attributes[this.coverFieldName].toLowerCase();
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

export class WisconsinLandCoverServer extends LandCoverServer {
  constructor(baseURL, coverFieldName, spatialReference) {
    super(baseURL, coverFieldName, spatialReference);
    this.waterFieldName = 'LUC_LEVEL_2_CODE';
    this.outFields = [this.coverFieldName, this.waterFieldName];
  }

  coverType(feature) {
    const landLabels = new Map(
      [
        [1, 'place home to white spruce, balsam fir, tamarack, white cedar, white birch, and aspen'],
        [2, 'place home to beech, hemlock, sugar maple, yellow birch, white pine, and red pine'],
        [3, 'place home to hemlock, sugar maple, yellow birch, white pine, and red pine'],
        [4, 'place home to sugar maple, yellow birch, white pine, and red pine'],
        [5, 'place home to white pine and red pine'],
        [6, "oak forest and barrens, including jack pine and Hill's scrub oak"],
        [7, 'place home to aspen, white birch, and pine'],
        [8, 'place home to beech, sugar maple, basswood, red oak, white oak, and black oak'],
        [9, 'place home to sugar maple, basswood, red oak, white oak, and black oak'],
        [10, 'place home to white oak, black oak, and bur oak'],
        [11, 'oak opening, including bur oak, white oak, and black oak'],
        [12, 'prairie'],
        [13, 'brushland'],
        [14, 'swamp with conifers, including white cedar, black spruce, tamarack, and hemlock'],
        [15, 'lowland with hardwoods, including willow, soft maple, box elder, ash, elm, cottonwood, and river birch'],
        [16, 'marsh and sedge meadow, wet prairie, and lowland shrubs'],
        [99, 'place with unknown vegetation cover'],
        [0, 'body of water'] // should fall through to those below
      ]
    );
    const waterLabels = new Map(
      [
      // Adapted from https://www.arcgis.com/home/item.html?id=b172c55a0ebb43a19886a4eb57bc5292
        [51, 'stream or canal'],
        [52, 'lake'],
        [53, 'reservoir']
      ]
    );
    const landCode = feature.attributes[this.coverFieldName];
    let label;
    if (landCode === 0) {
      label = waterLabels.get(feature.attributes[this.waterFieldName]);
    } else {
      label = landLabels.get(landCode);
    }
    return label;
  }
}
