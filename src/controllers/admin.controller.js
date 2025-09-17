const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Get total counts
    const [
      totalUsers,
      totalVendors,
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingDeliveries,
      activeDrivers,
      pendingCashouts
    ] = await Promise.all([
      prisma.user.count(),
      prisma.vendor.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: 'credit' }
      }),
      prisma.delivery.count({
        where: { status: { in: ['pending', 'in_progress'] } }
      }),
      prisma.driver.count({
        where: { current_status: 'online' }
      }),
      prisma.cashOutRequest.count({
        where: { status: 'pending' }
      })
    ]);

    const stats = {
      totalUsers,
      totalVendors,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue._sum.amount || 0,
      pendingDeliveries,
      activeDrivers,
      pendingCashouts
    };
    res.status(200).json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get recent orders for dashboard
const getRecentOrders = async (req, res) => {
  try {
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone_number: true
          }
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true
              }
            }
          }
        }
      }
    });

    res.status(200).json(recentOrders);
  } catch (error) {
    console.error('Recent orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all users with pagination and optional type filter
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const type = req.query.type; // optional: client | vendor_owner | driver | employee | admin

    const where = type ? { type } : undefined;

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        where,
        include: {
          client: {
            include: {
              image: true,
              wallet: true
            }
          },
          vendor: {
            include: {
              wallet: true,
              subscription: true,
            }
          },
          driver: {
            include: {
              profile_image: true,
              wallet: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    res.status(200).json({
      users,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all vendors with pagination
const getAllVendors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [vendors, totalCount] = await Promise.all([
      prisma.vendor.findMany({
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone_number: true,
              email: true,
              type: true,
              is_verified: true
            }
          },
          image: true,
          wallet: true,
          products: {
            select: {
              id: true,
              name: true,
              price: true,
              status: true
            }
          }
        }
      }),
      prisma.vendor.count()
    ]);

    res.status(200).json({
      vendors,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get all vendors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all products with pagination
const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          vendor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  phone_number: true
                }
              }
            }
          },
          category: true,
          subcategory: true,
          images: true
        }
      }),
      prisma.product.count()
    ]);

    res.status(200).json({
      products,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all orders with pagination
const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone_number: true
            }
          },
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true
                }
              }
            }
          },
          delivery: {
            include: {
              driver: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      phone_number: true
                    }
                  }
                }
              }
            }
          }
        }
      }),
      prisma.order.count()
    ]);

    res.status(200).json({
      orders,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all drivers with pagination
const getAllDrivers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [drivers, totalCount] = await Promise.all([
      prisma.driver.findMany({
        skip,
        take: limit,
        orderBy: { id: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone_number: true,
              email: true,
              type: true,
              is_verified: true
            }
          },
          profile_image: true,
          license_image: true,
          fayda_image: true,
          wallet: true,
          deliveries: {
            select: {
              id: true,
              delivery_status: true,
              delivered_at: true
            }
          }
        }
      }),
      prisma.driver.count()
    ]);

    res.status(200).json({
      drivers,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get all drivers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all cash out requests with pagination
const getAllCashOutRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [cashOutRequests, totalCount] = await Promise.all([
      prisma.cashOutRequest.findMany({
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone_number: true
            }
          },
          wallet: {
            select: {
              id: true,
              balance: true
            }
          }
        }
      }),
      prisma.cashOutRequest.count()
    ]);

    res.status(200).json({
      cashOutRequests,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get all cash out requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all transactions with pagination
const getAllTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone_number: true
            }
          },
          wallet: {
            select: {
              id: true,
              balance: true
            }
          }
        }
      }),
      prisma.transaction.count()
    ]);

    res.status(200).json({
      transactions,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all deliveries with pagination
const getAllDeliveries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [deliveries, totalCount] = await Promise.all([
      prisma.delivery.findMany({
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          order: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  phone_number: true
                }
              }
            }
          },
          driver: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  phone_number: true
                }
              }
            }
          }
        }
      }),
      prisma.delivery.count()
    ]);

    res.status(200).json({
      deliveries,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get all deliveries error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all employees with pagination
const getAllEmployees = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [employees, totalCount] = await Promise.all([
      prisma.employee.findMany({
        skip,
        take: limit,
        orderBy: { id: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone_number: true,
              email: true,
              type: true,
              is_verified: true,
              created_at: true,
            }
          },
          vendor: true,
        }
      }),
      prisma.employee.count()
    ]);

    return res.status(200).json({
      employees,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get all employees error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getDashboardStats,
  getRecentOrders,
  getAllUsers,
  getAllVendors,
  getAllProducts,
  getAllOrders,
  getAllDrivers,
  getAllEmployees,
  getAllCashOutRequests,
  getAllTransactions,
  getAllDeliveries
};
