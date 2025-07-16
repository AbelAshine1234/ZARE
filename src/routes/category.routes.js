const express = require('express');
const router = express.Router();
const multer = require('multer');
const { rootValidation, validateBody, validateFileExists } = require('../middlewares/validate');
const { categorySchema } = require('../schemas/category.schema');
const categoryController = require('../controllers/category.controller');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });
// router.use(authenticate, authorizeAdmin);
router.post(
    '/',
    upload.array('category_pictures'),         
    rootValidation,
    validateFileExists('category_pictures'),   
    validateBody(categorySchema),
    categoryController.createCategory
  );
  

router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.put(
  '/:id',
  upload.any(),                         // Middleware for handling file uploads (e.g., images)
  rootValidation,                       // Custom middleware (e.g., auth, role check, etc.)
  validateBody(categorySchema),        // Schema validation middleware for request body
  categoryController.updateCategory     // Actual controller that handles the update
);

router.delete('/:id', categoryController.deleteCategory);
router.get('/:id/subcategories', categoryController.getSubcategoriesByCategoryId);


module.exports = router;
