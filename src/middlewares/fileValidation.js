const fileValidation = {
  // Validate file types for driver images
  validateDriverImages: (req, res, next) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ 
          error: "No image files uploaded.\n\n" +
                 "Please provide at least one image file:\n" +
                 "• profile_image: Profile picture\n" +
                 "• license_image: License image\n" +
                 "• fayda_image: Fayda image"
        });
      }

      const allowedFields = ['profile_image', 'license_image', 'fayda_image'];
      const uploadedFields = Object.keys(req.files);
      
      // Check if all uploaded fields are valid
      const invalidFields = uploadedFields.filter(field => !allowedFields.includes(field));
      if (invalidFields.length > 0) {
        return res.status(400).json({ 
          error: `Invalid image field names: ${invalidFields.join(', ')}\n\n` +
                 `Allowed image fields:\n` +
                 `• profile_image: Profile picture\n` +
                 `• license_image: License image\n` +
                 `• fayda_image: Fayda image\n\n` +
                 `Please use only these field names for your image uploads.`
        });
      }

      // Validate each uploaded file
      for (const [fieldName, files] of Object.entries(req.files)) {
        if (!Array.isArray(files) || files.length === 0) {
          continue; // Skip empty fields
        }

        const file = files[0]; // Get first file from array
        
        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          return res.status(400).json({ 
            error: `${fieldName} file size exceeds 5MB limit.\n\n` +
                   `Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB\n` +
                   `Maximum allowed: 5MB\n\n` +
                   `Please compress your image or choose a smaller file.`
          });
        }

        // Check file type
        const allowedMimeTypes = [
          'image/jpeg',
          'image/jpg', 
          'image/png',
          'image/webp',
          'image/gif'
        ];
        
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return res.status(400).json({ 
            error: `${fieldName} has invalid file type: ${file.mimetype}\n\n` +
                   `Allowed file types:\n` +
                   `• JPEG/JPG\n` +
                   `• PNG\n` +
                   `• WebP\n` +
                   `• GIF\n\n` +
                   `Please convert your image to one of these formats.`
          });
        }

        // Check file extension
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
        
        if (!allowedExtensions.includes(fileExtension)) {
          return res.status(400).json({ 
            error: `${fieldName} has invalid file extension: ${fileExtension}\n\n` +
                   `Allowed extensions:\n` +
                   `• .jpg or .jpeg\n` +
                   `• .png\n` +
                   `• .webp\n` +
                   `• .gif\n\n` +
                   `Please rename your file with a valid extension.`
          });
        }

        // Validate filename length
        if (file.originalname.length > 100) {
          return res.status(400).json({ 
            error: `${fieldName} filename is too long.\n\n` +
                   `Current length: ${file.originalname.length} characters\n` +
                   `Maximum allowed: 100 characters\n\n` +
                   `Please use a shorter filename.`
          });
        }

        // Check for malicious file names
        const maliciousPatterns = [
          /\.\./, // Directory traversal
          /[<>:"|?*]/, // Invalid characters
          /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Reserved names
        ];

        for (const pattern of maliciousPatterns) {
          if (pattern.test(file.originalname)) {
            return res.status(400).json({ 
              error: `${fieldName} has invalid filename: ${file.originalname}\n\n` +
                     `Filename contains invalid characters or reserved names.\n` +
                     `Please use a different filename without special characters.`
            });
          }
        }
      }

      next();
    } catch (error) {
      console.error('File validation error:', error);
      return res.status(500).json({ 
        error: "Image validation failed. Please try again." 
      });
    }
  },

  // Validate required images for driver registration
  validateRequiredDriverImages: (req, res, next) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ 
          error: "All three images are required for driver registration.\n\n" +
                 "Please provide:\n" +
                 "• profile_image: Profile picture\n" +
                 "• license_image: License image\n" +
                 "• fayda_image: Fayda image\n\n" +
                 "All images must be uploaded to complete registration."
        });
      }

      const requiredImages = ['profile_image', 'license_image', 'fayda_image'];
      const missingImages = [];

      for (const requiredImage of requiredImages) {
        if (!req.files[requiredImage] || req.files[requiredImage].length === 0) {
          missingImages.push(requiredImage);
        }
      }

      if (missingImages.length > 0) {
        return res.status(400).json({ 
          error: `Missing required images: ${missingImages.join(', ')}\n\n` +
                 `For driver registration, you must provide:\n` +
                 `• profile_image: Profile picture\n` +
                 `• license_image: License image\n` +
                 `• fayda_image: Fayda image\n\n` +
                 `Please upload all missing images to continue.`
        });
      }

      // Validate the files
      fileValidation.validateDriverImages(req, res, next);
    } catch (error) {
      console.error('Required images validation error:', error);
      return res.status(500).json({ 
        error: "Image validation failed. Please try again." 
      });
    }
  },

  // Validate optional images for profile updates
  validateOptionalDriverImages: (req, res, next) => {
    try {
      // If no files uploaded, just continue (optional update)
      if (!req.files || Object.keys(req.files).length === 0) {
        return next();
      }

      // Validate the files if any are uploaded
      fileValidation.validateDriverImages(req, res, next);
    } catch (error) {
      console.error('Optional images validation error:', error);
      return res.status(500).json({ 
        error: "Image validation failed. Please try again." 
      });
    }
  },

  // Check if at least one update field is provided
  validateUpdateData: (req, res, next) => {
    try {
      const hasBodyData = req.body && Object.keys(req.body).length > 0;
      const hasFiles = req.files && Object.keys(req.files).length > 0;
      
      if (!hasBodyData && !hasFiles) {
        return res.status(400).json({ 
          error: "No update data provided. Please provide at least one of the following:\n" +
                 "• profile_image: New profile picture\n" +
                 "• license_image: New license image\n" +
                 "• fayda_image: New fayda image"
        });
      }

      next();
    } catch (error) {
      console.error('Update data validation error:', error);
      return res.status(500).json({ 
        error: "Data validation failed. Please try again." 
      });
    }
  },

  // Validate image-only updates (no vehicle_info or current_status allowed)
  validateImageOnlyUpdate: (req, res, next) => {
    try {
      const hasFiles = req.files && Object.keys(req.files).length > 0;
      
      // Check if any non-image fields are provided in body
      if (req.body && Object.keys(req.body).length === 0) {
        return res.status(400).json({ 
          error: "This route only accepts image files. Body data is not allowed.\n\n" +
                 "To update images only, send only image files:\n" +
                 "• profile_image: New profile picture\n" +
                 "• license_image: New license image\n" +
                 "• fayda_image: New fayda image\n\n" +
                 "To update profile data + images, use: PUT /drivers/:id/profile/images"
        });
      }
      
      // Ensure at least one image is provided
      if (!hasFiles) {
        return res.status(400).json({ 
          error: "No images provided for update.\n\n" +
                 "Please send at least one of these image files:\n" +
                 "• profile_image: New profile picture\n" +
                 "• license_image: New license image\n" +
                 "• fayda_image: New fayda image\n\n" +
                 "Only the images you send will be updated. Others will remain unchanged."
        });
      }

      // Validate that only valid image fields are provided
      const allowedFields = ['profile_image', 'license_image', 'fayda_image'];
      const uploadedFields = Object.keys(req.files);
      const invalidFields = uploadedFields.filter(field => !allowedFields.includes(field));
      
      if (invalidFields.length > 0) {
        return res.status(400).json({ 
          error: `Invalid image field names detected: ${invalidFields.join(', ')}\n\n` +
                 `Allowed image fields:\n` +
                 `• profile_image: Profile picture\n` +
                 `• license_image: License image\n` +
                 `• fayda_image: Fayda image\n\n` +
                 `Please use only these field names for your image uploads.`
        });
      }

      next();
    } catch (error) {
      console.error('Image-only update validation error:', error);
      return res.status(500).json({ 
        error: "Image update validation failed. Please try again." 
      });
    }
  },

  // Validate approval form data
  validateApprovalData: (req, res, next) => {
    try {
      // Check if request body exists
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ 
          error: "No approval data provided.\n\n" +
                 "Please provide the approval status:\n" +
                 "• isApproved: true, false, 1, or 0\n\n" +
                 "Example form data:\n" +
                 "• isApproved: true\n" +
                 "• isApproved: false\n" +
                 "• isApproved: 1\n" +
                 "• isApproved: 0"
        });
      }

      // Check if isApproved field is provided
      if (!req.body.isApproved) {
        return res.status(400).json({ 
          error: "Missing required field: isApproved\n\n" +
                 "Please provide the approval status:\n" +
                 "• isApproved: true, false, 1, or 0\n\n" +
                 "Example form data:\n" +
                 "• isApproved: true\n" +
                 "• isApproved: false\n" +
                 "• isApproved: 1\n" +
                 "• isApproved: 0"
        });
      }

      // Check if isApproved has a valid value
      const validValues = ['true', 'false', '1', '0'];
      if (!validValues.includes(req.body.isApproved)) {
        return res.status(400).json({ 
          error: `Invalid approval value: ${req.body.isApproved}\n\n` +
                 `Allowed values:\n` +
                 `• true (approve driver)\n` +
                 `• false (reject driver)\n` +
                 `• 1 (approve driver)\n` +
                 `• 0 (reject driver)\n\n` +
                 `Please use one of these values.`
        });
      }

      next();
    } catch (error) {
      console.error('Approval validation error:', error);
      return res.status(500).json({ 
        error: "Approval validation failed. Please try again." 
      });
    }
  }
};

module.exports = fileValidation; 