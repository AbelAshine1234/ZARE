const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateBody, rootValidation, validateFileExists } = require('../middlewares/validate');

const { clientRegisterSchema, loginSchema ,adminRegisterSchema} = require('../schemas/auth.schema');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// 👇 This now parses multipart/form-data properly

router.post(
  '/register-client',
  upload.any(),                   // accepts any files in req.files[]
  rootValidation,
  validateFileExists('picture'), // check file presence
  validateBody(clientRegisterSchema),
  authController.registerAsClient
);
router.post(
  '/register-admin',
  upload.any(),                   
  rootValidation,
  validateBody(adminRegisterSchema),
  authController.registerAsAdmin
);
// Login usually uses JSON, no need for multer
router.post('/login', validateBody(loginSchema), authController.login);

module.exports = router;
