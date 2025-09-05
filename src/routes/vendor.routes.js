const express = require('express');
const router = express.Router();
const multer = require('multer');
const { rootValidation, validateBody, validateFileExistsObjects } = require('../middlewares/validate');
const { vendorSchema, vendorStatusSchema, vendorApprovalSchema, vendorDeleteSchema } = require('../schemas/vendor.schema');
const vendorController = require('../controllers/vendor.controller');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');
const { vendorNoteCreateSchema } = require('../schemas/vendor_note.schema');
const { vendorPaymentMethodCreateSchema } = require('../schemas/payment_method.schema');
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
  // validateFileExistsObjects('cover_image'),
  // validateFileExistsObjects('fayda_image'),

  jsonFieldsParser(['category_ids', 'keepImages','payment_method']), 

  validateBody(vendorSchema),
  vendorController.createIndividualVendor
);

// Get current user's vendor status
router.get('/my-status',
  vendorController.getUserVendorStatus
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

router.get('/', authorizeAdmin, vendorController.getAllVendors);
router.get('/:id', authorizeAdmin, vendorController.getVendorById);
// Recycle bin - soft-deleted
router.get('/admin/deleted/list', authorizeAdmin, vendorController.getDeletedVendors);
router.post('/admin/deleted/:id/restore', authorizeAdmin, vendorController.restoreVendor);
router.delete('/admin/deleted/:id', authorizeAdmin, vendorController.permanentlyDeleteVendor);

// 1) Toggle vendor status (on/off) - only vendor_owner or employee on their own vendor
router.patch('/status', validateBody(vendorStatusSchema), vendorController.updateVendorStatus);

// 2) Update vendor approval - admin only
router.patch('/approve', authorizeAdmin, validateBody(vendorApprovalSchema), vendorController.updateVendorApproval);

// 3) Delete vendor
// - Vendors/Employees delete their own (no id in path)
router.delete('/', validateBody(vendorDeleteSchema), vendorController.deleteVendor);
// - Admin delete by id in path
router.delete('/:id', authorizeAdmin, vendorController.deleteVendor);

// Vendor notes (admin only for list/create/delete)
router.get('/:id/notes', authorizeAdmin, vendorController.listVendorNotes);
router.post('/:id/notes', authorizeAdmin, validateBody(vendorNoteCreateSchema), vendorController.createVendorNote);
router.delete('/:id/notes/:noteId', authorizeAdmin, vendorController.deleteVendorNote);

// Vendor payment methods (admin add/delete)
router.post('/:id/payment-methods', authorizeAdmin, validateBody(vendorPaymentMethodCreateSchema), vendorController.addVendorPaymentMethod);
router.delete('/:id/payment-methods/:pmId', authorizeAdmin, vendorController.deleteVendorPaymentMethod);

module.exports = router;
