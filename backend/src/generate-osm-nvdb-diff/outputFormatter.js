const geojson2h3 = require('geojson2h3')
const h3 = require('h3-js')
const { H3_RESOLUTION_OVERVIEW } = require('./config')

module.exports.mapToLargerH3Indexes = (layerMap) => {
  layerMap.forEach((setOfH3Indexes, layerName) => {
    const newSet = new Set()
    setOfH3Indexes.forEach((detailedH3Index) =>
      newSet.add(h3.h3ToParent(detailedH3Index, H3_RESOLUTION_OVERVIEW))
    )
    layerMap.set(layerName, newSet)
  })
}

module.exports.generateGeoJsonObjects = (layerMap) => {
  const result = []
  layerMap.forEach((h3IndexSet, layerName) => {
    h3IndexSet.forEach((h3Index) => {
      const polygon = geojson2h3.h3ToFeature(h3Index)
      polygon.tippecanoe = { layer: layerName }
      result.push(polygon)
    })
  })
  return result
}
