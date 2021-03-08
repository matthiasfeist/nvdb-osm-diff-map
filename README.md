# NVDB OSM diff map

This project utilizes the data provided by [Sweden's National Road Database](https://www.nvdb.se/sv/about-nvdb/) together with the Open Source project [Nvdb2osm](https://github.com/atorger/nvdb2osm/) to provide assistance to OSM contributors in Sweden.
This contribution is in the form of

1. OSM files that represent the status of the National Road Database (as produced by nvdb2osm) without the need to run the script locally
2. a map that shows the differences of the National Road Database and Openstreetmap data so that mappers can direct their efforts towards the areas that differ the most. (Not done yet)

## How to use this project

`<text needed here!>`

## How to deploy the NVDB OSM Diff Map yourself

1. Clone the repo. You'll also need at least Node 14
2. Run `npm install`
3. Go into the file _serverless.yml_ and chose a different name for the S3 bucket (key `dataBucketName` as the one in the fils is already in use by the live project)
4. run `npx serverless deploy` and follow the instructions.
