import OsmFileOverview from './osmOverview/OsmFileOverview'
import Map from './map/Map'

function App() {
  return (
    <div className="bg-gray-100">
      <nav className="bg-blue-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-16">
            <div className="flex ml-4 flex items-centerd">
              <h1 className="text-3xl tracking-tight font-medium text-white">
                Nvdb2Osm Import Helper
              </h1>
            </div>
            <div className="flex items-centerd">
              <a
                href="https://github.com/matthiasfeist/nvdb-osm-diff-map"
                className="text-white hover:bg-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Github
              </a>
            </div>
          </div>
        </div>
      </nav>

      <header className="shadow-md bg-white">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h2 className="text-2xl leading-6 font-medium tracking-tight text-gray-900">
            About this project
          </h2>
        </div>
      </header>
      <div className="max-w-7xl mx-auto py-6 px-4 ">
        I need to add some nice text here...
      </div>

      <header className="shadow-md bg-white">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h2 className="text-2xl leading-6 font-medium tracking-tight text-gray-900">
            Difference Map
          </h2>
        </div>
      </header>
      <div className="max-w-7xl mx-auto">
        <Map />
      </div>

      <header className="shadow-md bg-white">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h2 className="text-2xl leading-6 font-medium tracking-tight text-gray-900">
            Generated .osm files
          </h2>
        </div>
      </header>
      <div className="max-w-7xl mx-auto py-6 px-4 ">
        <OsmFileOverview />
      </div>
    </div>
  )
}

export default App
