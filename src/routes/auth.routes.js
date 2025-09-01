const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

const { rootValidation, validateBody, validateFileExistsObjects,validateFileExists } = require('../middlewares/validate');
const fileValidation = require('../middlewares/fileValidation');

const jsonFieldsParser = require('../middlewares/jsonFieldsParser');
const { clientRegisterSchema, loginSchema ,adminRegisterSchema} = require('../schemas/auth.schema');
const { driverRegistrationSchema } = require('../schemas/driver.schema');

const { verifyOtpSchema } = require('../schemas/auth.schema');

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
  validateFileExists('picture'), // check file presence
  validateBody(clientRegisterSchema), // using same schema for now
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

module.exports = router; 