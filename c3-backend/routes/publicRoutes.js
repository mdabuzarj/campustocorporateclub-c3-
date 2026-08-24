import express from 'express';
import { getPublicEvents, getPublicEventBySlug } from '../controllers/publicController.js';
import { getPublicGalleryImages } from '../controllers/galleryController.js';


const router = express.Router();

router.get('/events', getPublicEvents);
router.get('/events/:slug', getPublicEventBySlug);
router.get('/gallery', getPublicGalleryImages);


export default router;