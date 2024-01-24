"use server";
import { revalidatePath } from "next/cache";
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.NEXT_AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_AWS_S3_SECRET_ACCESS_KEY,
  },
});

async function initiateMultipartUpload(fileName) {
  const params = {
    Bucket: process.env.NEXT_AWS_S3_BUCKET_NAME,
    Key: fileName,
    ContentType: "image/jpg",
  };

  const createMultipartUploadCommand = new CreateMultipartUploadCommand(params);

  const { UploadId } = await s3Client.send(createMultipartUploadCommand);

  return UploadId;
}

async function uploadPart(uploadId, partNumber, fileBuffer, fileName) {
  const params = {
    Bucket: process.env.NEXT_AWS_S3_BUCKET_NAME,
    Key: fileName,
    PartNumber: partNumber,
    UploadId: uploadId,
    Body: fileBuffer,
  };

  const uploadPartCommand = new UploadPartCommand(params);

  const { ETag } = await s3Client.send(uploadPartCommand);

  return { PartNumber: partNumber, ETag };
}

async function completeMultipartUpload(uploadId, fileName, parts) {
  const params = {
    Bucket: process.env.NEXT_AWS_S3_BUCKET_NAME,
    Key: fileName,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts },
  };

  const completeMultipartUploadCommand = new CompleteMultipartUploadCommand(params);

  await s3Client.send(completeMultipartUploadCommand);
}

async function uploadFileToS3(file, fileName) {
  const fileBuffer = file;

  const uploadId = await initiateMultipartUpload(fileName);
  const partSize = 5 * 1024 * 1024;

  const fileParts = [];
  let start = 0;
  let partNumber = 1;

  while (start < fileBuffer.length) {
    const end = Math.min(start + partSize, fileBuffer.length);
    const partBuffer = fileBuffer.slice(start, end);

    console.log(`Uploading part ${partNumber}/${Math.ceil(fileBuffer.length / partSize)}`);

    const { ETag } = await uploadPart(uploadId, partNumber, partBuffer, fileName);
    fileParts.push({ PartNumber: partNumber, ETag });

    start = end;
    partNumber += 1;
  }

  await completeMultipartUpload(uploadId, fileName, fileParts);
}

export async function uploadFile(prevState, formData) {
  try {
    const file = formData.get("file");

    if (file.size === 0) {
      return { status: "error", message: "Please select a file." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadFileToS3(buffer, file.name);

    revalidatePath("/");
    return { status: "success", message: "File has been uploaded." };
  } catch (error) {
    return { status: "error", message: "Failed to upload file." + error };
  }
}
