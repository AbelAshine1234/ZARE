const express = require('express');
const router = express.Router();
const multer = require('multer');
const { rootValidation, validateBody, validateFileExists } = require('../middlewares/validate');
const { categorySchema } = require('../schemas/category.schema');
const categoryController = require('../controllers/category.controller');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });
router.use(authenticate, authorizeAdmin);
router.post(
    '/',
    upload.array('category_pictures'),        // corrected spelling & underscore
    rootValidation,
    validateFileExists('category_pictures'),  // must match multer field name
    validateBody(categorySchema),
    categoryController.createCategory
  );
  

router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.put('/:id', rootValidation, validateBody(categorySchema), categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
