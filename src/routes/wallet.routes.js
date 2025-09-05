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

// Get vendor wallets
router.get('/vendors', walletController.getVendorWallets);

// Get user wallets
router.get('/users', walletController.getUserWallets);

// Get wallet by user ID
router.get('/:userId', validateUserId, walletController.getWalletByUserId);

// Get wallet transactions
router.get('/:userId/transactions', validateUserId, validatePagination, walletController.getWalletTransactions);

// Get wallet balance
router.get('/:userId/balance', validateUserId, walletController.getWalletBalance);

// Create wallet for user
router.post('/:userId', validateUserId, validateCreateWallet, walletController.createWallet);

// Add funds to wallet (credit)
// If the account is a vendor, add funds to the vendor's wallet using vendor id 
router.post('/:userId/add-funds', validateUserId, validateAddFunds, walletController.addFunds);

// Deduct funds from wallet (debit)
// If the account is a vendor, deduct funds from the vendor's wallet using vendor id
router.post('/:userId/deduct-funds', validateUserId, validateDeductFunds, walletController.deductFunds);

// Get transaction by ID
router.get('/transaction/:transactionId', walletController.getTransactionById);

// Export transactions to CSV
// If the account is a vendor, export transactions to the vendor's wallet using vendor id
router.get('/:userId/export/csv', validateUserId, walletController.exportTransactionsToCSV);

module.exports = router;
