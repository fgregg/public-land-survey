"use strict";

class Point {
    constructor(x, y) {
        this.x = x
        this.y = y
    }

    subtract(other_point) {
        return new Point(this.x - other_point.x, this.y - other_point.y)
    }

    length() {
        // distance from the origin to the point
        return Math.hypot(...this)
    }

    angle_degrees() {
        // angle in degrees between the x axis and the ray passing
        // through the point
        let degrees = Math.atan2(this.y, this.x) * 180 / Math.PI
        if (degrees < 0) {
          degrees += 360
        }
        return degrees
    }

    *[Symbol.iterator]() {
        yield this.x;
        yield this.y;
    }

}

function meters_to_miles(meters) {
    return meters * 0.000621371    
}

class GeoServer {
    constructor(fields_query) {
        this.baseURL = 'https://services1.arcgis.com/7w1SUsLNZbGKoz6h/arcgis/rest/services/Michigan_vegetation_c1800/FeatureServer/0/query?'
        this.fields_query = fields_query
        this.projected_position = undefined 
        // COVERTYPE%2COBJECTID%2CACRES
    }

    cover = async (position) => {
        const url = this.baseURL + `geometry=${position.x}%2C${position.y}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&units=esriSRUnit_StatuteMile&outFields=${this.fields_query}&returnCentroid=true&f=pjson&returnQueryGeometry=true&returnGeometry=false`
        const response = await fetch(url)
        return response.json()
    }

    covers_within_buffer = async (position, buffer=0, exclude_object=undefined) => {
        let url = this.baseURL + `geometry=${position.x}%2C${position.y}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&units=esriSRUnit_StatuteMile&outFields=${this.fields_query}&returnCentroid=true&f=pjson&distance=${buffer}&where=OBJECTID+<>+${exclude_object}`
        const response = await fetch(url);
        return response.json()
    }





}

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  } else { 
    x.innerHTML = "Geolocation is not supported by this browser.";
  }
}

function cardinalDirection(point) {
    let compass_quadrants = ["E", "NE", "N", "NW", "W", "SW", "S", "SE", "E"]
    const degrees = point.angle_degrees()
    return compass_quadrants[Math.round(degrees/45)]
}


async function showPosition(browser_position) {
    let lat_lon_position = new Point(browser_position.coords.longitude, browser_position.coords.latitude)
    let geoServer = new GeoServer('COVERTYPE%2COBJECTID%2CACRES')
    let cover_response = await geoServer.cover(lat_lon_position)
    let local_vegetation = cover_response.features[0]
    let current_point = new Point(cover_response.queryGeometry.x, cover_response.queryGeometry.y)
    let response = await geoServer.covers_within_buffer(lat_lon_position, 1.0, local_vegetation.attributes.OBJECTID)
    let nearby_vegetation = response.features
    body.innerHTML = `<h1>${local_vegetation.attributes.COVERTYPE}</h1>`
    for (let feature of nearby_vegetation) {
        let min_distance = Infinity
        let closest_point
        for (let point_array of feature.geometry.rings[0]) {
            let point = new Point(...point_array).subtract(current_point)
            const dist = point.length()
            if (dist < min_distance) {
                min_distance = dist
                closest_point = point              
             }
        }
        body.innerHTML += `<br />${feature.attributes.COVERTYPE}, ${+(meters_to_miles(min_distance)).toFixed(2)}, ${cardinalDirection(closest_point)}`
    }
}

let body = document.getElementById("demo");
