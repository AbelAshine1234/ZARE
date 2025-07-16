const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { rootValidation, validateBody } = require('../middlewares/validate');
const userSchema = require('../schemas/user.schema');

router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.delete('/:id', userController.deleteUser);

module.exports = router;
