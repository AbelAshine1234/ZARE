const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkVendors() {
  try {
    console.log('🔍 Checking vendor information...\n');

    const vendors = await prisma.vendor.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true,
            phone_number: true
          }
        }
      }
    });

    console.log('📊 Vendors in database:');
    vendors.forEach(vendor => {
      console.log(`- ID: ${vendor.id}`);
      console.log(`  Name: ${vendor.name}`);
      console.log(`  User Email: ${vendor.user.email}`);
      console.log(`  User Name: ${vendor.user.name}`);
      console.log(`  Phone: ${vendor.user.phone_number}`);
      console.log('');
    });

    // Check orders for each vendor
    for (const vendor of vendors) {
      const orders = await prisma.order.findMany({
        where: { vendor_id: vendor.id },
        include: {
          client: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          },
          product: {
            select: {
              name: true,
              price: true
            }
          }
        }
      });

      console.log(`📋 Orders for ${vendor.name} (ID: ${vendor.id}):`);
      if (orders.length === 0) {
        console.log('  No orders found');
      } else {
        orders.forEach(order => {
          console.log(`  - Order #${order.id}: ${order.product.name} - $${order.total_amount} (${order.status})`);
        });
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVendors();
