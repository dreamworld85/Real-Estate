import fs from "fs/promises";
import path from "path";
import { getAllCandidateUploadDirs } from "./uploadDir.js";

export async function deleteUploadedFile(urlPath) {
  if (!urlPath || typeof urlPath !== "string" || !urlPath.startsWith("/uploads/")) {
    return;
  }
  const filename = urlPath.substring("/uploads/".length);
  const dirs = getAllCandidateUploadDirs();

  for (const dir of dirs) {
    const p = path.join(dir, filename);
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
