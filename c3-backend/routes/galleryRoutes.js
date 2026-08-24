import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';
import {
  uploadGalleryImages,
  getGalleryImages,
  deleteGalleryImage,
} from '../controllers/galleryController.js';

const router = express.Router();

const galleryUpload = upload.fields([{ name: 'images', maxCount: 12 }]);

router.post('/', protect, adminOnly, galleryUpload, uploadGalleryImages);
router.get('/', protect, adminOnly, getGalleryImages);
router.delete('/:id', protect, adminOnly, deleteGalleryImage);

export default router;