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

// Product ownership validation middleware (for update/delete operations)
const validateProductOwnership = async (req, res, next) => {
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();

    const userId = req.user?.id;
    const userType = req.user?.type;
    const productId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    // Get the product with vendor info
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        vendor: {
          select: {
            id: true,
            user_id: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // For admins, allow access to any product
    if (userType === 'admin') {
      req.product = product;
      next();
      return;
    }

    // For vendor_owners, check if they own the vendor
    if (userType === 'vendor_owner') {
      if (product.vendor.user_id !== Number(userId)) {
        return res.status(403).json({ error: 'You do not own this product' });
      }
      req.product = product;
      next();
      return;
    }

    // For other user types, deny access
    return res.status(403).json({ error: 'Insufficient permissions to modify this product' });

  } catch (error) {
    console.error('Product ownership validation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Vendor ownership validation middleware (for create operations)
const validateVendorOwnership = async (req, res, next) => {
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();

    const userId = req.user?.id;
    const userType = req.user?.type;
    const vendorId = req.body.vendor_id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // For admins, vendor_id is required and they can create products for any vendor
    if (userType === 'admin') {
      if (!vendorId) {
        return res.status(400).json({ error: 'Vendor ID is required for admin users' });
      }

      // Check if vendor exists
      const vendor = await prisma.vendor.findUnique({
        where: { id: Number(vendorId) }
      });

      if (!vendor) {
        return res.status(404).json({ error: 'Vendor does not exist' });
      }

      // Add vendor info to request for use in controller
      req.vendor = vendor;
      next();
      return;
    }

    // For vendor_owners, automatically use their vendor (no vendor_id needed in body)
    if (userType === 'vendor_owner') {
      // Find the vendor owned by this user
      const vendor = await prisma.vendor.findFirst({
        where: {
          user_id: Number(userId),
          status: true, // Only active vendors
          is_approved: true // Only approved vendors
        }
      });

      if (!vendor) {
        return res.status(404).json({ error: 'No active vendor account found for this user' });
      }

      // Add vendor info to request for use in controller
      req.vendor = vendor;
      // Also add vendor_id to req.body so the controller can use it
      req.body.vendor_id = vendor.id;
      next();
      return;
    }

    // For other user types, deny access
    return res.status(403).json({ error: 'Insufficient permissions to create products' });

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
  upload.fields([
    { name: 'images', maxCount: 10 }, // Allow up to 10 images
    { name: 'videos', maxCount: 5 },  // Allow up to 5 videos
  ]),
  validateVendorOwnership, // Check vendor ownership after multer parses the body
  rootValidation,
  jsonFieldsParser(['specs']), // Parse specs as JSON
  validateBody(productSchema),
  productController.createProduct
);

// Get all products with pagination and filtering
router.get('/', productController.getAllProducts);

// Get current vendor owner's products (must come before /:id route)
router.get('/my-products', productController.getVendorProducts);

// Get product by ID
router.get('/:id', productController.getProductById);

// Admin dashboard routes
router.get('/admin/dashboard/stats', authorizeAdmin, productController.getAdminProductStats);
router.get('/admin/dashboard/all', authorizeAdmin, productController.getAdminAllProducts);
router.get('/admin/dashboard/pending', authorizeAdmin, productController.getPendingProducts);
router.get('/admin/dashboard/vendor/:vendorId', authorizeAdmin, productController.getProductsByVendor);

// Admin product management
router.put('/admin/:id/approve', authorizeAdmin, productController.approveProduct);
router.put('/admin/:id/reject', authorizeAdmin, productController.rejectProduct);
router.put('/admin/:id/status', authorizeAdmin, productController.updateProductStatus);

// Admin product image management
router.put('/admin/:id/images', authorizeAdmin, productController.updateProductImages);
router.delete('/admin/:id/images/:imageId', authorizeAdmin, productController.deleteProductImage);

// Admin bulk operations
router.put('/admin/bulk/stock', authorizeAdmin, productController.bulkUpdateStock);
router.put('/admin/bulk/status', authorizeAdmin, productController.bulkUpdateStatus);

// Update product
router.put(
  '/:id',
  validateProductOwnership, // Check product ownership first
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
router.delete('/:id', validateProductOwnership, productController.deleteProduct);

module.exports = router;
