const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get orders by vendor
const getOrdersByVendor = async (vendorId, options = {}) => {
  try {
    const { page = 1, limit = 10, status, search } = options;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      vendor_id: Number(vendorId)
    };

    // Add status filter if provided
    if (status) {
      where.status = status;
    }

    // Add search filter if provided
    if (search) {
      where.OR = [
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { client: { user: { name: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          client: {
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
          },
          vendor: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          product: {
            include: {
              images: true,
              category: {
                select: {
                  id: true,
                  name: true
                }
              },
              subcategory: {
                select: {
                  id: true,
                  name: true
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
        },
        orderBy: {
          created_at: 'desc'
        }
      }),
      prisma.order.count({ where })
    ]);

    return {
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    };
  } catch (error) {
    console.error("Error in getOrdersByVendor service:", error);
    throw error;
  }
};

// Update order status
const updateOrderStatus = async (orderId, status) => {
  try {
    // Validate status
    const validStatuses = ['new', 'processing', 'ready_to_delivery', 'completed'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: {
        client: {
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
        vendor: {
          select: {
            id: true,
            name: true
          }
        },
        product: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!existingOrder) {
      throw new Error("Order not found");
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: Number(orderId) },
      data: { status },
      include: {
        client: {
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
        },
        vendor: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        product: {
          include: {
            images: true,
            category: {
              select: {
                id: true,
                name: true
              }
            },
            subcategory: {
              select: {
                id: true,
                name: true
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
    });

    return updatedOrder;
  } catch (error) {
    console.error("Error in updateOrderStatus service:", error);
    throw error;
  }
};

// Get order by ID
const getOrderById = async (orderId) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: {
        client: {
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
        },
        vendor: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        product: {
          include: {
            images: true,
            category: {
              select: {
                id: true,
                name: true
              }
            },
            subcategory: {
              select: {
                id: true,
                name: true
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
    });

    return order;
  } catch (error) {
    console.error("Error in getOrderById service:", error);
    throw error;
  }
};

module.exports = {
  getOrdersByVendor,
  updateOrderStatus,
  getOrderById
};