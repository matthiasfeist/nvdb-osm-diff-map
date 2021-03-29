import Button from './Button'
import { differenceInDays, formatDistance } from 'date-fns'

function Details(props) {
  const { id, displayName, sourceData, generatedData } = props
  const { descr, status = 'error' } = getStatus(sourceData, generatedData)
  let badge = null
  switch (status) {
    case 'warning':
      badge = (
        <span className="bg-yellow-200 text-yellow-800 ml-2 px-2 inline-flex text-xs leading-6 font-semibold uppercase rounded-full">
          warning
        </span>
      )
      break
    case 'ok':
      badge = (
        <span className="bg-green-200 text-green-800 ml-2 px-2 inline-flex text-xs leading-6 font-semibold uppercase rounded-full">
          ok
        </span>
      )
      break
    case 'error':
    default:
      badge = (
        <span className="bg-red-200 text-red-800 ml-2 px-2 inline-flex text-xs leading-6 font-semibold uppercase rounded-full">
          error
        </span>
      )
      break
  }

  const buttons = []
  if (generatedData?.osm?.downloadLink) {
    buttons.push(
      <Button
        key="osmdownload"
        caption="Download .osm"
        size_bytes={generatedData?.osm?.size_bytes}
        link={generatedData?.osm?.downloadLink}
        icon="download"
      />
    )
  }
  if (generatedData?.log?.downloadLink) {
    buttons.push(
      <Button
        key="logdownload"
        caption="Download .log"
        link={generatedData?.log?.downloadLink}
        icon="download"
      />
    )
  }

  return (
    <div id={id} className="rounded-lg shadow bg-white">
      <div className="px-4 py-5">
        <h3 className="flex text-lg leading-6 font-medium text-gray-900">
          {displayName} {badge}
        </h3>
        {descr && (
          <div className="mt-1 max-w-2xl text-sm text-gray-500">{descr}</div>
        )}
      </div>
      {buttons.length > 0 && (
        <div className="border-t border-gray-200 pt-4 pb-1 px-4 flex flex-wrap	">
          {buttons}
        </div>
      )}
    </div>
  )
}

function getStatus(sourceData, generatedData) {
  const now = new Date()
  const downloadedDate = sourceData?.downloadedDate
    ? new Date(sourceData?.downloadedDate)
    : null

  if (!sourceData || !downloadedDate) {
    return {
      descr:
        'NVDB data not available for automatic download from Trafikverket Lastkajen feed',
      status: 'error',
    }
  }
  if (differenceInDays(now, downloadedDate) > 40) {
    return {
      descr: 'NVDB data is old. Update did not work.',
      status: 'warning',
    }
  }

  if (!generatedData?.osm && !generatedData?.log) {
    return {
      descr:
        'Pipeline error. The generation of the .osm file and the .log file was not successful',
      status: 'error',
    }
  }

  if (!generatedData?.osm && generatedData?.log) {
    return {
      descr:
        'The .osm file was not generated. Please see the logfile for errors',
      status: 'error',
    }
  }

  if (generatedData?.osm && !generatedData?.log) {
    return {
      descr:
        'Pipeline error. Only the .osm file was generated but no .log file.',
      status: 'warning',
    }
  }

  if (generatedData?.osm && generatedData?.log) {
    const osmGeneratedDate = generatedData?.osm?.generatedDate
      ? new Date(generatedData.osm.generatedDate)
      : null
    const logGeneratedDate = generatedData?.log?.generatedDate
      ? new Date(generatedData.log.generatedDate)
      : null

    if (differenceInDays(now, osmGeneratedDate) > 40) {
      return {
        descr: `The .osm file is old (${age(osmGeneratedDate)}). 
        Something in the pipeline has gone wrong.`,
        status: 'warning',
      }
    }

    if (Math.abs(differenceInDays(osmGeneratedDate, logGeneratedDate)) > 1) {
      return {
        descr: `the .osm file and the .log file are not in sync 
        (a difference of ${age(osmGeneratedDate, logGeneratedDate)}). 
        Something in the pipeline has gone wrong`,
        status: 'warning',
      }
    }

    return {
      descr: `Files generated ${formatDistance(osmGeneratedDate, new Date(), {
        addSuffix: true,
      })}.`,
      status: 'ok',
    }
  }

  return {
    descr: 'Unknown error',
    status: 'error',
  }
}

function age(date1, date2) {
  if (!date2) {
    date2 = new Date()
  }
  return formatDistance(date2, date1)
}

export default Details
