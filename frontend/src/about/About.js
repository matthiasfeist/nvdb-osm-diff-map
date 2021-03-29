function About() {
  return (
    <p className="max-w-4xl">
      This project provides helper and utility data for the{' '}
      <a
        className="underline"
        href="https://wiki.openstreetmap.org/wiki/Import/Catalogue/Sweden_highway_import"
      >
        Sweden Highway Import
      </a>{' '}
      initative. Please visit the link to read more about the data sources used.
      <br />
      <br />
      This project maintains an automated pipeline which downloads the latest
      data from Trafikverket's NVDB and converts it via nvdb2osm into usable OSM
      files. These files can then be used by members of the community for the
      import without having to download data from NVDB and running the python
      script.
      <br />
      <br />
      It also runs a pipeline which generates a map with the differences between
      the data of NVDB and the current state of Openstreetmap. This map is
      filtered to display the differences by certain tags or for missing
      geometry. On higher zoomlevels the data from NVDB is also overlayed over
      the road network.
      <br />
      The goal is to make it visible where the most mapping effort is needed.
      Please note that this map is very much a work-in-progress and that the
      data from NVDB is not always authorative. That means the amount of
      displayed "errors" will and should never be zero.
    </p>
  )
}
export default About
