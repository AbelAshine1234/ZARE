const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get vendor's wallet balance and payout statistics
const getVendorPayoutStats = async (vendorId) => {
  try {
    // Get vendor with wallet information
    const vendor = await prisma.vendor.findUnique({
      where: { id: Number(vendorId) },
      include: {
        user: {
          include: {
            wallet: {
              include: {
                transactions: {
                  where: {
                    type: 'credit'
                  }
                }
              }
            }
          }
        },
        cashOutRequests: {
          orderBy: {
            created_at: 'desc'
          }
        }
      }
    });

    if (!vendor) {
      throw new Error("Vendor not found");
    }

    if (!vendor.user.wallet) {
      throw new Error("Vendor wallet not found");
    }

    const wallet = vendor.user.wallet;
    
    // Calculate total earnings from completed orders
    const totalEarnings = await prisma.order.aggregate({
      where: {
        vendor_id: Number(vendorId),
        status: 'completed'
      },
      _sum: {
        total_amount: true
      }
    });

    // Calculate total withdrawn amount
    const totalWithdrawn = await prisma.cashOutRequest.aggregate({
      where: {
        vendor_id: Number(vendorId),
        status: 'approved'
      },
      _sum: {
        amount: true
      }
    });

    // Get pending payout requests
    const pendingPayouts = await prisma.cashOutRequest.aggregate({
      where: {
        vendor_id: Number(vendorId),
        status: 'pending'
      },
      _sum: {
        amount: true
      }
    });

    // Get this month's payout count
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthPayouts = await prisma.cashOutRequest.count({
      where: {
        vendor_id: Number(vendorId),
        created_at: {
          gte: startOfMonth
        }
      }
    });

    return {
      availableBalance: wallet.balance,
      totalEarnings: totalEarnings._sum.total_amount || 0,
      totalWithdrawn: totalWithdrawn._sum.amount || 0,
      pendingPayouts: pendingPayouts._sum.amount || 0,
      thisMonthPayouts,
      wallet
    };
  } catch (error) {
    console.error("Error in getVendorPayoutStats service:", error);
    throw error;
  }
};

// Get vendor's payout history
const getVendorPayoutHistory = async (vendorId, options = {}) => {
  try {
    const { page = 1, limit = 10, status } = options;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      vendor_id: Number(vendorId)
    };

    if (status) {
      where.status = status;
    }

    const [payouts, total] = await Promise.all([
      prisma.cashOutRequest.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone_number: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      }),
      prisma.cashOutRequest.count({ where })
    ]);

    return {
      payouts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    };
  } catch (error) {
    console.error("Error in getVendorPayoutHistory service:", error);
    throw error;
  }
};

// Create a new payout request
const createPayoutRequest = async (vendorId, amount, reason = null) => {
  try {
    // Get vendor with wallet
    const vendor = await prisma.vendor.findUnique({
      where: { id: Number(vendorId) },
      include: {
        user: {
          include: {
            wallet: true
          }
        }
      }
    });

    if (!vendor) {
      throw new Error("Vendor not found");
    }

    if (!vendor.user.wallet) {
      throw new Error("Vendor wallet not found");
    }

    const wallet = vendor.user.wallet;
    const requestAmount = Number(amount);

    // Validate amount
    if (requestAmount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    if (requestAmount > wallet.balance) {
      throw new Error("Insufficient balance");
    }

    // Check for pending requests
    const pendingRequest = await prisma.cashOutRequest.findFirst({
      where: {
        vendor_id: Number(vendorId),
        status: 'pending'
      }
    });

    if (pendingRequest) {
      throw new Error("You already have a pending payout request");
    }

    // Create payout request
    const payoutRequest = await prisma.cashOutRequest.create({
      data: {
        amount: requestAmount,
        reason: reason,
        vendor_id: Number(vendorId),
        user_id: vendor.user_id,
        status: 'pending'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone_number: true
          }
        }
      }
    });

    return payoutRequest;
  } catch (error) {
    console.error("Error in createPayoutRequest service:", error);
    throw error;
  }
};

// Get payout request by ID
const getPayoutRequestById = async (payoutId) => {
  try {
    const payoutRequest = await prisma.cashOutRequest.findUnique({
      where: { id: Number(payoutId) },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
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

    return payoutRequest;
  } catch (error) {
    console.error("Error in getPayoutRequestById service:", error);
    throw error;
  }
};

// Update payout request status (admin only)
const updatePayoutRequestStatus = async (payoutId, status, reason = null) => {
  try {
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const payoutRequest = await prisma.cashOutRequest.findUnique({
      where: { id: Number(payoutId) },
      include: {
        vendor: {
          include: {
            user: {
              include: {
                wallet: true
              }
            }
          }
        }
      }
    });

    if (!payoutRequest) {
      throw new Error("Payout request not found");
    }

    if (payoutRequest.status !== 'pending') {
      throw new Error("Payout request is not pending");
    }

    // If approving, deduct from wallet balance
    if (status === 'approved') {
      const wallet = payoutRequest.vendor.user.wallet;
      if (wallet.balance < payoutRequest.amount) {
        throw new Error("Insufficient wallet balance");
      }

      // Update wallet balance
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: wallet.balance - payoutRequest.amount
        }
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          type: 'debit',
          amount: payoutRequest.amount,
          reason: `Payout request #${payoutRequest.id} approved`,
          wallet_id: wallet.id,
          status: 'completed'
        }
      });
    }

    // Update payout request status
    const updatedPayoutRequest = await prisma.cashOutRequest.update({
      where: { id: Number(payoutId) },
      data: {
        status,
        reason: reason || payoutRequest.reason
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
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

    return updatedPayoutRequest;
  } catch (error) {
    console.error("Error in updatePayoutRequestStatus service:", error);
    throw error;
  }
};

module.exports = {
  getVendorPayoutStats,
  getVendorPayoutHistory,
  createPayoutRequest,
  getPayoutRequestById,
  updatePayoutRequestStatus
};

