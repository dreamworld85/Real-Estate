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

  const targetDirs = [dir];
  if (process.cwd().includes("api.greensparrows.com") || process.cwd().includes("u859202671")) {
    targetDirs.push("/home/u859202671/domains/api.greensparrows.com/public_html/uploads");
  }

  for (const d of targetDirs) {
    if (d && !fs.existsSync(d)) {
      try {
        fs.mkdirSync(d, { recursive: true });
      } catch (err) {}
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

export function syncFileToAllDestinations(filename, srcPath) {
  const targets = [
    "/home/u859202671/domains/api.greensparrows.com/uploads",
    "/home/u859202671/domains/api.greensparrows.com/public_html/uploads",
    path.resolve("src/uploads"),
    path.resolve("uploads")
  ];

  for (const targetDir of targets) {
    try {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      const dest = path.join(targetDir, filename);
      if (srcPath !== dest && !fs.existsSync(dest)) {
        fs.copyFileSync(srcPath, dest);
      }
    } catch (err) {}
  }
}

export function migrateHistoricalUploads() {
  const primary = getUploadDir();
  const candidateDirs = getAllCandidateUploadDirs();
  const publicHtmlUploads = "/home/u859202671/domains/api.greensparrows.com/public_html/uploads";

  let count = 0;

  for (const dir of candidateDirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const srcFile = path.join(dir, file);
        if (!fs.statSync(srcFile).isFile()) continue;

        // Copy to primary
        const primaryDest = path.join(primary, file);
        if (!fs.existsSync(primaryDest)) {
          fs.copyFileSync(srcFile, primaryDest);
          count++;
        }

        // Copy to public_html/uploads
        if (dir !== publicHtmlUploads) {
          try {
            if (!fs.existsSync(publicHtmlUploads)) fs.mkdirSync(publicHtmlUploads, { recursive: true });
            const htmlDest = path.join(publicHtmlUploads, file);
            if (!fs.existsSync(htmlDest)) {
              fs.copyFileSync(srcFile, htmlDest);
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error(`Failed to migrate historical files from ${dir}:`, err);
    }
  }
  return count;
}
