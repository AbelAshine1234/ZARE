const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const {
  validateAddFunds,
  validateDeductFunds,
  validateUserId,
  validatePagination,
  validateCreateWallet
} = require('../middleware/wallet.validation.middleware');

// Get all wallets
router.get('/', walletController.getAllWallets);

// Get wallet by user ID
router.get('/:userId', validateUserId, walletController.getWalletByUserId);

// Get wallet transactions
router.get('/:userId/transactions', validateUserId, validatePagination, walletController.getWalletTransactions);

// Get wallet balance
router.get('/:userId/balance', validateUserId, walletController.getWalletBalance);

// Create wallet for user
router.post('/:userId', validateUserId, validateCreateWallet, walletController.createWallet);

// Add funds to wallet (credit)
router.post('/:userId/add-funds', validateUserId, validateAddFunds, walletController.addFunds);

// Deduct funds from wallet (debit)
router.post('/:userId/deduct-funds', validateUserId, validateDeductFunds, walletController.deductFunds);

// Get transaction by ID
router.get('/transaction/:transactionId', walletController.getTransactionById);

// Export transactions to CSV
router.get('/:userId/export/csv', validateUserId, walletController.exportTransactionsToCSV);

module.exports = router;
