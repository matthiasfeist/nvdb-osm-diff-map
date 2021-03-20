const trafikverketData = require('./trafikverket-data.json')
const AWS = require('aws-sdk')
const lambda = new AWS.Lambda()
const s3 = new AWS.S3()
const { processOsm } = require('./generate-osm-nvdb-diff/process')

exports.handler = async function (event, context) {
  const selfFunctionName = context?.functionName
  if (!selfFunctionName) {
    console.log('Function name not in context', context)
    return
  }

  // the lambda has been triggered by a schedule
  if (
    event?.source === 'aws.events' &&
    event?.['detail-type'] === 'Scheduled Event'
  ) {
    await executeLambdasToGenerateDiffs(selfFunctionName)
  }

  if (event?.action === 'generateOsmNvdbDiffs') {
    await processOsmFileFromS3(event.slug)
  }

  return event
}

async function executeLambdasToGenerateDiffs(selfFunctionName) {
  // shuffle the data so that not always the same "kommun" are being parsed first
  const shuffledTvData = trafikverketData.sort(() => Math.random() - 0.5)

  for (const tvArea of shuffledTvData) {
    await lambda
      .invoke({
        FunctionName: selfFunctionName,
        InvocationType: 'Event',
        Payload: JSON.stringify({
          action: 'generateOsmNvdbDiffs',
          slug: tvArea.slug,
        }),
      })
      .promise()
    await sleep(300)
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function processOsmFileFromS3(slug) {
  console.log('Processing OSM file', slug)
  console.time('total processing time')

  try {
    const BUCKET_NAME = process.env.BUCKET_NAME
    const s3Response = await s3
      .getObject({
        Bucket: BUCKET_NAME,
        Key: 'osm/' + slug + '.osm',
      })
      .promise()
    const osmXmlString = s3Response.Body.toString('utf-8')
    console.log('S3 object successfully retrieved')

    console.log('Processing OSM XML file')
    const processingResult = await processOsm(osmXmlString)
    console.log('Processing OSM XML file – Done')

    console.log('Start uploading Line Delimited JSON to S3')
    await s3
      .upload({
        Bucket: BUCKET_NAME,
        Key: 'tiles/json/' + slug + '.json',
        Body: processingResult,
      })
      .promise()
  } catch (e) {
    console.log(e)
    throw e
  }

  console.timeEnd('total processing time')
}
