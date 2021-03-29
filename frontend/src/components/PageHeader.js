function PageHeader(props) {
  return (
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
  )
}
export default PageHeader
