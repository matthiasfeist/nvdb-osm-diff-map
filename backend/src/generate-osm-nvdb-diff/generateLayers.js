const h3 = require('h3-js')

/**
 * Generates the layers with all the H3 indexes where there is a difference detected
 * @param {Map} nvdbMap
 * @param {Map} overpassMap
 * @returns
 */
module.exports.generateLayers = (nvdbMap, overpassMap) => {
  const missingMajorRoads = new Set()
  const missingMinorRoads = new Set()
  const highway = new Set()
  const lanes = new Set()
  const maxspeed = new Set()
  const names = new Set()

  for (const h3Index of nvdbMap.keys()) {
    const nvdbTags = nvdbMap.get(h3Index)
    const overpassTags = overpassMap.get(h3Index)

    // first check if there are h3Indexes that only exist in the nvdb map. This is then a "missing geometry"
    if (!overpassMap.has(h3Index)) {
      const nvdbContainsLargerRoads = Array.from(nvdbTags).some((tags) =>
        ['motorway', 'trunk', 'primay', 'secondary', 'tertiary'].includes(
          tags.highway
        )
      )
      if (nvdbContainsLargerRoads) {
        missingMajorRoads.add(h3Index)
      } else {
        missingMinorRoads.add(h3Index)
      }
      continue
    }

    if (areOsmTagsDifferent(nvdbTags, overpassTags, 'highway')) {
      highway.add(h3Index)
    }
    if (areOsmTagsDifferent(nvdbTags, overpassTags, 'maxspeed')) {
      maxspeed.add(h3Index)
    }
    if (areOsmTagsDifferent(nvdbTags, overpassTags, 'lanes')) {
      lanes.add(h3Index)
    }
    if (areOsmTagsDifferent(nvdbTags, overpassTags, 'name')) {
      names.add(h3Index)
    }
  }

  // now we have a list of H3 indexes which do differ, now let's check if there is a matching H3 ID nearby.
  // this is meant to filter out all these "jitter" dots that where the geometry is more than one H3index off.
  const filterJitterEntires = (setToFilter) => {
    setToFilter.forEach((h3Index) => {
      const idsAround = h3.kRingDistances(h3Index, 1)[1]
      for (const h3RingIndex of idsAround) {
        if (setToFilter.has(h3RingIndex)) {
          return // there is an entry nearby. do nothing
        }
      }
      // no entry in the map nearby. Delete this point from the map
      setToFilter.delete(h3Index)
    })
  }

  const layerMap = new Map()
  layerMap.set('missingMajorRoads', missingMajorRoads)
  layerMap.set('missingMinorRoads', missingMinorRoads)
  layerMap.set('highway', highway)
  layerMap.set('maxspeed', maxspeed)
  layerMap.set('lanes', lanes)
  layerMap.set('names', names)

  layerMap.forEach((h3IndexSet) => filterJitterEntires(h3IndexSet))
  return layerMap
}

function areOsmTagsDifferent(nvdbOsmTags, overpassOsmTags, tagName) {
  const differentValues = new Set()

  nvdbOsmTags.forEach((item) => {
    const highwayType = item.highway
    if (
      (highwayType === 'track' || highwayType === 'unclassified') &&
      tagName === 'maxspeed'
    ) {
      return
    }
    if (item[tagName]) differentValues.add(item[tagName])
  })
  overpassOsmTags.forEach((item) => {
    if (item[tagName]) differentValues.delete(item[tagName])
  })

  // now we prune the differences depending on the tags:
  switch (tagName) {
    case 'highway':
      differentValues.delete('track')
      differentValues.delete('footway')
      differentValues.delete('cycleway')
      differentValues.delete('service')
      differentValues.delete('unclassified')
      break
  }

  return differentValues.size > 0
}
