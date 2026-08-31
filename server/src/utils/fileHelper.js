import fs from "fs/promises";
import path from "path";

export async function deleteUploadedFile(urlPath) {
  if (!urlPath || typeof urlPath !== "string" || !urlPath.startsWith("/uploads/")) {
    return;
  }
  const filename = urlPath.substring("/uploads/".length);

  const uploadsDir = process.env.UPLOADS_DIR 
    ? path.resolve(process.env.UPLOADS_DIR) 
    : path.resolve("src/uploads");

  const paths = [
    path.join(uploadsDir, filename),
    path.join(path.resolve("src/uploads"), filename),
    path.join(path.resolve("uploads"), filename)
  ];

  for (const p of paths) {
    try {
      // Check if file exists first
      await fs.access(p);
      await fs.unlink(p);
      console.log(`Successfully deleted file: ${p}`);
    } catch (err) {
      // ignore if doesn't exist
    }
  }
}
