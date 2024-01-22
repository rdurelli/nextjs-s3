/** @type {import('next').NextConfig} */
module.exports = {
  output: "standalone",
  env: {
    NEXT_AWS_S3_REGION: process.env.NEXT_AWS_S3_REGION,
    NEXT_AWS_S3_ACCESS_KEY_ID: process.env.NEXT_AWS_S3_ACCESS_KEY_ID,
    NEXT_AWS_S3_SECRET_ACCESS_KEY: process.env.NEXT_AWS_S3_SECRET_ACCESS_KEY,
    NEXT_AWS_S3_BUCKET_NAME: process.env.NEXT_AWS_S3_BUCKET_NAME,
  }
};