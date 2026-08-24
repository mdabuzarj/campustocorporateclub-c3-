import mongoose from 'mongoose';

const galleryImageSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },   // Cloudinary secure_url - shown on the homepage
  publicId: { type: String, required: true },   // Cloudinary public_id - needed to delete the actual file later
  caption: { type: String },
  order: { type: Number, default: 0 },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('GalleryImage', galleryImageSchema);