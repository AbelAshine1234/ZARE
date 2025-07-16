const { uploadImageToCloudinary, uploadVideoToCloudinary } = require('../utils/cloudinary');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Process image upload jobs
const processImageUpload = async (job) => {
  try {
    const { fileBuffer, fileName, productId, fieldName, imageRecordId } = job.data;
    
    console.log(`🔄 Processing image upload for product ${productId}: ${fileName}`);
    
    // Convert base64 string back to Buffer
    const buffer = Buffer.from(fileBuffer, 'base64');
    
    // Upload to Cloudinary
    const imageUrl = await uploadImageToCloudinary(
      buffer, 
      `zare_uploads/products/${fileName}`
    );
    
    // Update existing record instead of creating new one
    const imageRecord = await prisma.image.update({
      where: { id: imageRecordId },
      data: {
        image_url: imageUrl
      }
    });
    
    console.log(`✅ Image uploaded successfully: ${imageUrl}`);
    
    return {
      success: true,
      imageUrl,
      imageRecord,
      message: `Image ${fileName} uploaded successfully`
    };
    
  } catch (error) {
    console.error(`❌ Image upload failed for ${job.data.fileName}:`, error);
    
    // Update record status to failed
    try {
      await prisma.image.update({
        where: { id: job.data.imageRecordId },
        data: {
          // No fields to update for failed status
        }
      });
    } catch (updateError) {
      console.error('Failed to update image record status:', updateError);
    }
    
    throw error;
  }
};

// Process video upload jobs
const processVideoUpload = async (job) => {
  try {
    const { fileBuffer, fileName, productId, fieldName, videoRecordId } = job.data;
    
    console.log(`🔄 Processing video upload for product ${productId}: ${fileName}`);
    
    // Convert base64 string back to Buffer
    const buffer = Buffer.from(fileBuffer, 'base64');
    
    // Upload to Cloudinary
    const videoUrl = await uploadVideoToCloudinary(
      buffer, 
      `zare_api/products/videos/${fileName}`
    );
    
    // Update existing record instead of creating new one
    const videoRecord = await prisma.video.update({
      where: { id: videoRecordId },
      data: {
        video_url: videoUrl
      }
    });
    
    console.log(`✅ Video uploaded successfully: ${videoUrl}`);
    
    return {
      success: true,
      videoUrl,
      videoRecord,
      message: `Video ${fileName} uploaded successfully`
    };
    
  } catch (error) {
    console.error(`❌ Video upload failed for ${job.data.fileName}:`, error);
    
    // Update record status to failed
    try {
      await prisma.video.update({
        where: { id: job.data.videoRecordId },
        data: {
          // No fields to update for failed status
        }
      });
    } catch (updateError) {
      console.error('Failed to update video record status:', updateError);
    }
    
    throw error;
  }
};

// Process bulk image uploads
const processBulkImageUpload = async (job) => {
  try {
    const { files, productId, fieldName } = job.data;
    
    console.log(`🔄 Processing bulk image upload for product ${productId}: ${files.length} files`);
    
    const results = [];
    
    for (const file of files) {
      try {
        // Convert base64 string back to Buffer
        const buffer = Buffer.from(file.fileBuffer, 'base64');
        
        const imageUrl = await uploadImageToCloudinary(
          buffer, 
          `zare_uploads/products/${file.originalname}`
        );
        
        const imageRecord = await prisma.productImage.create({
          data: {
            image_url: imageUrl,
            product_id: productId,
            field_name: fieldName || 'images'
          }
        });
        
        results.push({
          success: true,
          fileName: file.originalname,
          imageUrl,
          imageRecord
        });
        
      } catch (fileError) {
        console.error(`❌ Failed to upload image ${file.originalname}:`, fileError);
        results.push({
          success: false,
          fileName: file.originalname,
          error: fileError.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Bulk image upload completed: ${successCount}/${files.length} successful`);
    
    return {
      success: true,
      results,
      successCount,
      totalCount: files.length,
      message: `Bulk image upload completed: ${successCount}/${files.length} successful`
    };
    
  } catch (error) {
    console.error(`❌ Bulk image upload failed:`, error);
    throw error;
  }
};

// Process bulk video uploads
const processBulkVideoUpload = async (job) => {
  try {
    const { files, productId, fieldName } = job.data;
    
    console.log(`🔄 Processing bulk video upload for product ${productId}: ${files.length} files`);
    
    const results = [];
    
    for (const file of files) {
      try {
        // Convert base64 string back to Buffer
        const buffer = Buffer.from(file.fileBuffer, 'base64');
        
        const videoUrl = await uploadVideoToCloudinary(
          buffer, 
          `zare_uploads/products/videos/${file.originalname}`
        );
        
        const videoRecord = await prisma.productVideo.create({
          data: {
            video_url: videoUrl,
            product_id: productId,
            field_name: fieldName || 'videos'
          }
        });
        
        results.push({
          success: true,
          fileName: file.originalname,
          videoUrl,
          videoRecord
        });
        
      } catch (fileError) {
        console.error(`❌ Failed to upload video ${file.originalname}:`, fileError);
        results.push({
          success: false,
          fileName: file.originalname,
          error: fileError.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Bulk video upload completed: ${successCount}/${files.length} successful`);
    
    return {
      success: true,
      results,
      successCount,
      totalCount: files.length,
      message: `Bulk video upload completed: ${successCount}/${files.length} successful`
    };
    
  } catch (error) {
    console.error(`❌ Bulk video upload failed:`, error);
    throw error;
  }
};

module.exports = {
  processImageUpload,
  processVideoUpload,
  processBulkImageUpload,
  processBulkVideoUpload,
}; 