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


class LandCoverServer {
    constructor(cover_field_name) {
        this.baseURL = 'https://services1.arcgis.com/7w1SUsLNZbGKoz6h/arcgis/rest/services/Michigan_vegetation_c1800/FeatureServer/0/query?'
        this.cover_field_name = cover_field_name
        this.projected_points = new Map()
    }

    async cover(position) {
        const params = new URLSearchParams({geometry: [position.x, position.y],
                                            geometryType: 'esriGeometryPoint',
                                            inSR: 4326,
                                            spatialRel: 'esriSpatialRelIntersects',
                                            f: 'pjson',
                                            returnGeometry: false,
                                            returnQueryGeometry: true,
                                            outFields: [this.cover_field_name, 'OBJECTID']})
        const url = this.baseURL + params.toString()
        const response = await fetch(url)
        const json = await response.json()
        
        // cache the projected lat long
        this.projected_points.set(position.toString(), new Point(json.queryGeometry.x, json.queryGeometry.y))

        return {cover_type: json.features[0].attributes[this.cover_field_name],
                OBJECTID: json.features[0].attributes.OBJECTID}
    }

    async* covers_within_buffer(position, buffer=0, exclude_object) {
        const params = new URLSearchParams({geometry: [position.x, position.y],
                                            geometryType: 'esriGeometryPoint',
                                            inSR: 4326,
                                            spatialRel: 'esriSpatialRelIntersects',
                                            f: 'pjson',
                                            distance: buffer,
                                            units: 'esriSRUnit_StatuteMile',
                                            where: `OBJECTID <> ${exclude_object}`,
                                            outFields: [this.cover_field_name]})
        const url = this.baseURL + params.toString()
        const response = await fetch(url);
        const json = await response.json()

        // could make his more robust and if we haven't seen lat longs before then
        // query the server
        const current_point = this.projected_points.get(position.toString())

        for (const feature of json.features) {
            const cover = new Cover(feature.geometry.rings[0], feature.attributes[this.cover_field_name])
            cover.center(current_point)
            yield cover

        }
    }
}

class Cover {
    constructor(ring, cover_type) {
        this.ring = ring.map(point_array => new Point(...point_array))
        this.cover_type = cover_type
    }

    center(origin_point) {
        this.ring = this.ring.map(point => point.subtract(origin_point))
    }

    closest_point() {
        // closest point in the polygon to the origin
        let minDistance = Infinity
        let closestPoint
        for (const point of this.ring) {
            const dist = point.length()
            if (dist < minDistance) {
                minDistance = dist
                closestPoint = point
            }
        }
        return closestPoint
    }
}

class Text {
    constructor(body) {
        this.body = body
        this.compass_quadrants = ["east", "northeast", "north", "northwest", "west", "southwest", "south", "southeast", "east"]
        this.nearby_covers = new Map(this.compass_quadrants.map(direction => [direction, []]))
        this.sentence_patterns = [(direction, distance, cover) => `To the ${direction}, there is a ${cover} in about ${distance}`,
                                  (direction, distance, cover) => `There is a ${cover} about ${distance} ${direction} of here`,
                                  (direction, distance, cover) => `To the ${direction}, in about ${distance}, there is a ${cover}`]
        this.sentence_patterns.sample = function() {
            return this[Math.floor(Math.random() * this.length)]
        }

    }

    current_cover(cover) {
        this.body.innerHTML = `<p>You are in a <strong>${cover.cover_type.toLowerCase()}</strong>.</p>`
    }

    nearby_cover(cover) {

        const direction = this.cardinalDirection(cover.closest_point())
        this.nearby_covers.get(direction).push(cover)
    }

    finalize() {

        this.body.innerHTML += '<p>'
        for (const direction of this.compass_quadrants) {
            let covers = this.nearby_covers.get(direction)
            covers.map(cover => cover.closest_point = cover.closest_point())
            covers.map(cover => cover.distance = cover.closest_point.length())
            covers.sort((a, b) => a.distance - b.distance)
            let sentence = ''

            for (const [idx, cover] of covers.entries()) {
                const distance = this.meters_to_miles(cover.distance)
                let human_distance
                if (idx === 0) {
                   if (distance < 0.0625) {
                        sentence = `There is a ${cover.cover_type.toLowerCase()} just to the ${direction}`
                    } else {
                        if (distance > 0.9375) {
                            human_distance = 'a mile'
                        } else {
                            human_distance = `${this.human_fractions(distance)} of a mile`
                        }
                        sentence = this.sentence_patterns.sample()(direction, human_distance, cover.cover_type.toLowerCase())
                    }
        
                } else if (idx < (covers.length - 1)) {
                    if (distance > 0.9375) {
                        sentence += `, a ${cover.cover_type.toLowerCase()} in about a mile`
                    } else {
                         sentence += `, a ${cover.cover_type.toLowerCase()} in about ${this.human_fractions(distance)} of a mile`
                    }
                } else {
                    if (distance > 0.9375) {
                        sentence += ` and a ${cover.cover_type.toLowerCase()} in about a mile`
                    } else {
                       sentence += ` and a ${cover.cover_type.toLowerCase()} in about ${this.human_fractions(distance)} of a mile`
                    }

                }
            }
            if (sentence !== '') {
                this.body.innerHTML += sentence + '. '
            }
        }

        this.body.innerHTML += '</p>'
    }

    cardinalDirection(point) {
        const degrees = point.angle_degrees()
        return this.compass_quadrants[Math.round(degrees/45)]
    }

    meters_to_miles(meters) {
        return meters * 0.000621371    
    }

    human_fractions(distance) {
        const vulgar_fractions = [undefined, '⅛', '¼', '½', '½', '½', '¾', '¾', undefined]
        return vulgar_fractions[Math.round(distance/0.125)]

    }
    
}

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  } else { 
    x.innerHTML = "Geolocation is not supported by this browser.";
  }
}

async function showPosition(browser_position) {
    const lat_lon_position = new Point(browser_position.coords.longitude, browser_position.coords.latitude)
    const landCoverServer = new LandCoverServer('COVERTYPE')
    const text = new Text(body)

    const local_vegetation = await landCoverServer.cover(lat_lon_position)
    text.current_cover(local_vegetation)

    const nearby_vegetation = landCoverServer.covers_within_buffer(lat_lon_position, 1.0, local_vegetation.OBJECTID)
    for await (const cover of nearby_vegetation) {
        text.nearby_cover(cover)
    }

    text.finalize()
}

let body = document.getElementById("demo");
