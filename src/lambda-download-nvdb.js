const trafikverketData = require('./trafikverket-data.json')

const AWS = require('aws-sdk')
const s3 = new AWS.S3()
const fetch = require('node-fetch')
const xml2js = require('xml2js')
const { default: PQueue } = require('p-queue')

exports.handler = async function (event, context) {
  const BUCKET_NAME = process.env.BUCKET_NAME

  const trafVerkResponse = await fetch(
    'https://lastkajen.trafikverket.se/Logistics/feed.aspx'
  )
  if (!trafVerkResponse.ok) {
    console.log(
      'Trafikverket Lastkajen Feed responed with',
      trafVerkResponse.status
    )
    return
  }
  const feed = await parseXml(await trafVerkResponse.text())

  const feedItems = feed.rss.channel.item
  const resultDoc = []
  const queue = new PQueue({ concurrency: 2 })

  for (const tvArea of trafikverketData) {
    const areaCode = tvArea.trafikverketAreaCode
    const data = getDataFromFeedItems(feedItems, areaCode)

    const resultDocItem = {
      name: tvArea.name,
      slug: tvArea.slug,
      publishedDate: null,
      error: false,
      errorDescription: null,
      downloadedDate: null,
    }
    resultDoc.push(resultDocItem)

    if (data === null) {
      console.log('No download link found in feed for', tvArea.name, areaCode)
      resultDocItem.error = true
      resultDocItem.errorDescription =
        'No Shapefile download found in Trafikverket Lastkajen Feed file'
      continue
    }
    const { downloadLink, publishedDate } = data
    resultDocItem.publishedDate = publishedDate

    await queue.add(async () => {
      try {
        await uploadUrlToS3(downloadLink, tvArea.slug, BUCKET_NAME)
      } catch (e) {
        console.log('Download/Upload Problem', e)
        resultDocItem.error = true
        resultDocItem.errorDescription =
          'Download problem from Trafikverket Lastkajen'
      }
      resultDocItem.downloadedDate = new Date().toISOString()
    })
  }

  // wait for the queue to be completed
  await queue.onIdle()

  // now write the result JSON file to S3:
  try {
    await s3
      .upload({
        Bucket: BUCKET_NAME,
        Key: 'nvdb-zip/metadata.json',
        Body: JSON.stringify({
          createdAt: new Date().toISOString(),
          result: resultDoc,
        }),
      })
      .promise()
  } catch (e) {
    console.log(e)
  }
}

function parseXml(xmlString) {
  return new Promise((resolve, reject) => {
    return xml2js.parseString(
      xmlString,
      { trim: true, explicitArray: false },
      (err, value) => {
        if (err) {
          return reject(err)
        } else {
          return resolve(value)
        }
      }
    )
  })
}

function getDataFromFeedItems(feedItems, areaCode) {
  const matchingFeedItem = feedItems.find(
    (feedItem) =>
      feedItem.description.endsWith(areaCode) && feedItem.title.match(/Shape/g)
  )
  if (
    !matchingFeedItem ||
    !matchingFeedItem.link ||
    !matchingFeedItem.pubDate
  ) {
    return null
  }
  return {
    downloadLink: matchingFeedItem.link,
    publishedDate: new Date(matchingFeedItem.pubDate).toISOString(),
  }
}

async function uploadUrlToS3(url, slug, BUCKET_NAME) {
  console.log('Start download of', slug, url)
  const downloadResp = await fetch(url)
  if (!downloadResp.ok) {
    console.log(
      'Trafikverket Lastkajen download responed with',
      downloadResp.status
    )
    throw new Error('Trafikverket download HTTP status ' + downloadResp.status)
  }

  console.log('Start upload to S3 of', slug)
  const targetFilename = slug + '.zip'
  await s3
    .upload({
      Bucket: BUCKET_NAME,
      Key: 'nvdb-zip/' + targetFilename,
      Body: downloadResp.body,
    })
    .promise()

  console.log('Done', slug)
}
