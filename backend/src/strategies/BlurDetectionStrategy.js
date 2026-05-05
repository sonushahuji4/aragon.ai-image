const ValidationStrategy = require('./ValidationStrategy');
const sharp = require('sharp');

class BlurDetectionStrategy extends ValidationStrategy {
  constructor(threshold = 150) {   // threshold for Laplacian variance
    super();
    this.threshold = threshold;
  }

  async execute(imageBuffer) {
    try {
      // Convert to grayscale and get raw pixel data
      const { data, info } = await sharp(imageBuffer)
        .greyscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const pixels = data;
      const width = info.width;
      const height = info.height;

      // Apply 3x3 Laplacian kernel: [0,1,0,1,-4,1,0,1,0]
      const laplacianVals = [];
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          const val =
            pixels[idx - width - 1] * 0 + pixels[idx - width] * 1 + pixels[idx - width + 1] * 0 +
            pixels[idx - 1] * 1        + pixels[idx] * (-4)       + pixels[idx + 1] * 1 +
            pixels[idx + width - 1] * 0 + pixels[idx + width] * 1 + pixels[idx + width + 1] * 0;
          laplacianVals.push(val);
        }
      }

      // Compute variance of Laplacian
      const mean = laplacianVals.reduce((a, b) => a + b, 0) / laplacianVals.length;
      const variance = laplacianVals.reduce((a, b) => a + (b - mean) ** 2, 0) / laplacianVals.length;

      if (variance < this.threshold) {
        return {
          isValid: false,
          reason: `Image is too blurry (Focus Score: ${Math.round(variance)})`
        };
      }
      return { isValid: true };
    } catch (error) {
      console.error('Blur Detection Error:', error);
      return { isValid: false, reason: "Could not analyze image clarity." };
    }
  }
}

module.exports = BlurDetectionStrategy;