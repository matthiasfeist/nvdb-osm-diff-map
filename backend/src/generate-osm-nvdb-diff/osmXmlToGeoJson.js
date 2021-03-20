const osmtogeojson = require('osmtogeojson')
const osmXmlParser = require('osmtogeojson/parse_osmxml')

module.exports.osmXmlToGeoJson = (xmlStr) => {
  return osmtogeojson(osmXmlParser.parseFromString(xmlStr))
}
