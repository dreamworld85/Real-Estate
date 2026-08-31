import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { getUploadDir } from "../utils/uploadDir.js";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, getUploadDir()),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB, increased to support high-res video uploads
});

export async function optimizeImages(req, res, next) {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  try {
    for (const file of req.files) {
      // Process if it's an image and not a gif
      if (file.mimetype.startsWith("image/") && !file.mimetype.includes("gif")) {
        const originalPath = file.path;
        const dir = path.dirname(originalPath);
        const ext = path.extname(originalPath);
        
        // Generate unique webp filename
        const webpFilename = file.filename.replace(ext, ".webp");
        const webpPath = path.join(dir, webpFilename);

        // Convert to WebP, resize max dimension to 1600px, compress to 80% quality
        await sharp(originalPath)
          .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(webpPath);

        // Clean up the original file if it was not already a webp file
        if (originalPath !== webpPath) {
          try {
            fs.unlinkSync(originalPath);
          } catch (err) {
            console.error("Failed to delete original file after webp conversion:", err);
          }
        }

        // Overwrite multer file metadata in place
        file.path = webpPath;
        file.filename = webpFilename;
        file.mimetype = "image/webp";

        // Update size info to match the optimized WebP size
        const stats = fs.statSync(webpPath);
        file.size = stats.size;
      }
    }
    next();
  } catch (err) {
    console.error("Image optimization error:", err);
    next(); // Fallback: continue request execution even if optimization fails
  }
}

