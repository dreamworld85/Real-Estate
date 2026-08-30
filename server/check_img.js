import sharp from "sharp";

async function run() {
  try {
    const metadata = await sharp("src/uploads/1787066448704-378692740.webp").metadata();
    console.log("METADATA FOR PROP 17 IMAGE:", metadata);
  } catch (err) {
    console.error(err);
  }
}

run();
