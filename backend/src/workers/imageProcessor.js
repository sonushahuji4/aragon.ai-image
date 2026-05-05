const { Worker } = require('bullmq');
const S3Service = require('../services/S3Service');
const ImageRepository = require('../repositories/ImageRepository');
const ImageValidator = require('../services/ImageValidator');
const FaceDetectionStrategy = require('../strategies/FaceDetectionStrategy');
const BlurDetectionStrategy = require('../strategies/BlurDetectionStrategy');
const SimilarityStrategy = require('../strategies/SimilarityStrategy');
const sharp = require('sharp');
const socketService = require('../services/SocketService');   // to notify

const worker = new Worker('image-processing-queue', async job => {
  const { imageId, userId, tempS3Key } = job.data;
  const imageRepo = new ImageRepository();

  try {
    // 1. Fetch raw file from S3
    let imageBuffer = await S3Service.download(tempS3Key);

    // 2. Convert HEIC if needed
    const metadata = await sharp(imageBuffer).metadata();
    if (metadata.format === 'heif' || metadata.format === 'heic') {
      const heicDecode = require('heic-decode');
      const { data, width, height } = await heicDecode({ buffer: imageBuffer });
      imageBuffer = await sharp(data, { raw: { width, height, channels: 4 } })
        .jpeg({ quality: 90 })
        .toBuffer();
    }

    // 3. Build validation chain (order: blur → face → similarity)
    const validator = new ImageValidator();
    validator.addStrategy(new BlurDetectionStrategy(100));   // adjust threshold
    validator.addStrategy(new FaceDetectionStrategy());
    // Similarity needs userId; also it will return pHash if valid
    validator.addStrategy(new SimilarityStrategy(userId));

    const validationResult = await validator.validateAll(imageBuffer);

    if (!validationResult.isValid) {
      // REJECTED flow
      await imageRepo.updateStatus(imageId, 'REJECTED', validationResult.reason);
      await S3Service.delete(tempS3Key);
      // Notify frontend
      socketService.notifyUser(userId, 'imageStatus', {
        imageId,
        status: 'REJECTED',
        reason: validationResult.reason
      });
      return;
    }

    // 4. Accepted flow: generate final image (resize & compress)
    const finalBuffer = await sharp(imageBuffer).resize(1024).jpeg({ quality: 85 }).toBuffer();
    const finalKey = `processed/${userId}/${imageId}.jpg`;
    await S3Service.upload(finalBuffer, finalKey);

    // 5. Extract pHash from similarity strategy result (passed via validationResult)
    const pHash = validationResult.metadata?.pHash;
    if (!pHash) throw new Error('pHash missing from similarity result');

    await imageRepo.markAsAccepted(imageId, finalKey, pHash);
    await S3Service.delete(tempS3Key);

    // Notify success
    socketService.notifyUser(userId, 'imageStatus', {
      imageId,
      status: 'ACCEPTED'
    });

  } catch (error) {
    console.error(`Processing failed for image ${imageId}:`, error);
    await imageRepo.updateStatus(imageId, 'REJECTED', 'System processing error.');
    socketService.notifyUser(userId, 'imageStatus', {
      imageId,
      status: 'REJECTED',
      reason: 'System error'
    });
    throw error;
  }
}, { connection: { host: '127.0.0.1', port: 6379 } });