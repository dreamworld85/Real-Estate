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
    path.join(process.cwd(), "..", "uploads"),
    path.join(process.cwd(), "..", "src", "uploads"),
    path.join(process.cwd(), "public_html", "uploads"),
    "/home/u859202671/domains/api.greensparrows.com/uploads",
    "/home/u859202671/domains/api.greensparrows.com/public_html/uploads",
  ];

  // Scan Hostinger versioned build directories (/home/u859202671/domains/api.greensparrows.com/hbuilds/versions/*/)
  try {
    const hbuildsDir = "/home/u859202671/domains/api.greensparrows.com/hbuilds/versions";
    if (fs.existsSync(hbuildsDir)) {
      const versions = fs.readdirSync(hbuildsDir);
      for (const v of versions) {
        const vPath = path.join(hbuildsDir, v, "nodejs");
        candidates.push(path.join(vPath, "src", "uploads"));
        candidates.push(path.join(vPath, "uploads"));
      }
    }
  } catch (err) {
    // Ignore errors during scan
  }

  const unique = [];
  for (const c of candidates) {
    if (c && !unique.includes(c) && fs.existsSync(c)) {
      unique.push(c);
    }
  }
  return unique;
}

export function migrateHistoricalUploads() {
  const primary = getUploadDir();
  const candidateDirs = getAllCandidateUploadDirs();
  let count = 0;

  for (const dir of candidateDirs) {
    if (dir === primary || !fs.existsSync(dir)) continue;
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const srcFile = path.join(dir, file);
        const destFile = path.join(primary, file);
        if (fs.statSync(srcFile).isFile() && !fs.existsSync(destFile)) {
          fs.copyFileSync(srcFile, destFile);
          console.log(`Auto-migrated historical upload file: ${file} to ${destFile}`);
          count++;
        }
      }
    } catch (err) {
      console.error(`Failed to migrate historical files from ${dir}:`, err);
    }
  }
  return count;
}
