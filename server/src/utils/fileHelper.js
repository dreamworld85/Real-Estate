import fs from "fs/promises";
import syncFs from "fs";
import path from "path";

export function getUploadsDir() {
  if (process.env.UPLOADS_DIR) {
    return path.resolve(process.env.UPLOADS_DIR);
  }
  const cwd = process.cwd();
  if (cwd.includes("api.greensparrows.com") || cwd.includes("u859202671")) {
    return path.resolve("/home/u859202671/domains/api.greensparrows.com/uploads");
  }
  return path.resolve("src/uploads");
}

export function getAllUploadsDirs() {
  const primary = getUploadsDir();
  const candidates = [
    primary,
    "/home/u859202671/domains/api.greensparrows.com/uploads",
    path.resolve("src/uploads"),
    path.resolve("uploads"),
    path.resolve("server/src/uploads"),
    path.resolve("server/uploads"),
  ];
  
  const existingOrValid = candidates.map(c => path.resolve(c));
  return Array.from(new Set(existingOrValid));
}

export async function deleteUploadedFile(urlPath) {
  if (!urlPath || typeof urlPath !== "string" || !urlPath.includes("/uploads/")) {
    return;
  }
  const filename = path.basename(urlPath);
  const dirs = getAllUploadsDirs();

  for (const dir of dirs) {
    const p = path.join(dir, filename);
    try {
      await fs.access(p);
      await fs.unlink(p);
      console.log(`Successfully deleted file: ${p}`);
    } catch (err) {
      // ignore if doesn't exist
    }
  }
}
