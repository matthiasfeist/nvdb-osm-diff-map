import useData from '../useData'
import Details from './Details'
import { formatDistance } from 'date-fns'

function OsmFileOverview() {
  const { data, isError } = useData()

  if (isError || !data) {
    return <div>Error: Could not load the status of the OSM files</div>
  }

  const listOfFiles = data.data
  const details = listOfFiles.map((dataEntry) => {
    return (
      <Details
        key={dataEntry.id}
        displayName={dataEntry.displayName}
        sourceData={dataEntry.sourceData}
        generatedData={dataEntry.generatedData}
      />
    )
  })

  const metaGeneratedDate = data.meta?.generatedDate
  let metaGeneratedElement = null
  if (metaGeneratedDate) {
    metaGeneratedElement = (
      <p className="text-sm font-medium text-gray-700">
        Report generated:{' '}
        {formatDistance(new Date(metaGeneratedDate), new Date(), {
          addSuffix: true,
        })}
        . You can find the source data{' '}
        <a href="data-index.json" className="underline">
          here
        </a>
      </p>
    )
  }

  return (
    <div>
      {metaGeneratedElement}
      <div className="grid grid-cols-3 gap-5 py-4">{details}</div>
    </div>
  )
}

export default OsmFileOverview
