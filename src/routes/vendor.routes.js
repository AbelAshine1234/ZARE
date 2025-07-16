const express = require('express');
const router = express.Router();
const multer = require('multer');
const { rootValidation, validateBody, validateFileExistsObjects } = require('../middlewares/validate');
const { vendorSchema } = require('../schemas/vendor.schema');
const vendorController = require('../controllers/vendor.controller');
const { authenticate } = require('../middlewares/authMiddleware');
const jsonFieldsParser = require('../middlewares/jsonFieldsParser'); // import it

router.use(authenticate);
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  '/individual',
  upload.fields([
    { name: 'cover_image', maxCount: 1 },
    { name: 'fayda_image', maxCount: 1 },
  ]),
  rootValidation,
  validateFileExistsObjects('cover_image'),
  validateFileExistsObjects('fayda_image'),

  jsonFieldsParser(['category_ids', 'keepImages','payment_method']), 

  validateBody(vendorSchema),
  vendorController.createIndividualVendor
);

router.post(
  '/business',
  upload.fields([
    { name: 'cover_image', maxCount: 1 },
    { name: 'business_license_image', maxCount: 1 },
  ]),
  rootValidation,
  validateFileExistsObjects('cover_image'),
  validateFileExistsObjects('business_license_image'),

  jsonFieldsParser(['category_ids', 'keepImages','payment_method']), 

  validateBody(vendorSchema),
  vendorController.createBusinessVendor
);

router.get('/',
  vendorController.getAllVendors
);

module.exports = router;
