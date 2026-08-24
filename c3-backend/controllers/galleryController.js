import GalleryImage from '../models/GalleryImage.js';
import cloudinary from '../config/cloudinary.js';

// POST /api/gallery - admin only. Accepts up to 12 images (field name: "images").
export const uploadGalleryImages = async (req, res) => {
  try {
    if (!req.files || !req.files.images || req.files.images.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    const docs = req.files.images.map(file => ({
      imageUrl: file.path,       // Cloudinary secure_url
      publicId: file.filename,   // Cloudinary public_id
      uploadedBy: req.user._id,
    }));

    const created = await GalleryImage.insertMany(docs);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/gallery - admin only, full list for the admin manager page
export const getGalleryImages = async (req, res) => {
  try {
    const images = await GalleryImage.find().sort({ order: 1, createdAt: -1 });
    res.json(images);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/gallery/:id - admin only. Removes from Cloudinary AND MongoDB.
export const deleteGalleryImage = async (req, res) => {
  try {
    const image = await GalleryImage.findById(req.params.id);
    if (!image) return res.status(404).json({ message: 'Image not found' });

    await cloudinary.uploader.destroy(image.publicId);
    await image.deleteOne();

    res.json({ message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/public/gallery - no auth required, used by the homepage Masonry grid
export const getPublicGalleryImages = async (req, res) => {
  try {
    const images = await GalleryImage.find()
      .sort({ order: 1, createdAt: -1 })
      .select('imageUrl');

    console.log('[DIAG public gallery] found', images.length, 'images:', JSON.stringify(images));

    res.json(images.map(img => img.imageUrl));
  } catch (err) {
    console.log('[DIAG public gallery ERROR]', err.message);
    res.status(500).json({ message: err.message });
  }
};