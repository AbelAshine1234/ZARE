# 🛠️ ZareShop Admin Dashboard

A comprehensive admin dashboard for managing the ZareShop e-commerce platform. Built with React, Material-UI, and modern web technologies.

## ✨ Features

### 🏠 Dashboard Overview
- **Real-time Statistics**: Users, vendors, products, orders, revenue
- **Interactive Charts**: Growth trends, user distribution, revenue analytics
- **Recent Activity**: Latest orders, pending deliveries, system alerts

### 👥 User Management
- **Complete User Control**: Clients, vendors, drivers, employees, admins
- **Advanced Filtering**: Search by name, email, phone, type, status
- **Bulk Operations**: Mass actions, status updates, user verification
- **Profile Management**: Edit user details, manage permissions, suspend/activate

### 🛍️ Product Management
- **Product Catalog**: Add, edit, delete products with rich metadata
- **Category Management**: Organize products with categories and subcategories
- **Inventory Control**: Stock management, price updates, product status
- **Media Management**: Product images, descriptions, specifications

### 📦 Order & Delivery Management
- **Order Processing**: View, edit, and manage customer orders
- **Delivery Tracking**: Monitor delivery status, assign drivers
- **Status Updates**: Real-time order status management
- **Customer Support**: Order history, issue resolution

### 💰 Financial Management
- **Wallet System**: Monitor user wallets, transactions, balances
- **Cash-out Requests**: Approve/reject vendor withdrawal requests
- **Transaction History**: Complete financial audit trail
- **Refund Management**: Process refunds, manage disputes

### 🚚 Driver Management
- **Driver Profiles**: Manage driver information, documents, status
- **Assignment System**: Assign deliveries, track performance
- **Document Verification**: License, insurance, vehicle information
- **Performance Metrics**: Delivery success rates, customer ratings

### 📢 Communication Tools
- **Complaint Management**: Handle customer and vendor complaints
- **Notification System**: Send system-wide announcements
- **Chat Support**: Real-time communication with users
- **Feedback System**: Collect and manage user feedback

### ⚙️ System Settings
- **Subscription Plans**: Manage vendor subscription tiers
- **Payment Methods**: Configure payment gateways, methods
- **System Configuration**: Platform settings, feature toggles
- **Security Settings**: Authentication, authorization, access control

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- ZareShop Backend API running on port 4000

### Installation

1. **Clone and Navigate**
   ```bash
   cd Zare/admin-dashboard
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

4. **Open Browser**
   Navigate to `http://localhost:3000`

### Environment Setup

The dashboard automatically connects to your ZareShop backend API. Make sure:

- Backend is running on `http://localhost:4000`
- Database is properly configured
- Admin user exists in the system

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   └── layout/         # Layout components (sidebar, header)
├── contexts/           # React contexts (auth, theme)
├── pages/              # Page components
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Main dashboard
│   ├── users/          # User management
│   ├── products/       # Product management
│   ├── orders/         # Order management
│   ├── finance/        # Financial management
│   ├── communication/  # Communication tools
│   └── settings/       # System settings
├── utils/              # Utility functions
├── App.js              # Main app component
└── index.js            # App entry point
```

## 🔧 Configuration

### API Endpoints

The dashboard automatically connects to these API endpoints:

- **Authentication**: `/api/auth/*`
- **Users**: `/api/users/*`
- **Products**: `/api/products/*`
- **Orders**: `/api/orders/*`
- **Vendors**: `/api/vendors/*`
- **Drivers**: `/api/drivers/*`
- **Financial**: `/api/wallet/*`, `/api/transactions/*`

### Customization

1. **Theme**: Modify `src/App.js` theme configuration
2. **API Base URL**: Update proxy in `package.json`
3. **Features**: Enable/disable features in `src/App.js` routes

## 📱 Responsive Design

- **Desktop**: Full-featured dashboard with sidebar navigation
- **Tablet**: Optimized layout for medium screens
- **Mobile**: Mobile-first responsive design with collapsible menu

## 🔐 Authentication

- **Login System**: Secure admin authentication
- **Session Management**: JWT token-based sessions
- **Role-based Access**: Admin-only features and permissions
- **Secure Logout**: Proper session cleanup

## 🎨 UI Components

Built with Material-UI (MUI) for consistent, professional design:

- **Data Grids**: Advanced table components with sorting, filtering, pagination
- **Forms**: Rich form components with validation
- **Charts**: Interactive charts using Recharts
- **Dialogs**: Modal dialogs for CRUD operations
- **Notifications**: Toast notifications and alerts

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables

```env
REACT_APP_API_URL=http://localhost:4000
REACT_APP_ENV=production
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## 📊 Performance

- **Code Splitting**: Route-based code splitting for faster loading
- **Lazy Loading**: Components loaded on demand
- **Optimized Bundles**: Tree shaking and minification
- **Caching**: Efficient data caching and state management

## 🔒 Security Features

- **XSS Protection**: Input sanitization and validation
- **CSRF Protection**: Token-based request validation
- **Secure Headers**: Content Security Policy implementation
- **Authentication**: JWT token validation and refresh

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs and feature requests via GitHub issues
- **Backend API**: Ensure your ZareShop backend is properly configured

## 🔄 Updates

Keep your dashboard updated:

```bash
# Update dependencies
npm update

# Check for outdated packages
npm outdated

# Update to latest versions
npm audit fix
```

---

**Built with ❤️ for ZareShop**

*Complete e-commerce management at your fingertips* 