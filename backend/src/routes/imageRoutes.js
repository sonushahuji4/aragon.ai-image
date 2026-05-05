const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// POST – up to 10 images (field name "images")
router.post('/upload', upload.array('images', 10), uploadController.uploadImage);

// GET – status of a single image
router.get('/:id/status', uploadController.getImageStatus);

// GET – presigned URL for processed image
router.get('/:id/file', uploadController.getImageFile);

// GET – all user images
router.get('/user/:userId', uploadController.getUserImages);

module.exports = router;