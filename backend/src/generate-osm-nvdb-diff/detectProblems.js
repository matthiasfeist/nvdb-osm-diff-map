const h3 = require('h3-js')

/**
 * Generates the list of problems with all the H3 indexes where there is a difference detected
 * @param {Map} nvdbMap
 * @param {Map} overpassMap
 * @returns
 */
module.exports.detectProblems = (nvdbMap, overpassMap) => {
  const resultMap = new Map()

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
        resultMap.set(h3Index, new Set(['missingMajorRoad']))
      } else {
        resultMap.set(h3Index, new Set(['missingMinorRoad']))
      }
      continue
    }

    const resultSet = new Set()
    if (areOsmTagsDifferent(nvdbTags, overpassTags, 'highway')) {
      resultSet.add('highway')
    }
    if (areOsmTagsDifferent(nvdbTags, overpassTags, 'maxspeed')) {
      resultSet.add('maxspeed')
    }
    if (areOsmTagsDifferent(nvdbTags, overpassTags, 'lanes')) {
      resultSet.add('lanes')
    }
    if (areOsmTagsDifferent(nvdbTags, overpassTags, 'name')) {
      resultSet.add('name')
    }
    if (resultSet.size > 0) {
      resultMap.set(h3Index, resultSet)
    }
  }

  // now we have a list of H3 indexes which do differ, now let's check if there is a matching H3 ID nearby.
  // this is meant to filter out all these "jitter" dots that where the geometry is more than one H3index off.
  resultMap.forEach((h3Index) => {
    const idsAround = h3.kRingDistances(h3Index, 1)[1]
    for (const h3RingIndex of idsAround) {
      if (resultMap.has(h3RingIndex)) {
        return // there is an entry nearby. do nothing
      }
    }
    // no entry in the map nearby. Delete this point from the map
    resultMap.delete(h3Index)
  })

  return resultMap
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
