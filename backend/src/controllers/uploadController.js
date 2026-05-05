const { Queue } = require('bullmq');
const ImageRepository = require('../repositories/ImageRepository');
const S3Service = require('../services/S3Service');
const { v4: uuidv4 } = require('uuid');          // add uuid dependency

const imageQueue = new Queue('image-processing-queue');
const imageRepo = new ImageRepository();

exports.uploadImage = async (req, res, next) => {
  try {
    const files = req.files;                      // array of Multer files
    const { userId } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const results = [];

    for (const file of files) {
      // 1. Validate MIME type quickly (magic bytes done later)
      const allowedMime = ['image/jpeg', 'image/png', 'image/heic'];
      if (!allowedMime.includes(file.mimetype)) {
        results.push({
          originalname: file.originalname,
          error: 'Unsupported file type',
          status: 'REJECTED'
        });
        continue;
      }

      // 2. Upload original to S3 temp
      const tempKey = `temp/${uuidv4()}_${file.originalname}`;
      await S3Service.upload(file.buffer, tempKey, file.mimetype);

      // 3. Create PENDING record
      const imageRecord = await imageRepo.create({
        userId,
        tempS3Key: tempKey,
        status: 'PENDING'
      });

      // 4. Enqueue
      await imageQueue.add('process-image', {
        imageId: imageRecord.id,
        userId,
        tempS3Key: tempKey
      });

      results.push({
        imageId: imageRecord.id,
        status: 'PENDING',
        originalname: file.originalname
      });
    }

    return res.status(202).json({ images: results });
  } catch (error) {
    next(error);
  }
};

exports.getImageStatus = async (req, res, next) => {
  try {
    const image = await imageRepo.findById(req.params.id);
    if (!image) return res.status(404).json({ error: 'Image not found' });
    return res.json({
      id: image.id,
      status: image.status,
      rejectionReason: image.rejectionReason
    });
  } catch (error) {
    next(error);
  }
};

exports.getImageFile = async (req, res, next) => {
  try {
    const image = await imageRepo.findById(req.params.id);
    if (!image) return res.status(404).json({ error: 'Image not found' });
    if (image.status !== 'ACCEPTED') return res.status(400).json({ error: 'Image not yet accepted' });

    const presignedUrl = await S3Service.getSignedUrl(image.finalS3Key);
    return res.json({ url: presignedUrl });
  } catch (error) {
    next(error);
  }
};

exports.getUserImages = async (req, res, next) => {
  try {
    const images = await imageRepo.findByUserId(req.params.userId);
    return res.json(images);
  } catch (error) {
    next(error);
  }
};