const AWS = require('aws-sdk')
const ec2 = new AWS.EC2()

exports.handler = async function (event, context) {
  const BUCKET_NAME = process.env.BUCKET_NAME
  const OSM_FOLDER = 'osm'

  const userData = [
    '#!/bin/bash',
    'shutdown -h +1440', // 1 day. just to make sure we're not running an expensive server forever in case something goes wrong
    'yum update -y',
    'yum install python3 git -y',
    'python3 -m venv python-env',
    'source ./python-env/bin/activate',
    'pip install pip --upgrade',
    'git clone --depth 1 https://github.com/atorger/nvdb2osm.git',
    'cd nvdb2osm/',
    'pip install -r requirements.txt',
    'mkdir data',
    `aws s3 sync s3://${BUCKET_NAME}/nvdb-zip/ ./data/`,
    'for f in ./data/*.zip',
    'do',
    '  echo ${f%.zip}',
    '  osmfile=${f%.zip}.osm',
    '  logfile=${f%.zip}.log',
    '  python nvdb2osm.py $f $osmfile -v --skip_railway 2>&1 | tee $logfile',
    `  aws s3 cp $logfile s3://${BUCKET_NAME}/${OSM_FOLDER}/ --acl public-read`,
    `  aws s3 cp $osmfile s3://${BUCKET_NAME}/${OSM_FOLDER}/ --acl public-read`,
    '  rm $f',
    'done',
    // s3 sync in the end because it sometimes happens that files are not uploaded
    `aws s3 sync ./data/ s3://${BUCKET_NAME}/${OSM_FOLDER}/ --exclude="*" --include="*.log" --include="*.osm" --acl public-read`,
    'shutdown -h',
  ]

  const params = {
    ImageId: 'ami-02a6bfdcf8224bd77', // Amazon Linux 2 AMI
    InstanceType: 'c5.xlarge', // to get at least 8GB of RAM, otherwise we can't process the large stockholm file
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
          VolumeSize: 20,
          VolumeType: 'gp2',
        },
      },
    ],
    TagSpecifications: [
      {
        ResourceType: 'instance',
        Tags: [{ Key: 'Name', Value: 'Nvdb2osm-run' }],
      },
    ],
  }
  const result = await ec2.runInstances(params).promise()
  console.log(result)
}
