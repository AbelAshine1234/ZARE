require('dotenv').config();

const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image buffer to Cloudinary
 * @param {Buffer} fileBuffer
 * @param {string} filename
 * @returns {Promise<string>} secure_url
 */
async function uploadImageToCloudinary(fileBuffer, filename = 'upload') {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: filename,
        folder: 'zare_uploads',
        resource_type: 'image', // Explicitly image
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
}

/**
 * Upload video buffer to Cloudinary with optimized settings
 * @param {Buffer} fileBuffer
 * @param {string} filename
 * @returns {Promise<string>} secure_url
 */
async function uploadVideoToCloudinary(fileBuffer, filename = 'upload') {
  return new Promise((resolve, reject) => {
    // Set a timeout for the upload
    const timeout = setTimeout(() => {
      reject(new Error('Video upload timeout - upload took too long'));
    }, 300000); // 5 minutes timeout

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: filename,
        folder: 'zare_uploads',
        resource_type: 'video',
        chunk_size: 6000000, // 6MB chunks for better upload performance
        eager: [
          { width: 300, height: 300, crop: "pad", audio_codec: "none" },
          { width: 160, height: 100, crop: "crop", gravity: "south", audio_codec: "none" }
        ],
        eager_async: true,
        eager_notification_url: null,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        invalidate: true,
      },
      (error, result) => {
        clearTimeout(timeout);
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
}

module.exports = {
  uploadImageToCloudinary,
  uploadVideoToCloudinary,
};
