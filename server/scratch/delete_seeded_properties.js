import fs from "fs";
import path from "path";
import { pool } from "../src/db.js";

async function deletePropertiesAndMedia() {
  console.log("Fetching media records from database...");
  const [mediaRows] = await pool.query("SELECT url FROM property_media");
  
  console.log(`Found ${mediaRows.length} media records in database.`);
  
  const uploadDirs = [
    path.resolve("src", "uploads"),
    path.resolve("uploads")
  ];
  
  let deletedFilesCount = 0;
  
  for (const row of mediaRows) {
    if (!row.url) continue;
    
    // Extrapolate filename from URL (e.g. /uploads/filename.jpg -> filename.jpg)
    const filename = path.basename(row.url);
    
    for (const dir of uploadDirs) {
      const filePath = path.join(dir, filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted file: ${filePath}`);
          deletedFilesCount++;
        } catch (err) {
          console.error(`Failed to delete file ${filePath}:`, err.message);
        }
      }
    }
  }
  
  console.log(`\nDeleted ${deletedFilesCount} files from disk.`);
  
  console.log("\nDeleting all property records from database...");
  const [deleteResult] = await pool.query("DELETE FROM properties");
  console.log(`Deleted ${deleteResult.affectedRows} properties from properties table.`);
  
  // Double check that property_media is also empty
  const [remainingMedia] = await pool.query("SELECT COUNT(*) as count FROM property_media");
  console.log(`Remaining property_media records: ${remainingMedia[0].count}`);

  const [remainingProperties] = await pool.query("SELECT COUNT(*) as count FROM properties");
  console.log(`Remaining properties records: ${remainingProperties[0].count}`);
  
  console.log("\nDeletion process completed successfully!");
  process.exit(0);
}

deletePropertiesAndMedia().catch((err) => {
  console.error("Deletion failed:", err);
  process.exit(1);
});
