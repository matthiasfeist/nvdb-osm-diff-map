const trafikverketData = require('./trafikverket-data.json')
const AWS = require('aws-sdk')
const lambda = new AWS.Lambda()
const s3 = new AWS.S3()
const ec2 = new AWS.EC2()
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
    await startEc2WithTippecanoe()
  }

  if (event?.action === 'generateOsmNvdbDiffs') {
    await processOsmFileFromS3(event.slug)
  }

  return event
}

async function startEc2WithTippecanoe() {
  const BUCKET_NAME = process.env.BUCKET_NAME

  const userData = [
    '#!/bin/bash',
    'sleep 600', // so that the lambda functions have some time to finish
    'shutdown -h +300', // 5 hours. just to make sure we're not running an expensive server forever in case something goes wrong
    'yum update -y',
    'yum install git zlib zlib-devel gcc-c++ sqlite-devel -y',
    'git clone --depth 1 https://github.com/mapbox/tippecanoe.git',
    'cd tippecanoe/',
    'make install',
    'cd ..',
    `aws s3 cp s3://${BUCKET_NAME}/tiles/json ./json/ --recursive --only-show-errors`,
    'mkdir pbf',
    'tippecanoe -e pbf/ --maximum-zoom=15 --minimum-zoom=6 --read-parallel --drop-densest-as-needed --reorder --coalesce --generate-ids --force json/*.json',
    'rm -rf json/',
    'aws configure set default.s3.max_concurrent_requests 30',
    'aws configure set default.s3.max_queue_size 3000',
    'for i in {6..15}', // we're doing this to upload the largest zoom levels first
    '  do',
    '  echo "Uploading zoom level $i"',
    `  aws s3 cp ./pbf/$i s3://${BUCKET_NAME}/tiles/pbf/$i --acl public-read --recursive --content-encoding gzip --only-show-errors`,
    'done',
    `aws s3 rm s3://${BUCKET_NAME}/tiles/json --recursive --only-show-errors`, // remove the now obsolete json files
    'shutdown -h',
  ]

  const params = {
    ImageId: 'ami-02a6bfdcf8224bd77', // Amazon Linux 2 AMI
    InstanceType: 'c5.xlarge',
    KeyName: 'test2',
    MaxCount: 1,
    MinCount: 1,
    InstanceInitiatedShutdownBehavior: 'terminate',
    IamInstanceProfile: {
      Arn:
        'arn:aws:iam::071192883413:instance-profile/Ec2InstanceProfileForDataConversion',
    },
    Monitoring: { Enabled: true },
    UserData: Buffer.from(userData.join('\n')).toString('base64'),
    BlockDeviceMappings: [
      {
        DeviceName: '/dev/xvda',
        Ebs: {
          DeleteOnTermination: true,
          VolumeSize: 30,
          VolumeType: 'gp2',
        },
      },
    ],
    TagSpecifications: [
      {
        ResourceType: 'instance',
        Tags: [{ Key: 'Name', Value: 'TileRender-Tippecanoe' }],
      },
    ],
  }
  await ec2.runInstances(params).promise()
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
    const processingResult = await processOsm(osmXmlString, slug)
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
