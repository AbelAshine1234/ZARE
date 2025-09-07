const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyOrders() {
  try {
    console.log('🔍 Verifying seeded data...\n');

    // Count all records
    const [
      userCount,
      clientCount,
      vendorCount,
      categoryCount,
      subcategoryCount,
      productCount,
      orderCount,
      deliveryCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.client.count(),
      prisma.vendor.count(),
      prisma.category.count(),
      prisma.subcategory.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.delivery.count()
    ]);

    console.log('📊 Database Summary:');
    console.log(`- Users: ${userCount}`);
    console.log(`- Clients: ${clientCount}`);
    console.log(`- Vendors: ${vendorCount}`);
    console.log(`- Categories: ${categoryCount}`);
    console.log(`- Subcategories: ${subcategoryCount}`);
    console.log(`- Products: ${productCount}`);
    console.log(`- Orders: ${orderCount}`);
    console.log(`- Deliveries: ${deliveryCount}\n`);

    // Get order status distribution
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        status: true,
        total_amount: true,
        created_at: true,
        client: {
          select: {
            user: {
              select: {
                name: true,
                phone_number: true
              }
            }
          }
        },
        vendor: {
          select: {
            name: true
          }
        },
        product: {
          select: {
            name: true,
            price: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log('📋 Orders Details:');
    orders.forEach((order, index) => {
      console.log(`${index + 1}. Order #${order.id}`);
      console.log(`   Customer: ${order.client.user.name || order.client.user.phone_number}`);
      console.log(`   Vendor: ${order.vendor.name}`);
      console.log(`   Product: ${order.product.name} ($${order.product.price})`);
      console.log(`   Total: $${order.total_amount}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Date: ${order.created_at.toLocaleDateString()}`);
      console.log('');
    });

    // Order status distribution
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    console.log('📈 Order Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`- ${status}: ${count} orders`);
    });

    // Total revenue
    const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
    console.log(`\n💰 Total Revenue: $${totalRevenue.toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error verifying data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyOrders();
