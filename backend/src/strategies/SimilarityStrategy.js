const ValidationStrategy = require('./ValidationStrategy');
const sharp = require('sharp');
const { ImageRepository } = require('../repositories/ImageRepository'); // require correctly

// Simple Average Hash (16x16 block) using sharp
async function generateAverageHash(imageBuffer) {
  const { data } = await sharp(imageBuffer)
    .greyscale()
    .resize(16, 16, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const avg = data.reduce((a, b) => a + b, 0) / data.length;
  return data.map(pixel => (pixel >= avg ? 1 : 0)).join('');
}

function hammingDistance(hash1, hash2) {
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) distance++;
  }
  return distance;
}

class SimilarityStrategy extends ValidationStrategy {
  constructor(userId) {   // we need userId to fetch existing images
    super();
    this.userId = userId;
    this.threshold = 10;   // max Hamming distance (very similar)
  }

  async execute(imageBuffer) {
    const newHash = await generateAverageHash(imageBuffer);
    const repo = new ImageRepository();
    const existingImages = await repo.findByUserId(this.userId);

    for (const img of existingImages) {
      if (img.pHash && img.status === 'ACCEPTED') {
        const dist = hammingDistance(newHash, img.pHash);
        if (dist < this.threshold) {
          return { isValid: false, reason: "Image is too similar to an already accepted photo." };
        }
      }
    }
    // Important: return the new hash so it can be stored after acceptance
    return { isValid: true, metadata: { pHash: newHash } };
  }
}

module.exports = SimilarityStrategy;