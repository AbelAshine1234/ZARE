# Admin Product Management System

## Overview
The Admin Product Management System provides comprehensive tools for administrators to manage products, vendors, and inventory across the e-commerce platform. This system supports product approval workflows, bulk operations, image management, and detailed analytics.

## Features

### 🏪 **Product Management**
- View all products with advanced filtering
- Approve/reject pending products
- Update product details and status
- Comprehensive product analytics

### 📸 **Image Management**
- Upload multiple product images
- Delete specific images
- Update images using "keep images" system
- Automatic Cloudinary integration

### 📦 **Inventory Management**
- Bulk stock updates
- Stock level monitoring
- Out-of-stock management

### 👥 **Vendor Management**
- View products by vendor
- Approve/reject vendor applications
- Monitor vendor performance

### 📊 **Analytics & Reporting**
- Product statistics dashboard
- Category-wise breakdowns
- Recent product activity

## API Endpoints

### Authentication
All admin endpoints require `admin` user type authentication via JWT token.

### Dashboard & Statistics

#### Get Product Statistics
```http
GET /api/products/admin/dashboard/stats
```
**Response:**
```json
{
  "message": "Admin product statistics retrieved successfully",
  "stats": {
    "products": {
      "total": 150,
      "approved": 120,
      "pending": 25,
      "rejected": 5,
      "recent": 15
    },
    "vendors": {
      "total": 45,
      "active": 38
    },
    "categories": {
      "total": 12,
      "breakdown": [...]
    }
  }
}
```

#### Get All Products
```http
GET /api/products/admin/dashboard/all?page=1&limit=20&search=laptop&approved=false&sortBy=created_at&sortOrder=desc
```
**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search in product name, description, vendor name
- `vendor_id`: Filter by vendor ID
- `category_id`: Filter by category ID
- `status`: Filter by vendor status (true/false)
- `approved`: Filter by approval status (true/false)
- `sortBy`: Sort field (default: created_at)
- `sortOrder`: Sort order (asc/desc)

#### Get Pending Products
```http
GET /api/products/admin/dashboard/pending?page=1&limit=20
```

#### Get Products by Vendor
```http
GET /api/products/admin/dashboard/vendor/:vendorId?page=1&limit=20
```

### Product Details

#### Get Product Details
```http
GET /api/products/admin/:id
```
**Response includes:**
- Full product information
- Vendor details with owner info
- Category and subcategory details
- All images and videos
- Specifications
- Analytics (views, orders, ratings)

### Product Actions

#### Approve Product
```http
PUT /api/products/admin/:id/approve
```
**Action:** Sets vendor `is_approved: true` and `status: true`

#### Reject Product
```http
PUT /api/products/admin/:id/reject
```
**Body:**
```json
{
  "reason": "Optional rejection reason"
}
```
**Action:** Sets vendor `status: false`

#### Update Product Status
```http
PUT /api/products/admin/:id/status
```
**Body:**
```json
{
  "status": true,
  "reason": "Optional reason"
}
```
**Action:** Updates vendor status (activate/deactivate)

### Image Management

#### Update Product Images (Keep Images System)
```http
PUT /api/products/admin/:id/images
```
**Content-Type:** `multipart/form-data`

**Body:**
- `keepImages`: JSON string array of image IDs to keep (e.g., `"[1, 2, 3]"`)
- `images`: New image files to upload

**Process:**
1. Parses `keepImages` JSON array
2. Deletes images NOT in the keepImages array
3. Uploads new images to Cloudinary
4. Returns updated image list

**Example:**
```javascript
const formData = new FormData();
formData.append('keepImages', JSON.stringify([1, 3, 5])); // Keep images with IDs 1, 3, 5
formData.append('images', imageFile1);
formData.append('images', imageFile2);

fetch('/api/products/admin/123/images', {
  method: 'PUT',
  body: formData
});
```

#### Delete Specific Image
```http
DELETE /api/products/admin/:productId/images/:imageId
```

### Bulk Operations

#### Bulk Update Stock
```http
PUT /api/products/admin/bulk/stock
```
**Body:**
```json
{
  "updates": [
    { "product_id": 1, "stock": 50 },
    { "product_id": 2, "stock": 0 },
    { "product_id": 3, "stock": 25 }
  ]
}
```

#### Bulk Update Status
```http
PUT /api/products/admin/bulk/status
```
**Body:**
```json
{
  "product_ids": [1, 2, 3, 4, 5],
  "status": true
}
```
**Action:** Updates vendor status for all products' vendors

## Data Flow

### Product Creation Flow
1. **Vendor** creates product via `POST /api/products`
2. **System** sets vendor status to unapproved
3. **Admin** reviews via `GET /api/products/admin/dashboard/pending`
4. **Admin** approves via `PUT /api/products/admin/:id/approve`
5. **Vendor** can now sell the product

### Image Management Flow
1. **Admin** views product images via `GET /api/products/admin/:id`
2. **Admin** decides which images to keep
3. **Admin** sends `keepImages` array + new images via `PUT /api/products/admin/:id/images`
4. **System** deletes unwanted images and uploads new ones
5. **Product** has updated image set

### Inventory Management Flow
1. **Admin** monitors stock via dashboard APIs
2. **Admin** bulk updates stock via `PUT /api/products/admin/bulk/stock`
3. **System** updates stock levels for multiple products
4. **Frontend** shows updated stock to customers

## Security Features

- **Admin-only access** for all endpoints
- **Input validation** for all parameters
- **File upload validation** (size, type, count)
- **Ownership verification** for image operations
- **Bulk operation safety** checks

## Error Handling

All endpoints return consistent error responses:
```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `400`: Bad request (invalid parameters)
- `401`: Unauthorized (not admin)
- `403`: Forbidden (ownership issues)
- `404`: Not found (product/vendor doesn't exist)
- `500`: Internal server error

## Database Schema

### Key Tables
- `products`: Product information
- `vendors`: Vendor accounts
- `images`: Product images
- `categories`: Product categories
- `users`: User accounts

### Relationships
- Product → Vendor (many-to-one)
- Product → Category (many-to-one)
- Product → Images (one-to-many)
- Vendor → User (many-to-one)

## Frontend Integration

### Dashboard Components Needed
1. **Statistics Dashboard** - Charts and metrics
2. **Product List** - Filterable table with actions
3. **Product Detail Modal** - Full product information
4. **Image Manager** - Upload/delete with keepImages logic
5. **Bulk Actions Toolbar** - Stock updates, status changes

### API Integration Example
```javascript
// Get dashboard stats
const stats = await fetch('/api/products/admin/dashboard/stats', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});

// Update product images
const formData = new FormData();
formData.append('keepImages', JSON.stringify([1, 2]));
formData.append('images', newImageFile);

await fetch(`/api/products/admin/${productId}/images`, {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${adminToken}` },
  body: formData
});
```

## Performance Considerations

- **Pagination** on all list endpoints
- **Selective field loading** in queries
- **Batch operations** for bulk updates
- **Cloudinary integration** for image optimization
- **Database indexing** on frequently queried fields

## Monitoring & Maintenance

- **Error logging** for all operations
- **File upload monitoring** for storage usage
- **Stock level alerts** (can be added)
- **Vendor approval workflow tracking**

---

This system provides a complete admin interface for managing the product catalog, vendor relationships, and inventory in your e-commerce platform.
