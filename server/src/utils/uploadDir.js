import path from "path";
import fs from "fs";

export function getUploadDir() {
  let dir = process.env.UPLOADS_DIR;
  if (!dir) {
    if (process.cwd().includes("api.greensparrows.com") || process.cwd().includes("u859202671")) {
      dir = "/home/u859202671/domains/api.greensparrows.com/uploads";
    } else {
      dir = path.resolve("src/uploads");
    }
  } else {
    dir = path.resolve(dir);
  }

  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (err) {
      console.error(`Failed to create upload dir (${dir}), falling back to src/uploads:`, err);
      dir = path.resolve("src/uploads");
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }
  return dir;
}

export function getAllCandidateUploadDirs() {
  const primary = getUploadDir();
  const candidates = [
    primary,
    path.resolve("src/uploads"),
    path.resolve("uploads"),
    path.join(process.cwd(), "uploads"),
    path.join(process.cwd(), "src", "uploads"),
    path.join(process.cwd(), "public_html", "uploads"),
    "/home/u859202671/domains/api.greensparrows.com/uploads",
    "/home/u859202671/domains/api.greensparrows.com/public_html/uploads",
  ];

  const unique = [];
  for (const c of candidates) {
    if (c && !unique.includes(c) && fs.existsSync(c)) {
      unique.push(c);
    }
  }
  return unique;
}
