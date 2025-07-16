const { imageUploadQueue, videoUploadQueue } = require('../config/queue.config');
const {
  processImageUpload,
  processVideoUpload,
  processBulkImageUpload,
  processBulkVideoUpload,
} = require('../jobs/upload.jobs');

// Process image upload jobs
imageUploadQueue.process('single-image', processImageUpload);
imageUploadQueue.process('bulk-images', processBulkImageUpload);

// Process video upload jobs
videoUploadQueue.process('single-video', processVideoUpload);
videoUploadQueue.process('bulk-videos', processBulkVideoUpload);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 Shutting down queue workers...');
  
  await imageUploadQueue.close();
  await videoUploadQueue.close();
  
  console.log('✅ Queue workers shut down successfully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 Shutting down queue workers...');
  
  await imageUploadQueue.close();
  await videoUploadQueue.close();
  
  console.log('✅ Queue workers shut down successfully');
  process.exit(0);
});

console.log('🚀 Queue workers started successfully');
console.log('📸 Image upload queue worker ready');
console.log('🎥 Video upload queue worker ready'); 