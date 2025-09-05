const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createSubscription = async (req, res) => {
  try {
    const { amount, plan, start_date, end_date, status } = req.body;

    const newSubscription = await prisma.subscription.create({
      data: {
        amount,
        plan,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        status,
      },
    });

    res.status(201).json({
      message: 'Subscription created successfully',
      subscription: newSubscription,
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ message: 'Failed to create subscription', error: error.message });
  }
};

const getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany();
    res.json(subscriptions);
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ message: 'Failed to get subscriptions', error: error.message });
  }
};

const getSubscriptionById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid subscription ID' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        vendors: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone_number: true
              }
            }
          }
        }
      }
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    res.json(subscription);
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ message: 'Failed to get subscription', error: error.message });
  }
};

const updateSubscription = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid subscription ID' });
    }

    const { amount, plan, start_date, end_date, status } = req.body;

    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        amount,
        plan,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        status,
      },
    });

    res.json({
      message: 'Subscription updated successfully',
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ message: 'Failed to update subscription', error: error.message });
  }
};

const deleteSubscription = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid subscription ID' });
    }

    await prisma.subscription.delete({ where: { id } });

    res.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Delete subscription error:', error);
    res.status(500).json({ message: 'Failed to delete subscription', error: error.message });
  }
};

const getSubscriptionDetails = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid subscription ID' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        vendors: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone_number: true
              }
            }
          }
        }
      }
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Calculate statistics
    const totalVendors = subscription.vendors.length;
    const activeVendors = subscription.vendors.filter(v => v.status).length;
    const approvedVendors = subscription.vendors.filter(v => v.is_approved).length;
    const totalRevenue = subscription.amount * totalVendors;

    const subscriptionDetails = {
      ...subscription,
      statistics: {
        totalVendors,
        activeVendors,
        approvedVendors,
        totalRevenue
      }
    };

    res.json(subscriptionDetails);
  } catch (error) {
    console.error('Get subscription details error:', error);
    res.status(500).json({ message: 'Failed to get subscription details', error: error.message });
  }
};

module.exports = {
  createSubscription,
  getAllSubscriptions,
  getSubscriptionById,
  getSubscriptionDetails,
  updateSubscription,
  deleteSubscription,
};
