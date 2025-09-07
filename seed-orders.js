const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Generate consistent password hashes
const clientPassword = 'password123';
const vendorPassword = 'vendor123';
const hashedClientPassword = bcrypt.hashSync(clientPassword, 10);
const hashedVendorPassword = bcrypt.hashSync(vendorPassword, 10);


// Sample data for seeding
const sampleUsers = [
  {
    name: 'John Doe',
    phone_number: '+251966666666',
    email: 'john.doe@example.com',
    type: 'client',
    is_verified: true,
    isotpVerified: true,
    password: hashedClientPassword,
  },
  {
    name: 'Jane Smith',
    phone_number: '+1234567891',
    email: 'jane.smith@example.com',
    type: 'client',
    is_verified: true,
    isotpVerified: true,
    password: hashedClientPassword,
  },
  {
    name: 'Mike Johnson',
    phone_number: '+1234567892',
    email: 'mike.johnson@example.com',
    type: 'client',
    is_verified: true,
    isotpVerified: true,
    password: hashedClientPassword,
  },
  {
    name: 'Sarah Wilson',
    phone_number: '+1234567893',
    email: 'sarah.wilson@example.com',
    type: 'client',
    is_verified: true,
    isotpVerified: true,
    password: hashedClientPassword,
  },
  {
    name: 'Tech Store Owner',
    phone_number: '+251966666667',
    email: 'owner@techstore.com',
    type: 'vendor_owner',
    is_verified: true,
    isotpVerified: true,
    password: hashedVendorPassword,
  },
  {
    name: 'Fashion Store Owner',
    phone_number: '+1234567895',
    email: 'owner@fashionstore.com',
    type: 'vendor_owner',
    is_verified: true,
    isotpVerified: true,
    password: hashedClientPassword,
  },
];

const sampleCategories = [
  {
    name: 'Electronics',
    description: 'Electronic devices and gadgets',
  },
  {
    name: 'Fashion',
    description: 'Clothing and accessories',
  },
  {
    name: 'Home & Garden',
    description: 'Home improvement and garden supplies',
  },
  {
    name: 'Sports',
    description: 'Sports equipment and accessories',
  },
];

const sampleSubcategories = [
  { name: 'Laptops', category_id: 1 },
  { name: 'Smartphones', category_id: 1 },
  { name: 'Headphones', category_id: 1 },
  { name: 'Men\'s Clothing', category_id: 2 },
  { name: 'Women\'s Clothing', category_id: 2 },
  { name: 'Shoes', category_id: 2 },
  { name: 'Furniture', category_id: 3 },
  { name: 'Kitchen', category_id: 3 },
  { name: 'Fitness', category_id: 4 },
  { name: 'Outdoor', category_id: 4 },
];

const sampleSubscriptions = [
  {
    amount: 99.99,
    plan: 'Basic',
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-12-31'),
    status: 'active',
  },
  {
    amount: 199.99,
    plan: 'Premium',
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-12-31'),
    status: 'active',
  },
];

const sampleVendors = [
  {
    name: 'Tech Store',
    type: 'business',
    description: 'Leading electronics retailer',
    status: true,
    is_approved: true,
    subscription_id: 1,
    user_id: 5, // Tech Store Owner
  },
  {
    name: 'Fashion Store',
    type: 'business',
    description: 'Trendy fashion and clothing',
    status: true,
    is_approved: true,
    subscription_id: 2,
    user_id: 6, // Fashion Store Owner
  },
];

const sampleProducts = [
  {
    name: 'MacBook Pro 16"',
    description: 'High-performance laptop for professionals',
    has_discount: false,
    stock: 50,
    price: 2499.99,
    stock_status: 'active',
    low_stock_threshold: 10,
    is_active: true,
    vendor_id: 1,
    category_id: 1,
    subcategory_id: 1,
  },
  {
    name: 'iPhone 15 Pro',
    description: 'Latest iPhone with advanced features',
    has_discount: true,
    stock: 100,
    price: 999.99,
    stock_status: 'active',
    low_stock_threshold: 15,
    is_active: true,
    vendor_id: 1,
    category_id: 1,
    subcategory_id: 2,
  },
  {
    name: 'Sony WH-1000XM5',
    description: 'Premium noise-canceling headphones',
    has_discount: false,
    stock: 75,
    price: 399.99,
    stock_status: 'active',
    low_stock_threshold: 10,
    is_active: true,
    vendor_id: 1,
    category_id: 1,
    subcategory_id: 3,
  },
  {
    name: 'Designer Jeans',
    description: 'Premium denim jeans for men',
    has_discount: false,
    stock: 200,
    price: 89.99,
    stock_status: 'active',
    low_stock_threshold: 20,
    is_active: true,
    vendor_id: 2,
    category_id: 2,
    subcategory_id: 4,
  },
  {
    name: 'Summer Dress',
    description: 'Elegant summer dress for women',
    has_discount: true,
    stock: 150,
    price: 79.99,
    stock_status: 'active',
    low_stock_threshold: 15,
    is_active: true,
    vendor_id: 2,
    category_id: 2,
    subcategory_id: 5,
  },
  {
    name: 'Running Shoes',
    description: 'Comfortable running shoes for all terrains',
    has_discount: false,
    stock: 80,
    price: 129.99,
    stock_status: 'active',
    low_stock_threshold: 10,
    is_active: true,
    vendor_id: 2,
    category_id: 2,
    subcategory_id: 6,
  },
];

const sampleOrders = [
  {
    quantity: 1,
    unit_price: 2499.99,
    total_amount: 2499.99,
    payment_method: 'wallet',
    status: 'new',
    client_id: 1,
    vendor_id: 1,
    product_id: 1,
    created_at: new Date('2024-01-15T10:30:00Z'),
  },
  {
    quantity: 2,
    unit_price: 999.99,
    total_amount: 1999.98,
    payment_method: 'external',
    status: 'processing',
    client_id: 2,
    vendor_id: 1,
    product_id: 2,
    created_at: new Date('2024-01-15T11:15:00Z'),
  },
  {
    quantity: 1,
    unit_price: 399.99,
    total_amount: 399.99,
    payment_method: 'cod',
    status: 'ready_to_delivery',
    client_id: 3,
    vendor_id: 1,
    product_id: 3,
    created_at: new Date('2024-01-15T14:20:00Z'),
  },
  {
    quantity: 3,
    unit_price: 89.99,
    total_amount: 269.97,
    payment_method: 'wallet',
    status: 'completed',
    client_id: 4,
    vendor_id: 2,
    product_id: 4,
    created_at: new Date('2024-01-14T09:45:00Z'),
  },
  {
    quantity: 1,
    unit_price: 79.99,
    total_amount: 79.99,
    payment_method: 'external',
    status: 'new',
    client_id: 1,
    vendor_id: 2,
    product_id: 5,
    created_at: new Date('2024-01-16T08:30:00Z'),
  },
  {
    quantity: 2,
    unit_price: 129.99,
    total_amount: 259.98,
    payment_method: 'cod',
    status: 'processing',
    client_id: 2,
    vendor_id: 2,
    product_id: 6,
    created_at: new Date('2024-01-16T12:15:00Z'),
  },
  {
    quantity: 1,
    unit_price: 2499.99,
    total_amount: 2499.99,
    payment_method: 'wallet',
    status: 'ready_to_delivery',
    client_id: 3,
    vendor_id: 1,
    product_id: 1,
    created_at: new Date('2024-01-16T15:30:00Z'),
  },
  {
    quantity: 1,
    unit_price: 999.99,
    total_amount: 999.99,
    payment_method: 'external',
    status: 'completed',
    client_id: 4,
    vendor_id: 1,
    product_id: 2,
    created_at: new Date('2024-01-14T16:45:00Z'),
  },
  {
    quantity: 1,
    unit_price: 399.99,
    total_amount: 399.99,
    payment_method: 'cod',
    status: 'new',
    client_id: 1,
    vendor_id: 1,
    product_id: 3,
    created_at: new Date('2024-01-17T10:00:00Z'),
  },
  {
    quantity: 2,
    unit_price: 79.99,
    total_amount: 159.98,
    payment_method: 'wallet',
    status: 'processing',
    client_id: 2,
    vendor_id: 2,
    product_id: 5,
    created_at: new Date('2024-01-17T11:30:00Z'),
  },
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data (in reverse order of dependencies)
    console.log('🧹 Clearing existing data...');
    await prisma.order.deleteMany();
    await prisma.delivery.deleteMany();
    await prisma.product.deleteMany();
    await prisma.vendorCategory.deleteMany();
    await prisma.vendor.deleteMany();
    await prisma.client.deleteMany();
    await prisma.wallet.deleteMany();
    await prisma.subcategory.deleteMany();
    await prisma.category.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.user.deleteMany();

    // Create users
    console.log('👥 Creating users...');
    const users = await Promise.all(
      sampleUsers.map(user => prisma.user.create({ data: user }))
    );
    console.log(`✅ Created ${users.length} users`);

    // Create subscriptions
    console.log('📋 Creating subscriptions...');
    const subscriptions = await Promise.all(
      sampleSubscriptions.map(sub => prisma.subscription.create({ data: sub }))
    );
    console.log(`✅ Created ${subscriptions.length} subscriptions`);

    // Create categories
    console.log('📂 Creating categories...');
    const categories = await Promise.all(
      sampleCategories.map(cat => prisma.category.create({ data: cat }))
    );
    console.log(`✅ Created ${categories.length} categories`);

    // Create subcategories
    console.log('📁 Creating subcategories...');
    const subcategories = await Promise.all(
      sampleSubcategories.map(sub => 
        prisma.subcategory.create({ 
          data: {
            ...sub,
            category_id: categories[sub.category_id - 1].id // Use actual category ID
          }
        })
      )
    );
    console.log(`✅ Created ${subcategories.length} subcategories`);

    // Create clients
    console.log('🛒 Creating clients...');
    const clients = await Promise.all(
      users.filter(u => u.type === 'client').map(user => 
        prisma.client.create({ 
          data: { 
            user_id: user.id,
            wallet_id: null // We'll create wallets separately if needed
          } 
        })
      )
    );
    console.log(`✅ Created ${clients.length} clients`);

    // Create vendors
    console.log('🏪 Creating vendors...');
    const vendors = await Promise.all(
      sampleVendors.map(vendor => 
        prisma.vendor.create({ 
          data: {
            ...vendor,
            subscription_id: subscriptions[vendor.subscription_id - 1].id, // Use actual subscription ID
            user_id: users[vendor.user_id - 1].id // Use actual user ID
          }
        })
      )
    );
    console.log(`✅ Created ${vendors.length} vendors`);

    // Create products
    console.log('📦 Creating products...');
    const products = await Promise.all(
      sampleProducts.map(product => 
        prisma.product.create({ 
          data: {
            ...product,
            vendor_id: vendors[product.vendor_id - 1].id, // Use actual vendor ID
            category_id: categories[product.category_id - 1].id, // Use actual category ID
            subcategory_id: subcategories[product.subcategory_id - 1].id // Use actual subcategory ID
          }
        })
      )
    );
    console.log(`✅ Created ${products.length} products`);

    // Create orders
    console.log('📋 Creating orders...');
    const orders = await Promise.all(
      sampleOrders.map(order => 
        prisma.order.create({ 
          data: {
            ...order,
            client_id: clients[order.client_id - 1].id, // Use actual client ID
            vendor_id: vendors[order.vendor_id - 1].id, // Use actual vendor ID
            product_id: products[order.product_id - 1].id // Use actual product ID
          }
        })
      )
    );
    console.log(`✅ Created ${orders.length} orders`);

    // Create some sample deliveries for ready_to_delivery and completed orders
    console.log('🚚 Creating deliveries...');
    const readyOrders = orders.filter(o => o.status === 'ready_to_delivery' || o.status === 'completed');
    const deliveries = await Promise.all(
      readyOrders.map(order => 
        prisma.delivery.create({
          data: {
            order_id: order.id,
            driver_id: 1, // Assuming driver with ID 1 exists
            delivery_status: order.status === 'completed' ? 'delivered' : 'assigned',
            delivered_at: order.status === 'completed' ? new Date() : null,
            client_confirmed: order.status === 'completed',
            tip_amount: 0.0,
          }
        })
      )
    );
    console.log(`✅ Created ${deliveries.length} deliveries`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Clients: ${clients.length}`);
    console.log(`- Vendors: ${vendors.length}`);
    console.log(`- Categories: ${categories.length}`);
    console.log(`- Subcategories: ${subcategories.length}`);
    console.log(`- Products: ${products.length}`);
    console.log(`- Orders: ${orders.length}`);
    console.log(`- Deliveries: ${deliveries.length}`);

    // Show order status distribution
    const orderStatusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📈 Order Status Distribution:');
    Object.entries(orderStatusCounts).forEach(([status, count]) => {
      console.log(`- ${status}: ${count} orders`);
    });

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
