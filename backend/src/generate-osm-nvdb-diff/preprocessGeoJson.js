const { featureEach } = require('@turf/meta')
const lineChunk = require('@turf/line-chunk')
const { getCoords, getType } = require('@turf/invariant')

const h3 = require('h3-js')
const { H3_RESOLUTION_DETAILED } = require('./config')

/**
 * Parses all LineString features in the GeoJson, creates chunks from it
 * and returns a Map of H3 indexes and all properties
 * @param {Object} geoJson
 * @returns
 */
module.exports.preprocessGeoJson = (geoJson) => {
  const map = new Map()
  featureEach(geoJson, (currentFeature) => {
    if (getType(currentFeature) !== 'LineString') {
      return
    }

    const chunks = lineChunk(currentFeature, 10, { units: 'meters' })
    featureEach(chunks, (currentChunk) => {
      const [lon, lat] = getCoords(currentChunk)[0]
      const h3Index = h3.geoToH3(lat, lon, H3_RESOLUTION_DETAILED)
      if (!map.has(h3Index)) {
        map.set(h3Index, new Set())
      }
      map.get(h3Index).add(currentFeature.properties)
    })
  })
  return map
}
