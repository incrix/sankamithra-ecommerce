import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

/**
 * Stored documents - currently the price list PDF.
 *
 * These do NOT live in DynamoDB. An item there is capped at 400 KB and the
 * price list is allowed up to 14 MB, so the whole class of data is disqualified
 * rather than merely awkward: it would work on a small file and fail on a real
 * one, which is the worst way for a limit to be found.
 *
 * They lived in MongoDB, whose 16 MB document limit accommodated them. S3 is
 * the like-for-like replacement now the rest of the app is on AWS.
 *
 * Product photographs do not come through here at all - they go to Cloudinary,
 * which is configured and handles its own delivery and resizing.
 */

const REGION = process.env.AWS_REGION || "ap-south-1";
const BUCKET = process.env.S3_MEDIA_BUCKET || "";
/** Everything this app owns lives under one prefix, so the bucket can be shared. */
const PREFIX = process.env.S3_MEDIA_PREFIX || "media/";

export const isMediaConfigured = () =>
  Boolean(BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

function client() {
  if (globalThis.__sankamithraS3) return globalThis.__sankamithraS3;
  globalThis.__sankamithraS3 = new S3Client({
    region: REGION,
    ...(process.env.AWS_ACCESS_KEY_ID
      ? {
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          },
        }
      : {}),
  });
  return globalThis.__sankamithraS3;
}

const keyFor = (name) => `${PREFIX}${name}`;

/** Stores a document under a fixed name, replacing whatever was there. */
export async function putMedia({ name, contentType, bytes }) {
  if (!isMediaConfigured()) throw new Error("S3_MEDIA_BUCKET is not set");
  await client().send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: keyFor(name),
    Body: bytes,
    ContentType: contentType || "application/octet-stream",
    // The price list is meant to be downloaded, not rendered in a tab.
    ...(contentType === "application/pdf" ? { ContentDisposition: "inline" } : {}),
  }));
  return { name, contentType, size: bytes.length, createdAt: new Date().toISOString() };
}

/**
 * Reads a document back.
 *
 * Returns null rather than throwing when it is simply not there - a missing
 * price list is a 404 the caller renders, not a server error.
 */
export async function getMedia(name) {
  if (!isMediaConfigured()) return null;
  try {
    const res = await client().send(new GetObjectCommand({ Bucket: BUCKET, Key: keyFor(name) }));
    return {
      name,
      contentType: res.ContentType,
      size: Number(res.ContentLength) || 0,
      data: Buffer.from(await res.Body.transformToByteArray()),
      createdAt: res.LastModified?.toISOString(),
    };
  } catch (err) {
    if (err?.name === "NoSuchKey" || err?.$metadata?.httpStatusCode === 404) return null;
    throw err;
  }
}

/** Size and type without pulling the bytes down - for the admin's status card. */
export async function statMedia(name) {
  if (!isMediaConfigured()) return null;
  try {
    const res = await client().send(new HeadObjectCommand({ Bucket: BUCKET, Key: keyFor(name) }));
    return {
      name,
      contentType: res.ContentType,
      size: Number(res.ContentLength) || 0,
      createdAt: res.LastModified?.toISOString(),
    };
  } catch (err) {
    if (err?.name === "NotFound" || err?.$metadata?.httpStatusCode === 404) return null;
    throw err;
  }
}
