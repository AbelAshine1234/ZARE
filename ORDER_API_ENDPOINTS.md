# Order API Endpoints

This document describes the order-related API endpoints that have been implemented.

## Base URL
All order endpoints are prefixed with `/api/orders`

## Endpoints

### 1. Get Orders by Vendor
**GET** `/api/orders/vendor/:vendor_id`

Retrieves all orders for a specific vendor with optional filtering and pagination.

#### Parameters
- `vendor_id` (path): The ID of the vendor
- `page` (query, optional): Page number for pagination (default: 1)
- `limit` (query, optional): Number of orders per page (default: 10)
- `status` (query, optional): Filter by order status (`new`, `processing`, `ready_to_delivery`, `completed`)
- `search` (query, optional): Search in product names or client names

#### Example Request
```
GET /api/orders/vendor/1?page=1&limit=10&status=processing&search=laptop
```

#### Response
```json
{
  "message": "Orders retrieved successfully",
  "orders": [
    {
      "id": 1,
      "quantity": 2,
      "unit_price": 1500.00,
      "total_amount": 3000.00,
      "payment_method": "wallet",
      "status": "processing",
      "created_at": "2024-01-15T10:30:00Z",
      "client": {
        "id": 1,
        "user": {
          "id": 1,
          "name": "John Doe",
          "phone_number": "+1234567890",
          "email": "john@example.com"
        }
      },
      "vendor": {
        "id": 1,
        "name": "Tech Store",
        "type": "business"
      },
      "product": {
        "id": 1,
        "name": "Gaming Laptop",
        "images": [...],
        "category": {
          "id": 1,
          "name": "Electronics"
        },
        "subcategory": {
          "id": 1,
          "name": "Laptops"
        }
      },
      "delivery": {
        "id": 1,
        "delivery_status": "not_assigned",
        "driver": null
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### 2. Update Order Status
**PATCH** `/api/orders/:order_id/status`

Updates the status of a specific order.

#### Parameters
- `order_id` (path): The ID of the order to update

#### Request Body
```json
{
  "status": "ready_to_delivery"
}
```

#### Valid Status Values
- `new`: Order just created
- `processing`: Order is being processed
- `ready_to_delivery`: Order is ready for delivery
- `completed`: Order has been completed

#### Example Request
```
PATCH /api/orders/1/status
Content-Type: application/json

{
  "status": "ready_to_delivery"
}
```

#### Response
```json
{
  "message": "Order status updated successfully",
  "order": {
    "id": 1,
    "quantity": 2,
    "unit_price": 1500.00,
    "total_amount": 3000.00,
    "payment_method": "wallet",
    "status": "ready_to_delivery",
    "created_at": "2024-01-15T10:30:00Z",
    "client": {
      "id": 1,
      "user": {
        "id": 1,
        "name": "John Doe",
        "phone_number": "+1234567890",
        "email": "john@example.com"
      }
    },
    "vendor": {
      "id": 1,
      "name": "Tech Store",
      "type": "business"
    },
    "product": {
      "id": 1,
      "name": "Gaming Laptop",
      "images": [...],
      "category": {
        "id": 1,
        "name": "Electronics"
      },
      "subcategory": {
        "id": 1,
        "name": "Laptops"
      }
    },
    "delivery": {
      "id": 1,
      "delivery_status": "not_assigned",
      "driver": null
    }
  }
}
```

### 3. Get Order by ID
**GET** `/api/orders/:order_id`

Retrieves a specific order by its ID.

#### Parameters
- `order_id` (path): The ID of the order

#### Example Request
```
GET /api/orders/1
```

#### Response
```json
{
  "message": "Order retrieved successfully",
  "order": {
    "id": 1,
    "quantity": 2,
    "unit_price": 1500.00,
    "total_amount": 3000.00,
    "payment_method": "wallet",
    "status": "ready_to_delivery",
    "created_at": "2024-01-15T10:30:00Z",
    "client": {
      "id": 1,
      "user": {
        "id": 1,
        "name": "John Doe",
        "phone_number": "+1234567890",
        "email": "john@example.com"
      }
    },
    "vendor": {
      "id": 1,
      "name": "Tech Store",
      "type": "business"
    },
    "product": {
      "id": 1,
      "name": "Gaming Laptop",
      "images": [...],
      "category": {
        "id": 1,
        "name": "Electronics"
      },
      "subcategory": {
        "id": 1,
        "name": "Laptops"
      }
    },
    "delivery": {
      "id": 1,
      "delivery_status": "not_assigned",
      "driver": null
    }
  }
}
```

### 4. Get All Orders
**GET** `/api/orders`

Retrieves all orders with optional filtering and pagination.

#### Query Parameters
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of orders per page (default: 10)
- `status` (optional): Filter by order status
- `vendor_id` (optional): Filter by vendor ID
- `client_id` (optional): Filter by client ID
- `search` (optional): Search in product names or client names

#### Example Request
```
GET /api/orders?page=1&limit=10&status=ready_to_delivery&vendor_id=1
```

#### Response
Same format as "Get Orders by Vendor" but includes all orders matching the filters.

## Error Responses

### 400 Bad Request
```json
{
  "message": "Invalid vendor ID",
  "error": "Invalid vendor ID"
}
```

### 404 Not Found
```json
{
  "message": "Order not found",
  "error": "Order not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Failed to retrieve orders",
  "error": "Database connection error"
}
```

## Status Flow

The order status follows this flow:
1. `new` → Order is created
2. `processing` → Order is being processed by vendor
3. `ready_to_delivery` → Order is ready for delivery
4. `completed` → Order has been delivered and completed

## Notes

- All endpoints return detailed order information including client, vendor, product, and delivery details
- Pagination is supported for list endpoints
- Search functionality works on product names and client names
- Status updates are validated to ensure only valid status transitions
- The API includes comprehensive error handling and validation
