const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get wallet by user ID
const getWalletByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdNum = Number(userId);

    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { user_id: userIdNum },
      include: {
        transactions: {
          orderBy: { created_at: 'desc' },
          take: 10 // Get last 10 transactions
        }
      }
    });

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    return res.status(200).json({ wallet });
  } catch (error) {
    console.error("Error fetching wallet:", error);
    return res.status(500).json({ 
      message: "Failed to fetch wallet", 
      error: error.message 
    });
  }
};

// Get wallet transactions
const getWalletTransactions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const userIdNum = Number(userId);

    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const transactions = await prisma.transaction.findMany({
      where: {
        wallet: {
          user_id: userIdNum
        }
      },
      skip,
      take: Number(limit),
      orderBy: { created_at: 'desc' }
    });

    const total = await prisma.transaction.count({
      where: {
        wallet: {
          user_id: userIdNum
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

// Add funds to wallet (credit transaction)
const addFunds = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;
    const userIdNum = Number(userId);

    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Find or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { user_id: userIdNum }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          user_id: userIdNum,
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

// Deduct funds from wallet (debit transaction)
const deductFunds = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;
    const userIdNum = Number(userId);

    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { user_id: userIdNum }
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
    const userIdNum = Number(userId);

    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Check if wallet already exists
    const existingWallet = await prisma.wallet.findUnique({
      where: { user_id: userIdNum }
    });

    if (existingWallet) {
      return res.status(400).json({ error: "Wallet already exists for this user" });
    }

    // Create wallet
    const wallet = await prisma.wallet.create({
      data: {
        user_id: userIdNum,
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

// Get wallet balance
const getWalletBalance = async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdNum = Number(userId);

    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { user_id: userIdNum },
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

// Export transactions to CSV
const exportTransactionsToCSV = async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdNum = Number(userId);

    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        wallet: {
          user_id: userIdNum
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
  getAllWallets
};
