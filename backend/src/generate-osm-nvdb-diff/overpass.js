const querystring = require('querystring')
const fetch = require('node-fetch')
const retry = require('async-retry')
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
  const server =
    Math.random() > 0.5
      ? 'https://lz4.overpass-api.de'
      : 'https://z.overpass-api.de'
  const url = server + '/api/interpreter?' + query

  const data = await retry(async (bail) => {
    const response = await fetch(url)
    return await response.json()
  })
  const geoJson = osmtogeojson(data)
  return geoJson
}
