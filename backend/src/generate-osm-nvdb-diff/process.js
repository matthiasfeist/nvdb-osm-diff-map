const { osmXmlToGeoJson } = require('./osmXmlToGeoJson')
const { getGeoJsonFromOverpass } = require('./overpass')
const { preprocessGeoJson } = require('./preprocessGeoJson')
const { generateLayers } = require('./generateLayers')
const {
  mapToLargerH3Indexes,
  generateGeoJsonObjects,
} = require('./outputFormatter')
const bbox = require('@turf/bbox').default

module.exports.processOsm = async (osmXmlString) => {
  console.time('reading OSM XML')
  const nvdbGeoJson = osmXmlToGeoJson(osmXmlString)
  console.timeEnd('reading OSM XML')

  console.time('Loading OverpassData')
  const nvdbDataBBox = bbox(nvdbGeoJson)
  const overpassGeoJson = await getGeoJsonFromOverpass(nvdbDataBBox)
  console.timeEnd('Loading OverpassData')

  console.time('processGeoJson-nvdb')
  const resultMapNvdb = preprocessGeoJson(nvdbGeoJson)
  console.timeEnd('processGeoJson-nvdb')
  console.time('processGeoJson-overpass')
  const resultMapOverpass = preprocessGeoJson(overpassGeoJson)
  console.timeEnd('processGeoJson-overpass')

  console.time('layers')
  const layerMap = generateLayers(resultMapNvdb, resultMapOverpass)
  console.timeEnd('layers')
  console.time('mapToLarger')
  mapToLargerH3Indexes(layerMap)
  const geoJsonLines = generateGeoJsonObjects(layerMap)
  console.timeEnd('mapToLarger')

  return geoJsonLines
    .map((polygon) => {
      return JSON.stringify(polygon)
    })
    .join('\n')
}
