"use strict";

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    subtract(other_point) {
        return new Point(this.x - other_point.x, this.y - other_point.y);
    }

    length() {
        // distance from the origin to the point
        return Math.hypot(...this);
    }

    angle_degrees() {
        // angle in degrees between the x axis and the ray passing
        // through the point
        let degrees = Math.atan2(this.y, this.x) * 180 / Math.PI;
        if (degrees < 0) {
            degrees += 360;
        }
        return degrees;
    }

    *[Symbol.iterator]() {
        yield this.x;
        yield this.y;
    }
}

class Cover {
    constructor(ring, cover_type) {
        this.ring = ring.map(point_array => new Point(...point_array));
        this.cover_type = cover_type;
    }

    center(origin_point) {
        this.ring = this.ring.map(point => point.subtract(origin_point));
    }

    closest_point() {
        // closest point in the polygon to the origin
        let minDistance = Infinity;
        let closestPoint;
        for (const point of this.ring) {
            const dist = point.length();
            if (dist < minDistance) {
                minDistance = dist;
                closestPoint = point;
            }
        }
        return closestPoint;
    }
}

export class LandCoverServer {
    constructor(cover_field_name) {
        this.baseURL = 'https://services1.arcgis.com/7w1SUsLNZbGKoz6h/arcgis/rest/services/Michigan_vegetation_c1800/FeatureServer/0/query?';
        this.cover_field_name = cover_field_name;
        this.projected_points = new Map();
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
            outFields: [this.cover_field_name, 'OBJECTID']
        });
        const url = this.baseURL + params.toString();
        const response = await fetch(url);
        const json = await response.json();

        // cache the projected lat long
        this.projected_points.set(position.toString(), new Point(json.queryGeometry.x, json.queryGeometry.y));

        return {
            cover_type: json.features[0].attributes[this.cover_field_name],
            OBJECTID: json.features[0].attributes.OBJECTID
        };
    }

    async *covers_within_buffer(position, buffer = 0, exclude_object) {
        const params = new URLSearchParams({
            geometry: position,
            geometryType: 'esriGeometryPoint',
            inSR: 4326,
            spatialRel: 'esriSpatialRelIntersects',
            f: 'pjson',
            distance: buffer,
            units: 'esriSRUnit_StatuteMile',
            where: `OBJECTID <> ${exclude_object}`,
            outFields: [this.cover_field_name]
        });
        const url = this.baseURL + params.toString();
        const response = await fetch(url);
        const json = await response.json();

        // could make his more robust and if we haven't seen lat longs before then
        // query the server
        const current_point = this.projected_points.get(position.toString());

        for (const feature of json.features) {
            const cover = new Cover(feature.geometry.rings[0], feature.attributes[this.cover_field_name]);
            cover.center(current_point);
            yield cover;

        }
    }
}

