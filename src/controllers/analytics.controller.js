const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// GET /api/analytics/vendors/approved
// Returns approved & active vendors with wallet balance and cashout stats
module.exports.getApprovedVendorsAnalytics = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const skip = (page - 1) * limit;

    const where = {
      is_approved: true,
      status: true,
    };

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'desc' },
        include: {
          wallet: true,
          user: { select: { id: true, name: true, email: true, phone_number: true } },
          cashOutRequests: true,
        }
      }),
      prisma.vendor.count({ where })
    ]);

    // Compute stats per vendor
    const rows = vendors.map(v => {
      const walletBalance = v.wallet?.balance ?? 0;
      const cor = v.cashOutRequests || [];
      const totalCashouts = cor.length;
      const pendingCashouts = cor.filter(c => c.status === 'pending').length;
      const approvedCashouts = cor.filter(c => c.status === 'approved').length;
      const rejectedCashouts = cor.filter(c => c.status === 'rejected').length;
      const totalCashoutAmount = cor.reduce((sum, c) => sum + (c.amount || 0), 0);

      return {
        id: v.id,
        name: v.name,
        type: v.type,
        user: v.user,
        wallet: { id: v.wallet?.id || null, balance: walletBalance },
        cashouts: {
          total: totalCashouts,
          pending: pendingCashouts,
          approved: approvedCashouts,
          rejected: rejectedCashouts,
          totalAmount: totalCashoutAmount,
        },
      };
    });

    return res.status(200).json({
      vendors: rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching approved vendors analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics', detail: error.message });
  }
};

// GET /api/analytics/summary
// Returns high-level KPIs across users, vendors, products, orders, wallets, transactions, refunds, deliveries, complaints, cashouts
module.exports.getSummaryAnalytics = async (req, res) => {
  try {
    const [
      totalUsers,
      totalClients,
      totalVendorOwners,
      totalEmployees,
      totalDrivers,
      totalAdmins,
      totalVendors,
      approvedActiveVendors,
      inactiveVendors,
      totalProducts,
      ordersTotal,
      ordersNew,
      ordersProcessing,
      ordersCompleted,
      txCreditSum,
      txDebitSum,
      txCompletedCount,
      refundsTotal,
      refundsCompleted,
      refundsAmountCompleted,
      walletsTotalBalance,
      cashoutsTotal,
      cashoutsPending,
      cashoutsApproved,
      cashoutsRejected,
      deliveriesTotal,
      deliveriesNotAssigned,
      deliveriesAssigned,
      deliveriesOutForDelivery,
      deliveriesDelivered,
      complaintsTotal,
      complaintsPending,
      complaintsResolved,
      complaintsRefunded,
      driversAvailable,
      driversOnDelivery,
      driversOffline
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { type: 'client' } }),
      prisma.user.count({ where: { type: 'vendor_owner' } }),
      prisma.user.count({ where: { type: 'employee' } }),
      prisma.user.count({ where: { type: 'driver' } }),
      prisma.user.count({ where: { type: 'admin' } }),
      prisma.vendor.count(),
      prisma.vendor.count({ where: { is_approved: true, status: true } }),
      prisma.vendor.count({ where: { status: false } }),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'new' } }),
      prisma.order.count({ where: { status: 'processing' } }),
      prisma.order.count({ where: { status: 'completed' } }),
      prisma.transaction.aggregate({ _sum: { amount: true }, where: { status: 'completed', type: 'credit' } }),
      prisma.transaction.aggregate({ _sum: { amount: true }, where: { status: 'completed', type: 'debit' } }),
      prisma.transaction.count({ where: { status: 'completed' } }),
      prisma.refund.count(),
      prisma.refund.count({ where: { status: 'completed' } }),
      prisma.refund.aggregate({ _sum: { amount: true }, where: { status: 'completed' } }),
      prisma.wallet.aggregate({ _sum: { balance: true } }),
      prisma.cashOutRequest.count(),
      prisma.cashOutRequest.count({ where: { status: 'pending' } }),
      prisma.cashOutRequest.count({ where: { status: 'approved' } }),
      prisma.cashOutRequest.count({ where: { status: 'rejected' } }),
      prisma.delivery.count(),
      prisma.delivery.count({ where: { delivery_status: 'not_assigned' } }),
      prisma.delivery.count({ where: { delivery_status: 'assigned' } }),
      prisma.delivery.count({ where: { delivery_status: 'out_for_delivery' } }),
      prisma.delivery.count({ where: { delivery_status: 'delivered' } }),
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: 'pending' } }),
      prisma.complaint.count({ where: { status: 'resolved' } }),
      prisma.complaint.count({ where: { status: 'refunded' } }),
      prisma.driver.count({ where: { current_status: 'available' } }),
      prisma.driver.count({ where: { current_status: 'on_delivery' } }),
      prisma.driver.count({ where: { current_status: 'offline' } })
    ]);

    const summary = {
      users: {
        total: totalUsers,
        byType: {
          client: totalClients,
          vendor_owner: totalVendorOwners,
          employee: totalEmployees,
          driver: totalDrivers,
          admin: totalAdmins,
        }
      },
      vendors: {
        total: totalVendors,
        approvedActive: approvedActiveVendors,
        inactive: inactiveVendors,
      },
      products: { total: totalProducts },
      orders: {
        total: ordersTotal,
        byStatus: {
          new: ordersNew,
          processing: ordersProcessing,
          completed: ordersCompleted,
        }
      },
      financials: {
        transactions: {
          completedCount: txCompletedCount,
          creditSum: txCreditSum?._sum?.amount || 0,
          debitSum: txDebitSum?._sum?.amount || 0,
          net: (txCreditSum?._sum?.amount || 0) - (txDebitSum?._sum?.amount || 0)
        },
        refunds: {
          total: refundsTotal,
          completed: refundsCompleted,
          amountCompleted: refundsAmountCompleted?._sum?.amount || 0
        },
        wallets: {
          totalBalance: walletsTotalBalance?._sum?.balance || 0
        },
        cashouts: {
          total: cashoutsTotal,
          pending: cashoutsPending,
          approved: cashoutsApproved,
          rejected: cashoutsRejected,
        }
      },
      deliveries: {
        total: deliveriesTotal,
        byStatus: {
          not_assigned: deliveriesNotAssigned,
          assigned: deliveriesAssigned,
          out_for_delivery: deliveriesOutForDelivery,
          delivered: deliveriesDelivered,
        }
      },
      complaints: {
        total: complaintsTotal,
        byStatus: {
          pending: complaintsPending,
          resolved: complaintsResolved,
          refunded: complaintsRefunded,
        }
      },
      drivers: {
        byStatus: {
          available: driversAvailable,
          on_delivery: driversOnDelivery,
          offline: driversOffline,
        }
      }
    };

    return res.status(200).json({ summary });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics summary', detail: error.message });
  }
};
