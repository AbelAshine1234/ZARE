const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Create cashout request
const createCashOutRequest = async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const { userId } = req.params;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const userIdNum = Number(userId);
    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userIdNum },
      include: { 
        vendor: true,
        client: true,
        driver: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user has a wallet
    const wallet = await prisma.wallet.findUnique({
      where: { user_id: userIdNum }
    });

    if (!wallet) {
      return res.status(400).json({ error: "Wallet not found. Please create a wallet first." });
    }

    // Check if user has sufficient balance
    if (wallet.balance < amount) {
      return res.status(400).json({ 
        error: "Insufficient balance", 
        currentBalance: wallet.balance,
        requestedAmount: amount 
      });
    }

    // Determine vendor_id based on user type
    let vendorId = null;
    if (user.type === 'vendor_owner' && user.vendor) {
      vendorId = user.vendor.id;
    }

    // Create cashout request
    const cashOutRequest = await prisma.cashOutRequest.create({
      data: {
        amount: Number(amount),
        reason: reason || 'Cashout request',
        status: 'pending',
        user_id: userIdNum,
        vendor_id: vendorId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone_number: true,
            email: true,
            type: true
          }
        }
      }
    });

    return res.status(201).json({
      message: "Cashout request created successfully",
      cashOutRequest
    });
  } catch (error) {
    console.error("Error creating cashout request:", error);
    return res.status(500).json({ 
      message: "Failed to create cashout request", 
      error: error.message 
    });
  }
};

// Get all cashout requests (for admin)
const getAllCashOutRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const cashOutRequests = await prisma.cashOutRequest.findMany({
      where: whereClause,
      skip,
      take: Number(limit),
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone_number: true,
            email: true
          }
        }
      }
    });

    const total = await prisma.cashOutRequest.count({
      where: whereClause
    });

    return res.status(200).json({
      cashOutRequests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching cashout requests:", error);
    return res.status(500).json({ 
      message: "Failed to fetch cashout requests", 
      error: error.message 
    });
  }
};

// Get cashout requests by user ID
const getCashOutRequestsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    const userIdNum = Number(userId);

    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const whereClause = { user_id: userIdNum };
    if (status) {
      whereClause.status = status;
    }

    const cashOutRequests = await prisma.cashOutRequest.findMany({
      where: whereClause,
      skip,
      take: Number(limit),
      orderBy: { created_at: 'desc' },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    const total = await prisma.cashOutRequest.count({
      where: whereClause
    });

    return res.status(200).json({
      cashOutRequests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching user cashout requests:", error);
    return res.status(500).json({ 
      message: "Failed to fetch user cashout requests", 
      error: error.message 
    });
  }
};

// Approve cashout request (admin only)
const approveCashOutRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const requestIdNum = Number(requestId);

    if (isNaN(requestIdNum)) {
      return res.status(400).json({ error: "Invalid request ID" });
    }

    // Find the cashout request
    const cashOutRequest = await prisma.cashOutRequest.findUnique({
      where: { id: requestIdNum },
      include: {
        user: {
          include: {
            wallet: true
          }
        }
      }
    });

    if (!cashOutRequest) {
      return res.status(404).json({ error: "Cashout request not found" });
    }

    if (cashOutRequest.status !== 'pending') {
      return res.status(400).json({ 
        error: "Cashout request cannot be approved. Current status: " + cashOutRequest.status 
      });
    }

    // Check if user has sufficient balance
    if (!cashOutRequest.user.wallet) {
      return res.status(400).json({ error: "User wallet not found" });
    }

    if (cashOutRequest.user.wallet.balance < cashOutRequest.amount) {
      return res.status(400).json({ 
        error: "Insufficient balance in user wallet",
        currentBalance: cashOutRequest.user.wallet.balance,
        requestedAmount: cashOutRequest.amount
      });
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update cashout request status to approved
      const updatedRequest = await tx.cashOutRequest.update({
        where: { id: requestIdNum },
        data: { status: 'approved' }
      });

      // Deduct amount from user wallet
      const updatedWallet = await tx.wallet.update({
        where: { id: cashOutRequest.user.wallet.id },
        data: {
          balance: {
            decrement: cashOutRequest.amount
          }
        }
      });

      // Create a transaction record for the deduction
      const transaction = await tx.transaction.create({
        data: {
          type: 'debit',
          amount: cashOutRequest.amount,
          reason: `Cashout request approved - ${cashOutRequest.reason || 'Cashout'}`,
          status: 'completed',
          wallet_id: cashOutRequest.user.wallet.id
        }
      });

      return { updatedRequest, updatedWallet, transaction };
    });

    return res.status(200).json({
      message: "Cashout request approved successfully",
      cashOutRequest: result.updatedRequest,
      wallet: result.updatedWallet,
      transaction: result.transaction
    });
  } catch (error) {
    console.error("Error approving cashout request:", error);
    return res.status(500).json({ 
      message: "Failed to approve cashout request", 
      error: error.message 
    });
  }
};

// Reject cashout request (admin only)
const rejectCashOutRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    const requestIdNum = Number(requestId);

    if (isNaN(requestIdNum)) {
      return res.status(400).json({ error: "Invalid request ID" });
    }

    // Find the cashout request
    const cashOutRequest = await prisma.cashOutRequest.findUnique({
      where: { id: requestIdNum }
    });

    if (!cashOutRequest) {
      return res.status(404).json({ error: "Cashout request not found" });
    }

    if (cashOutRequest.status !== 'pending') {
      return res.status(400).json({ 
        error: "Cashout request cannot be rejected. Current status: " + cashOutRequest.status 
      });
    }

    // Update cashout request status to rejected
    const updatedRequest = await prisma.cashOutRequest.update({
      where: { id: requestIdNum },
      data: { 
        status: 'rejected',
        reason: reason || cashOutRequest.reason
      }
    });

    return res.status(200).json({
      message: "Cashout request rejected successfully",
      cashOutRequest: updatedRequest
    });
  } catch (error) {
    console.error("Error rejecting cashout request:", error);
    return res.status(500).json({ 
      message: "Failed to reject cashout request", 
      error: error.message 
    });
  }
};

// Get cashout request by ID
const getCashOutRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;
    const requestIdNum = Number(requestId);

    if (isNaN(requestIdNum)) {
      return res.status(400).json({ error: "Invalid request ID" });
    }

    const cashOutRequest = await prisma.cashOutRequest.findUnique({
      where: { id: requestIdNum },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone_number: true,
            email: true
          }
        }
      }
    });

    if (!cashOutRequest) {
      return res.status(404).json({ error: "Cashout request not found" });
    }

    return res.status(200).json({ cashOutRequest });
  } catch (error) {
    console.error("Error fetching cashout request:", error);
    return res.status(500).json({ 
      message: "Failed to fetch cashout request", 
      error: error.message 
    });
  }
};

module.exports = {
  createCashOutRequest,
  getAllCashOutRequests,
  getCashOutRequestsByUserId,
  approveCashOutRequest,
  rejectCashOutRequest,
  getCashOutRequestById
};
