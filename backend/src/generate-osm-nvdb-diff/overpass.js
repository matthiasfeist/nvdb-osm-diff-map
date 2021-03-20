const querystring = require('querystring')
const fetch = require('node-fetch')
const osmtogeojson = require('osmtogeojson')

module.exports.getGeoJsonFromOverpass = async (bbox) => {
  const overpassQuery = `
    [out:json][timeout:25][bbox:${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]}];
    (
      way["highway"~"motoryway|trunk|primary|primary_link|secondary|secondary_link|tertiary|residential|unclassified|service|track|cycleway"];
      relation["highway"~"motoryway|trunk|primary|primary_link|secondary|secondary_link|tertiary|residential|unclassified|service|track|cycleway"];
    );
    out geom;
    `
  const query = querystring.encode({ data: overpassQuery })
  const url = 'https://overpass-api.de/api/interpreter?' + query

  const response = await fetch(url)
  const data = await response.json()
  const geoJson = osmtogeojson(data)
  return geoJson
}
