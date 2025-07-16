const express = require('express');
const multer = require('multer');
const { 
  getAllDrivers, 
  getDriverById, 
  createDriver,
  updateDriverByDriver,
  updateDriverProfileWithImages,
  updateDriverApproval, 
  getApprovedDrivers, 
  deleteDriver 
} = require('../controllers/driver.controller');

const { authenticate, authorizeAdmin, authorizeDriverOrAdmin } = require('../middlewares/authMiddleware');
const { validateBody, rootValidation } = require('../middlewares/validate');
const fileValidation = require('../middlewares/fileValidation');
const { 
  adminDriverCreationSchema,
  driverProfileUpdateSchema,
  driverProfileWithImagesSchema,
  driverImageUpdateSchema,
  driverApprovalSchema
} = require('../schemas/driver.schema');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Configure fields for different image types
const uploadFields = upload.fields([
  { name: 'profile_image', maxCount: 1 },
  { name: 'license_image', maxCount: 1 },
  { name: 'fayda_image', maxCount: 1 }
]);

const router = express.Router();

// Public route - no authentication required
router.get('/approved', getApprovedDrivers);

// Protected routes - require authentication
router.use(authenticate);

// Admin only routes
router.post('/', 
  authorizeAdmin, 
  uploadFields, 
  fileValidation.validateRequiredDriverImages,
  validateBody(adminDriverCreationSchema), 
  createDriver
);

router.get('/all', authorizeAdmin, getAllDrivers);
router.delete('/:id', authorizeAdmin, deleteDriver);

// Driver only routes (can only update their own profile)
router.put('/:id/profile/driver', 
  validateBody(driverProfileUpdateSchema), 
  updateDriverByDriver
);

// Driver or Admin routes (image-only updates)
router.put('/:id/images', 
  authorizeDriverOrAdmin, 
  uploadFields, 
  fileValidation.validateOptionalDriverImages,
  fileValidation.validateImageOnlyUpdate,
  validateBody(driverImageUpdateSchema), 
  updateDriverProfileWithImages
);

// Driver or Admin routes (profile updates with images - includes vehicle_info and current_status)
router.put('/:id/profile/images', 
  authorizeDriverOrAdmin, 
  uploadFields, 
  fileValidation.validateOptionalDriverImages,
  fileValidation.validateUpdateData,
  validateBody(driverProfileWithImagesSchema), 
  updateDriverProfileWithImages
);

// Admin only routes
router.patch('/:id/approval', 
  upload.any(),
  fileValidation.validateApprovalData,
  updateDriverApproval
);

// Driver or Admin routes
router.get('/:id', authorizeDriverOrAdmin, getDriverById);

module.exports = router;
