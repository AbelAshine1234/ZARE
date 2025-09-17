const express = require('express');
const router = express.Router();
const multer = require('multer');
const { rootValidation, validateBody } = require('../middlewares/validate');
const { productSchema } = require('../schemas/product.schema');
const productController = require('../controllers/product.controller');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');
const jsonFieldsParser = require('../middlewares/jsonFieldsParser');

// Apply authentication middleware to all routes
router.use(authenticate);

// Vendor ownership validation middleware
const validateVendorOwnership = async (req, res, next) => {
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    
    const userId = req.user?.id;
    const vendorId = req.body.vendor_id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!vendorId) {
      return res.status(400).json({ error: 'Vendor ID is required' });
    }
    
    // Check if the vendor exists and is owned by the authenticated user
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: Number(vendorId),
        user_id: Number(userId)
      }
    });
    
    if (!vendor) {
      return res.status(403).json({ error: 'You do not own this vendor or vendor does not exist' });
    }
    
    // Add vendor info to request for use in controller
    req.vendor = vendor;
    next();
    
  } catch (error) {
    console.error('Vendor ownership validation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Create product
router.post(
  '/',
  validateVendorOwnership, // Check vendor ownership first
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
