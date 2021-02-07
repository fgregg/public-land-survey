"use strict";

let x = document.getElementById("demo");

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  } else { 
    x.innerHTML = "Geolocation is not supported by this browser.";
  }
}

function cardinalDirection(closest_point, current_x, current_y) {
  let degrees = Math.atan2(closest_point[1] - current_y, closest_point[0] - current_x) * 180 / Math.PI
  if (degrees < 0) {
    degrees += 360
  }
  const compass_quadrants = ["E", "NE", "N", "NW", "W", "SW", "S", "SE", "E"]
  return compass_quadrants[Math.round(degrees/45)]
}


function showPosition(position) {
    const mi_url = `https://services1.arcgis.com/7w1SUsLNZbGKoz6h/arcgis/rest/services/Michigan_vegetation_c1800/FeatureServer/0/query?geometry=${position.coords.longitude}%2C${position.coords.latitude}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&units=esriSRUnit_StatuteMile&outFields=COVERTYPE%2COBJECTID%2CACRES&returnCentroid=true&f=pjson`
    fetch(mi_url + '&distance=0.0&returnQueryGeometry=true&returnGeometry=false').then(response => response.json()).then(function(json) {
      const local_vegetation = json.features[0]
      const current_x = json.queryGeometry.x
      const current_y = json.queryGeometry.y
      fetch(mi_url + `&distance=1.0&where=OBJECTID+<>+${local_vegetation.attributes.OBJECTID}`).then(response => response.json()).then(function(json) {
        const nearby_vegetation = json.features
        x.innerHTML = `<h1>${local_vegetation.attributes.COVERTYPE}</h1>`
        for (const feature of nearby_vegetation) {
            let min_distance = Infinity
            let closest_point = [0.0, 0.0]
            for (const point of feature.geometry.rings[0]) {
                const dist = Math.hypot(point[0] - current_x, point[1] - current_y)
                if (dist < min_distance) {
                    min_distance = dist
                    closest_point = point              
                }
            }

            x.innerHTML += `<br />${feature.attributes.COVERTYPE}, ${+(min_distance * 0.000621371).toFixed(2)}, ${cardinalDirection(closest_point, current_x, current_y)}`
        }
    })
})
}