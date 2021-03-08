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
  const queue = new PQueue({ concurrency: 2 })

  for (const tvArea of trafikverketData) {
    const areaCode = tvArea.trafikverketAreaCode
    const data = getDataFromFeedItems(feedItems, areaCode)

    if (data === null) {
      console.log('No download link found in feed for', tvArea.name, areaCode)
      continue
    }
    const { downloadLink } = data

    await queue.add(async () => {
      try {
        await uploadUrlToS3(downloadLink, tvArea.slug, BUCKET_NAME)
      } catch (e) {
        console.log('Download/Upload Problem', e)
      }
    })
  }

  // wait for the queue to be completed
  await queue.onIdle()
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
