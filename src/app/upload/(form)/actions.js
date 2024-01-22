"use server";
import { revalidatePath } from "next/cache";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";


const s3Client = new S3Client({
  region: process.env.NEXT_AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_AWS_S3_SECRET_ACCESS_KEY,
  },
});


async function uploadFileToS3(file, fileName) {
  const fileBuffer = file

  // console.log("s3Client " + s3Client.credentials.accessKeyId)

  // console.log("Chamou o uploadFileToS3" + file)
  // console.log(fileName)

  const params = {
    Bucket: process.env.NEXT_AWS_S3_BUCKET_NAME,
    Key: `${fileName}`,
    Body: fileBuffer,
    ContentType: "image/jpg",
  };

  console.log("Params " + params.Bucket)
  console.log("Params " + params.Bucket)

  const command = new PutObjectCommand(params);

  const url = await getSignedUrl(s3Client, command, { expiresIn: 360 })// 5 minutes

  console.log("url " + url)

  await fetch(url, {
    method: "PUT",
    body: fileBuffer,
    headers: {
      "Content-Type": file.type,
    },
  });

  // try {
  //   const response = await s3Client.send(command);
  //   console.log("File uploaded successfully:", response);
  //   return fileName;
  // } catch (error) {
  //   throw error;
  // }
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
    return { status: "success", message: "File has been upload." };
  } catch (error) {
    return { status: "error", message: "Failed to upload file." + error };
  }
}
