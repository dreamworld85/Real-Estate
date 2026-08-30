import sharp from "sharp";

async function run() {
  try {
    const image = sharp("src/uploads/1787066448704-378692740.webp");
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    
    const channels = info.channels;
    const width = info.width;
    
    console.log("Image size:", width, "x", info.height, "channels:", channels);
    
    // Sample pixels at row 300, column 5 (left edge)
    const leftIndex = (300 * width + 5) * channels;
    const leftPixel = data.slice(leftIndex, leftIndex + channels);
    console.log("Left pixel at (5, 300):", leftPixel);
    
    // Sample pixels at row 300, column 795 (right edge)
    const rightIndex = (300 * width + 795) * channels;
    const rightPixel = data.slice(rightIndex, rightIndex + channels);
    console.log("Right pixel at (795, 300):", rightPixel);
    
    // Sample pixels at row 300, column 400 (center)
    const centerIndex = (300 * width + 400) * channels;
    const centerPixel = data.slice(centerIndex, centerIndex + channels);
    console.log("Center pixel at (400, 300):", centerPixel);
    
  } catch (err) {
    console.error(err);
  }
}

run();
