const { osmXmlToGeoJson } = require('./osmXmlToGeoJson')
const { getGeoJsonFromOverpass } = require('./overpass')
const { preprocessGeoJson } = require('./preprocessGeoJson')
const { detectProblems } = require('./detectProblems')
const { DETAILED_ZOOMLEVEL_SWITCH } = require('./config')
const {
  mapToLargerH3Indexes,
  generateProblemsGeoJsonObjects,
  generateNvdbGeometryGeoJsonObjects,
} = require('./outputFormatter')
const bbox = require('@turf/bbox').default

module.exports.processOsm = async (osmXmlString, slug) => {
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
  const problemsMap = detectProblems(resultMapNvdb, resultMapOverpass)
  console.timeEnd('layers')
  console.time('mapToLarger')
  console.timeEnd('mapToLarger')

  const geoJsonLines = [
    ...generateProblemsGeoJsonObjects(
      problemsMap,
      slug,
      DETAILED_ZOOMLEVEL_SWITCH,
      16
    ),
    ...generateProblemsGeoJsonObjects(
      mapToLargerH3Indexes(problemsMap),
      slug,
      6,
      DETAILED_ZOOMLEVEL_SWITCH - 1
    ),
    ...generateNvdbGeometryGeoJsonObjects(
      nvdbGeoJson,
      DETAILED_ZOOMLEVEL_SWITCH
    ),
  ]

  // can be used for debugging locally if you want valid GeoJson
  // return JSON.stringify(
  //   {
  //     type: 'FeatureCollection',
  //     features: geoJsonLines,
  //   }
  // )

  return geoJsonLines
    .map((polygon) => {
      return JSON.stringify(polygon)
    })
    .join('\n')
}
