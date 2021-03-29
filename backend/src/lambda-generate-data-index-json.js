const trafikverketData = require('./trafikverket-data.json')

const AWS = require('aws-sdk')
const s3 = new AWS.S3()

exports.handler = async function (event, context) {
  const BUCKET_NAME = process.env.BUCKET_NAME

  const nvdbZipListingResponse = await s3
    .listObjectsV2({ Bucket: BUCKET_NAME, Prefix: 'nvdb-zip/' })
    .promise()
  const nvdbZipListing = nvdbZipListingResponse.Contents

  const osmAndLogsListingResponse = await s3
    .listObjectsV2({ Bucket: BUCKET_NAME, Prefix: 'osm/' })
    .promise()
  const osmAndLogsListing = osmAndLogsListingResponse.Contents

  const resultList = trafikverketData.map((kommunData) => {
    const sourceDownloadedDate = getZipDownloadedDate(
      kommunData.slug,
      nvdbZipListing
    )
    return {
      id: kommunData.slug,
      displayName: kommunData.name,
      sourceData: sourceDownloadedDate
        ? {
            source: 'Trafikverket Lastkajen',
            downloadedDate: sourceDownloadedDate,
          }
        : null,
      generatedData: {
        log: getGeneratedData(
          kommunData.slug,
          'log',
          osmAndLogsListing,
          BUCKET_NAME
        ),
        osm: getGeneratedData(
          kommunData.slug,
          'osm',
          osmAndLogsListing,
          BUCKET_NAME
        ),
      },
    }
  })

  const result = {
    meta: { generatedDate: new Date().toISOString() },
    data: resultList,
  }

  await s3
    .putObject({
      Bucket: BUCKET_NAME,
      Key: 'data-index.json',
      Body: JSON.stringify(result),
      ACL: 'public-read',
      ContentType: 'application/json',
    })
    .promise()
}

function getZipDownloadedDate(slug, nvdbZipListing) {
  const listingItem = nvdbZipListing.find(
    (item) => item.Key === 'nvdb-zip/' + slug + '.zip'
  )
  if (!listingItem) {
    return null
  }
  return new Date(listingItem.LastModified).toISOString()
}

function getGeneratedData(slug, ext, osmAndLogsListing, bucketname) {
  const item = osmAndLogsListing.find(
    (item) => item.Key === 'osm/' + slug + '.' + ext
  )
  if (!item) {
    return null
  }

  return {
    generatedDate: new Date(item.LastModified).toISOString(),
    downloadLink: `https://${bucketname}.s3.amazonaws.com/osm/${slug}.${ext}`,
    size_bytes: item.Size,
  }
}
