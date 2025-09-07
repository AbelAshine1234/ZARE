const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/authMiddleware');

const { rootValidation, validateBody, validateFileExistsObjects,validateFileExists } = require('../middlewares/validate');
const fileValidation = require('../middlewares/fileValidation');

const jsonFieldsParser = require('../middlewares/jsonFieldsParser');
const { resetPasswordSchema, clientRegisterSchema,vendorRegisterSchema, forgotPasswordSchema,loginSchema ,adminRegisterSchema} = require('../schemas/auth.schema');
const { driverRegistrationSchema } = require('../schemas/driver.schema');

const { verifyOtpSchema, resendOtpSchema } = require('../schemas/auth.schema');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

 

router.post(
  '/register-client',
  upload.any(),                   // accepts any files in req.files[]
  rootValidation,
  validateFileExists('picture'), // check file presence
  validateBody(clientRegisterSchema),
  authController.registerAsClient
);

router.post(
  '/register-vendor-owner',
  upload.any(),                   // accepts any files in req.files[]
  rootValidation,
  validateBody(vendorRegisterSchema), // added new schema
  authController.registerVendorOwner
);

router.post(
  '/register-admin',
  upload.any(),                   
  rootValidation,
  validateBody(adminRegisterSchema),
  authController.registerAsAdmin
);

router.post(
  '/register-employee',
  upload.any(),                   // accepts any files in req.files[]
  rootValidation,
  validateFileExists('picture'), // check file presence
  validateBody(clientRegisterSchema), // using same schema for now
  authController.registerAsEmployee
);

router.post(
  '/register-driver',
  upload.fields([
    { name: 'profile_image', maxCount: 1 },
    { name: 'license_image', maxCount: 1 },
    { name: 'fayda_image', maxCount: 1 },
  ]),
  rootValidation,
  fileValidation.validateRequiredDriverImages,
  validateBody(driverRegistrationSchema),
  authController.registerAsDriver
);

// Login usually uses JSON, no need for multer
router.post('/login', validateBody(loginSchema), authController.login);

// Verify OTP
router.post('/verify-otp', validateBody(verifyOtpSchema), authController.verifyOtp);

// Resend OTP
router.post('/resend-otp', validateBody(resendOtpSchema), authController.resendOtp);

// Forgot password
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyResetOtp);
router.post('/reset-password', authController.resetPassword);

// Get user profile (requires authentication)
router.get('/profile', authenticate, authController.getUserProfile);

module.exports = router; 