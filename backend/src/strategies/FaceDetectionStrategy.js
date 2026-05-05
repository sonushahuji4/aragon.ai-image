const ValidationStrategy = require('./ValidationStrategy');
const faceapi = require('@vladmandic/face-api');
const canvas = require('canvas');

// Patch node-canvas for face-api
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let modelsLoaded = false;

async function loadModels() {
  if (modelsLoaded) return;
  // Adjust path to where you place face-api models (download from repo)
  await faceapi.nets.tinyFaceDetector.loadFromDisk('./models/tiny_face_detector');
  modelsLoaded = true;
}

class FaceDetectionStrategy extends ValidationStrategy {
  async execute(imageBuffer) {
    await loadModels();
    const img = await canvas.loadImage(imageBuffer);

    // Use fast tiny face detector
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 });
    const detections = await faceapi.detectAllFaces(img, options);

    if (detections.length === 0) {
      return { isValid: false, reason: "No face detected." };
    }
    if (detections.length > 1) {
      return { isValid: false, reason: "Multiple faces detected." };
    }

    const faceBox = detections[0].box;
    const faceArea = faceBox.width * faceBox.height;
    const imgArea = img.width * img.height;
    if ((faceArea / imgArea) < 0.1) {
      return { isValid: false, reason: "Face is too small or too far away." };
    }

    return { isValid: true };
  }
}

module.exports = FaceDetectionStrategy;