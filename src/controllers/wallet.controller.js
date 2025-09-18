const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Helper to resolve wallet context for user or vendor
const resolveWalletByAccount = async ({ idParam, isVendor }) => {
  const numericId = Number(idParam);
  if (isNaN(numericId)) {
    throw new Error('INVALID_ID');
  }

  if (isVendor) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: numericId },
      select: { id: true, user_id: true }
    });
    if (!vendor) {
      throw new Error('VENDOR_NOT_FOUND');
    }
    const wallet = await prisma.wallet.findUnique({
      where: { user_id: vendor.user_id }
    });
    return { wallet, userId: vendor.user_id };
  }

  const wallet = await prisma.wallet.findUnique({
    where: { user_id: numericId }
  });
  return { wallet, userId: numericId };
};

// Get wallet by user or vendor ID
const getWalletByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const isVendor = req.query.isVendor === 'true' || req.query.isVendor === '1';

    const { wallet } = await resolveWalletByAccount({ idParam: userId, isVendor });

    const walletWithTx = wallet
      ? await prisma.wallet.findUnique({
          where: { id: wallet.id },
          include: {
            user: {
              select: { id: true, name: true, email: true, type: true }
            },
            transactions: {
              orderBy: { created_at: 'desc' },
              take: 10
            }
          }
        })
      : null;

    if (!walletWithTx) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    return res.status(200).json({ wallet: walletWithTx });
  } catch (error) {
    console.error("Error fetching wallet:", error);
    return res.status(500).json({ 
      message: "Failed to fetch wallet", 
      error: error.message 
    });
  }
};

// Get wallet transactions (by user or vendor)
const getWalletTransactions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const isVendor = req.query.isVendor === 'true' || req.query.isVendor === '1';

    const { userId: resolvedUserId } = await resolveWalletByAccount({ idParam: userId, isVendor });

    const skip = (Number(page) - 1) * Number(limit);

    const transactions = await prisma.transaction.findMany({
      where: {
        wallet: {
          user_id: resolvedUserId
        }
      },
      skip,
      take: Number(limit),
      orderBy: { created_at: 'desc' }
    });

    const total = await prisma.transaction.count({
      where: {
        wallet: {
          user_id: resolvedUserId
        }
      }
    });

    return res.status(200).json({
      transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching wallet transactions:", error);
    return res.status(500).json({ 
      message: "Failed to fetch wallet transactions", 
      error: error.message 
    });
  }
};

// Add funds to wallet (credit transaction) for user or vendor
const addFunds = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;
    const isVendor = req.query.isVendor === 'true' || req.query.isVendor === '1';

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const { userId: resolvedUserId } = await resolveWalletByAccount({ idParam: userId, isVendor });

    // Find or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { user_id: resolvedUserId }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          user_id: resolvedUserId,
          balance: 0
        }
      });
    }

    // Create credit transaction
    const transaction = await prisma.transaction.create({
      data: {
        type: 'credit',
        amount: Number(amount),
        reason: reason || 'Funds added to wallet',
        status: 'completed',
        wallet_id: wallet.id
      }
    });

    // Update wallet balance
    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          increment: Number(amount)
        }
      }
    });

    return res.status(200).json({
      message: "Funds added successfully",
      wallet: updatedWallet,
      transaction
    });
  } catch (error) {
    console.error("Error adding funds:", error);
    return res.status(500).json({ 
      message: "Failed to add funds", 
      error: error.message 
    });
  }
};

// Deduct funds from wallet (debit transaction) for user or vendor
const deductFunds = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;
    const isVendor = req.query.isVendor === 'true' || req.query.isVendor === '1';

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const { userId: resolvedUserId } = await resolveWalletByAccount({ idParam: userId, isVendor });

    const wallet = await prisma.wallet.findUnique({
      where: { user_id: resolvedUserId }
    });

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ error: "Insufficient funds" });
    }

    // Create debit transaction
    const transaction = await prisma.transaction.create({
      data: {
        type: 'debit',
        amount: Number(amount),
        reason: reason || 'Funds deducted from wallet',
        status: 'completed',
        wallet_id: wallet.id
      }
    });

    // Update wallet balance
    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          decrement: Number(amount)
        }
      }
    });

    return res.status(200).json({
      message: "Funds deducted successfully",
      wallet: updatedWallet,
      transaction
    });
  } catch (error) {
    console.error("Error deducting funds:", error);
    return res.status(500).json({ 
      message: "Failed to deduct funds", 
      error: error.message 
    });
  }
};

// Create wallet for user
const createWallet = async (req, res) => {
  try {
    const { userId } = req.params;
    const isVendor = req.query.isVendor === 'true' || req.query.isVendor === '1';

    const { userId: resolvedUserId } = await resolveWalletByAccount({ idParam: userId, isVendor });

    // Check if wallet already exists
    const existingWallet = await prisma.wallet.findUnique({
      where: { user_id: resolvedUserId }
    });

    if (existingWallet) {
      return res.status(400).json({ error: "Wallet already exists for this user" });
    }

    // Create wallet
    const wallet = await prisma.wallet.create({
      data: {
        user_id: resolvedUserId,
        balance: 0
      }
    });

    return res.status(201).json({
      message: "Wallet created successfully",
      wallet
    });
  } catch (error) {
    console.error("Error creating wallet:", error);
    return res.status(500).json({ 
      message: "Failed to create wallet", 
      error: error.message 
    });
  }
};

// Get wallet balance (by user or vendor)
const getWalletBalance = async (req, res) => {
  try {
    const { userId } = req.params;
    const isVendor = req.query.isVendor === 'true' || req.query.isVendor === '1';

    const { userId: resolvedUserId } = await resolveWalletByAccount({ idParam: userId, isVendor });

    const wallet = await prisma.wallet.findUnique({
      where: { user_id: resolvedUserId },
      select: {
        id: true,
        balance: true,
        user_id: true
      }
    });

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    return res.status(200).json({ 
      balance: wallet.balance,
      wallet_id: wallet.id
    });
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    return res.status(500).json({ 
      message: "Failed to fetch wallet balance", 
      error: error.message 
    });
  }
};

// Get transaction by ID
const getTransactionById = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { 
        transaction_id: transactionId 
      },
      include: {
        wallet: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    return res.status(200).json({ transaction });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return res.status(500).json({ 
      message: "Failed to fetch transaction", 
      error: error.message 
    });
  }
};

// Get all wallets with vendor information
const getAllWallets = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const wallets = await prisma.wallet.findMany({
      skip,
      take: Number(limit),
      include: {
        user: {
          include: {
            vendor: {
              include: {
                vendorCategories: {
                  include: {
                    category: true
                  }
                }
              }
            }
          }
        },
        transactions: {
          orderBy: { created_at: 'desc' },
          take: 5 // Get last 5 transactions for each wallet
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const total = await prisma.wallet.count();

    // Transform data to include vendor information
    const walletsWithVendorInfo = wallets.map(wallet => ({
      id: wallet.id,
      balance: wallet.balance,
      status: wallet.status,
      created_at: wallet.created_at,
      updated_at: wallet.updated_at,
      user_id: wallet.user_id,
      user: wallet.user,
      vendor: wallet.user.vendor,
      recentTransactions: wallet.transactions
    }));

    return res.status(200).json({
      wallets: walletsWithVendorInfo,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching all wallets:", error);
    return res.status(500).json({ 
      message: "Failed to fetch wallets", 
      error: error.message 
    });
  }
};

// Get only vendor wallets
const getVendorWallets = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const wallets = await prisma.wallet.findMany({
      skip,
      take: Number(limit),
      where: {
        user: {
          vendor: {
            // Any vendor relation indicates vendor account
            not: null
          }
        }
      },
      include: {
        user: {
          include: {
            vendor: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const total = await prisma.wallet.count({
      where: {
        user: {
          vendor: {
            not: null
          }
        }
      }
    });

    return res.status(200).json({
      wallets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching vendor wallets:", error);
    return res.status(500).json({ 
      message: "Failed to fetch vendor wallets", 
      error: error.message 
    });
  }
};

// Get only user wallets (non-vendor accounts)
const getUserWallets = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const wallets = await prisma.wallet.findMany({
      skip,
      take: Number(limit),
      where: {
        OR: [
          { user: { vendor: null } },
          { user: null } // safety if any orphaned wallet exists
        ]
      },
      include: {
        user: true
      },
      orderBy: { created_at: 'desc' }
    });

    const total = await prisma.wallet.count({
      where: { OR: [ { user: { vendor: null } }, { user: null } ] }
    });

    return res.status(200).json({
      wallets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching user wallets:", error);
    return res.status(500).json({ 
      message: "Failed to fetch user wallets", 
      error: error.message 
    });
  }
};

// Export transactions to CSV (by user or vendor)
const exportTransactionsToCSV = async (req, res) => {
  try {
    const { userId } = req.params;
    const isVendor = req.query.isVendor === 'true' || req.query.isVendor === '1';

    const { userId: resolvedUserId } = await resolveWalletByAccount({ idParam: userId, isVendor });

    const transactions = await prisma.transaction.findMany({
      where: {
        wallet: {
          user_id: resolvedUserId
        }
      },
      include: {
        wallet: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const headers = ['Date', 'Type', 'Amount', 'Reason', 'Status', 'Transaction ID', 'User Name', 'User Email'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(transaction => [
        new Date(transaction.created_at).toISOString(),
        transaction.type,
        transaction.amount,
        `"${(transaction.reason || '').replace(/"/g, '""')}"`,
        transaction.status,
        transaction.transaction_id,
        `"${transaction.wallet.user.name}"`,
        `"${transaction.wallet.user.email}"`
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="wallet-transactions-${userId}-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error("Error exporting transactions:", error);
    return res.status(500).json({ 
      message: "Failed to export transactions", 
      error: error.message 
    });
  }
};

module.exports = {
  getWalletByUserId,
  getWalletTransactions,
  addFunds,
  deductFunds,
  createWallet,
  getWalletBalance,
  getTransactionById,
  exportTransactionsToCSV,
  getAllWallets,
  getVendorWallets,
  getUserWallets
};
