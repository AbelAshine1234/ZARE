const express = require('express');
const router = express.Router();
const multer = require('multer');

const { rootValidation, validateBody, validateFileExists } = require('../middlewares/validate');
const { subcategorySchema } = require('../schemas/subcategory.schema');
const subcategoryController = require('../controllers/subcategory.controller');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate, authorizeAdmin);

router.post(
  '/',
  upload.array('subcategory_pictures'),       // multer field name for images
  rootValidation,
  validateFileExists('subcategory_pictures'), // must match multer field name
  validateBody(subcategorySchema),
  subcategoryController.createSubcategory
);

router.get('/', subcategoryController.getAllSubcategories);

router.get('/:id', subcategoryController.getSubcategoryById);

router.put(
  '/:id',
  upload.any(),               // to handle any file uploads on update
  rootValidation,
  validateBody(subcategorySchema),
  subcategoryController.updateSubcategory
);

router.delete('/:id', subcategoryController.deleteSubcategory);

module.exports = router;
