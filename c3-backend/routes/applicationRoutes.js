import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import resumeUpload from '../middleware/resumeUpload.js';
import {
  createApplication,
  createDraft,
  getDraft,
  updateDraft,
  submitDraft,
  getApplications,
  getApplicationById,
  updateApplicationStatus,
} from '../controllers/applicationController.js';

const router = express.Router();

// Wrap multer so upload errors return clean JSON.
const handleResumeUpload = (req, res, next) => {
  resumeUpload.single('resume')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        message: err.message || 'Resume upload failed',
      });
    }

    next();
  });
};

// PUBLIC - draft application flow.
// These must come before /:id.
router.post('/draft', handleResumeUpload, createDraft);
router.get('/draft/:resumeToken', getDraft);
router.patch('/draft/:resumeToken', handleResumeUpload, updateDraft);
router.post(
  '/draft/:resumeToken/submit',
  handleResumeUpload,
  submitDraft
);

// PUBLIC - one-shot application submission.
router.post('/', handleResumeUpload, createApplication);

// ADMIN ONLY
router.get('/', protect, adminOnly, getApplications);
router.get('/:id', protect, adminOnly, getApplicationById);
router.put('/:id/status', protect, adminOnly, updateApplicationStatus);

export default router;