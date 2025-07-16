const express = require('express');
const router = express.Router();
const multer = require('multer');
const { rootValidation, validateBody } = require('../middlewares/validate');
const { productSchema } = require('../schemas/product.schema');
const productController = require('../controllers/product.controller');
const { authenticate } = require('../middlewares/authMiddleware');
const jsonFieldsParser = require('../middlewares/jsonFieldsParser');

// Apply authentication middleware to all routes
// router.use(authenticate);

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Create product
router.post(
  '/',
  upload.fields([
    { name: 'images', maxCount: 10 }, // Allow up to 10 images
    { name: 'videos', maxCount: 5 },  // Allow up to 5 videos
  ]),
  rootValidation,
  jsonFieldsParser(['specs']), // Parse specs as JSON
  validateBody(productSchema),
  productController.createProduct
);

// Get all products with pagination and filtering
router.get('/', productController.getAllProducts);

// Get product by ID
router.get('/:id', productController.getProductById);

// Update product
router.put(
  '/:id',
  upload.fields([
    { name: 'images', maxCount: 10 }, // Allow up to 10 images
    { name: 'videos', maxCount: 5 },  // Allow up to 5 videos
  ]),
  rootValidation,
  jsonFieldsParser(['specs']), // Parse specs as JSON
  validateBody(productSchema),
  productController.updateProduct
);

// Delete product
router.delete('/:id', productController.deleteProduct);

module.exports = router;
