const geojson2h3 = require('geojson2h3')
const h3 = require('h3-js')
const { H3_RESOLUTION_OVERVIEW } = require('./config')
const { featureEach } = require('@turf/meta')
const { getType } = require('@turf/invariant')

module.exports.mapToLargerH3Indexes = (problemsMap) => {
  const newMap = new Map()
  problemsMap.forEach((setWithProblems, h3Index) => {
    const parentH3 = h3.h3ToParent(h3Index, H3_RESOLUTION_OVERVIEW)
    if (!newMap.has(parentH3)) {
      newMap.set(parentH3, new Set())
    }
    setWithProblems.forEach((problem) => newMap.get(parentH3).add(problem))
  })
  return newMap
}

module.exports.generateProblemsGeoJsonObjects = (
  problemsMap,
  slug,
  minzoom,
  maxzoom
) => {
  const result = []
  problemsMap.forEach((setWithProblems, h3Index) => {
    const props = {
      missingMajorRoad: setWithProblems.has('missingMajorRoad'),
      missingMinorRoad: setWithProblems.has('missingMinorRoad'),
      highway: setWithProblems.has('highway'),
      maxspeed: setWithProblems.has('maxspeed'),
      lanes: setWithProblems.has('lanes'),
      name: setWithProblems.has('name'),
      slug,
    }
    const polygon = geojson2h3.h3ToFeature(h3Index, props)
    polygon.tippecanoe = { layer: 'problems', minzoom, maxzoom }
    delete polygon.id
    result.push(polygon)
  })
  return result
}

module.exports.generateNvdbGeometryGeoJsonObjects = (nvdbGeoJson, minzoom) => {
  const result = []
  featureEach(nvdbGeoJson, (currentFeature) => {
    if (getType(currentFeature) !== 'LineString') {
      return
    }
    currentFeature.tippecanoe = { layer: 'nvdb', minzoom }

    const highway = currentFeature?.properties?.highway
    if (highway === 'footway' || highway === 'cycleway') {
      currentFeature.tippecanoe = { layer: 'footcycle', minzoom: 14 }
    }

    const props = {
      highway,
      maxspeed: currentFeature?.properties?.maxspeed,
      lanes: currentFeature?.properties?.lanes,
      name: currentFeature?.properties?.name,
    }

    currentFeature.properties = props
    delete currentFeature.id
    result.push(currentFeature)
  })
  return result
}
