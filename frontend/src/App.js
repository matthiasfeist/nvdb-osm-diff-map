import OsmFileOverview from './osmOverview/OsmFileOverview'
import Map from './map/Map'
import About from './about/About'
import SectionHeader from './components/SectionHeader'
import PageHeader from './components/PageHeader'

function App() {
  return (
    <div className="bg-gray-100">
      <PageHeader />

      <SectionHeader>About this project</SectionHeader>
      <div className="max-w-7xl mx-auto py-6 px-4 ">
        <About />
      </div>

      <SectionHeader>Difference Map</SectionHeader>
      <div className="max-w-7xl mx-auto">
        <Map />
      </div>

      <SectionHeader>Generated .osm files</SectionHeader>
      <div className="max-w-7xl mx-auto py-6 px-4 ">
        <OsmFileOverview />
      </div>
    </div>
  )
}

export default App
