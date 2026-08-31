import { v2 as cloudinary } from "cloudinary";

/**
 * Cloudinary, for product imagery.
 *
 * Uploads are signed server-side. An unsigned upload preset would let anyone
 * holding the cloud name push files into the account, so the secret never
 * leaves the server and the browser only ever posts to our own route.
 */
export const isCloudinaryConfigured = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

let configured = false;
function client() {
  if (!isCloudinaryConfigured()) throw new Error("Cloudinary is not configured");
  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}

/** Uploads image bytes and returns the delivery URL. */
export function uploadImage(buffer, { folder = "sankamithra/uploads" } = {}) {
  const c = client();
  return new Promise((resolve, reject) => {
    const stream = c.uploader.upload_stream(
      { folder, resource_type: "image", overwrite: false },
      (err, res) => (err ? reject(err) : resolve({ url: res.secure_url, publicId: res.public_id, bytes: res.bytes }))
    );
    stream.end(buffer);
  });
}

/** Removes an image. Best-effort: a failure here must not block a save. */
export async function destroyImage(publicId) {
  try {
    await client().uploader.destroy(publicId);
    return true;
  } catch {
    return false;
  }
}
