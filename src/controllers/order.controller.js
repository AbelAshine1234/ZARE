const orderService = require('../services/order.service');

// Get orders by vendor
const getOrdersByVendor = async (req, res) => {
  try {
    const { vendor_id } = req.params;
    const { page = 1, limit = 10, status, search } = req.query;

    const vendorId = Number(vendor_id);
    if (isNaN(vendorId)) {
      return res.status(400).json({ 
        error: "Invalid vendor ID" 
      });
    }

    const result = await orderService.getOrdersByVendor(vendorId, {
      page,
      limit,
      status,
      search
    });

    return res.status(200).json({
      message: "Orders retrieved successfully",
      ...result
    });

  } catch (error) {
    console.error("Error in getOrdersByVendor controller:", error);
    return res.status(500).json({ 
      message: "Failed to retrieve orders", 
      error: error.message 
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ 
        error: "Status is required" 
      });
    }

    const orderId = Number(order_id);
    if (isNaN(orderId)) {
      return res.status(400).json({ 
        error: "Invalid order ID" 
      });
    }

    const updatedOrder = await orderService.updateOrderStatus(orderId, status);

    return res.status(200).json({
      message: "Order status updated successfully",
      order: updatedOrder
    });

  } catch (error) {
    console.error("Error in updateOrderStatus controller:", error);
    
    if (error.message === "Order not found") {
      return res.status(404).json({ 
        message: "Order not found", 
        error: error.message 
      });
    }

    if (error.message.includes("Invalid status")) {
      return res.status(400).json({ 
        message: "Invalid status", 
        error: error.message 
      });
    }

    return res.status(500).json({ 
      message: "Failed to update order status", 
      error: error.message 
    });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { order_id } = req.params;

    const orderId = Number(order_id);
    if (isNaN(orderId)) {
      return res.status(400).json({ 
        error: "Invalid order ID" 
      });
    }

    const order = await orderService.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({ 
        error: "Order not found" 
      });
    }

    return res.status(200).json({
      message: "Order retrieved successfully",
      order
    });

  } catch (error) {
    console.error("Error in getOrderById controller:", error);
    return res.status(500).json({ 
      message: "Failed to retrieve order", 
      error: error.message 
    });
  }
};

// Get all orders (for admin or general use)
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, vendor_id, client_id, search } = req.query;

    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();

    const skip = (Number(page) - 1) * Number(limit);

    const where = {};

    // Add filters
    if (status) where.status = status;
    if (vendor_id) where.vendor_id = Number(vendor_id);
    if (client_id) where.client_id = Number(client_id);
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

    await prisma.$disconnect();

    return res.status(200).json({
      message: "Orders retrieved successfully",
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error("Error in getAllOrders controller:", error);
    return res.status(500).json({ 
      message: "Failed to retrieve orders", 
      error: error.message 
    });
  }
};

module.exports = {
  getOrdersByVendor,
  updateOrderStatus,
  getOrderById,
  getAllOrders
};