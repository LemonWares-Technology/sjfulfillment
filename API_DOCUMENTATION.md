# SJFulfillment API Documentation

## Overview
The SJFulfillment API provides comprehensive endpoints for managing a B2B fulfillment platform. All endpoints require authentication via JWT tokens.

## Base URL
```
http://localhost:3000/api
```

## Authentication
All API requests require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## User Roles
- `SJFS_ADMIN`: Platform administrators
- `MERCHANT_ADMIN`: Business owners
- `MERCHANT_STAFF`: Business employees
- `WAREHOUSE_STAFF`: Warehouse operations team

## API Endpoints

### Authentication

#### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "MERCHANT_ADMIN",
      "merchantId": "merchant_id"
    },
    "token": "jwt_token"
  },
  "message": "Login successful"
}
```

#### POST /api/auth/register
Register a new user (Admin only).

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "MERCHANT_STAFF",
  "merchantId": "merchant_id"
}
```

#### POST /api/auth/logout
Logout and invalidate session.

#### GET /api/auth/me
Get current user profile.

### User Management

#### GET /api/users
Get list of users with pagination and filtering.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `role`: Filter by user role
- `merchantId`: Filter by merchant ID
- `isActive`: Filter by active status

#### POST /api/users
Create a new user.

#### GET /api/users/[id]
Get user by ID.

#### PUT /api/users/[id]
Update user information.

#### DELETE /api/users/[id]
Deactivate user (soft delete).

### Merchant Management

#### GET /api/merchants
Get list of merchants with pagination and filtering.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by onboarding status
- `city`: Filter by city
- `state`: Filter by state

#### POST /api/merchants
Create a new merchant.

**Request Body:**
```json
{
  "businessName": "ABC Company",
  "businessEmail": "contact@abccompany.com",
  "businessPhone": "+2348012345678",
  "contactPerson": "John Doe",
  "address": "123 Business Street",
  "city": "Lagos",
  "state": "Lagos",
  "country": "Nigeria",
  "cacNumber": "RC123456",
  "taxId": "TAX123456"
}
```

#### GET /api/merchants/[id]
Get merchant details with related data.

#### PUT /api/merchants/[id]
Update merchant information.

#### DELETE /api/merchants/[id]
Deactivate merchant (soft delete).

### Product Management

#### GET /api/products
Get list of products with pagination and filtering.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `category`: Filter by category
- `brand`: Filter by brand
- `isActive`: Filter by active status
- `search`: Search by name, SKU, or description

#### POST /api/products
Create a new product.

**Request Body:**
```json
{
  "sku": "PROD-001",
  "name": "Product Name",
  "description": "Product description",
  "category": "Electronics",
  "brand": "Brand Name",
  "weight": 1.5,
  "dimensions": {
    "length": 10,
    "width": 5,
    "height": 3
  },
  "unitPrice": 100.00,
  "hasExpiry": false,
  "isPerishable": false,
  "barcodeData": "123456789",
  "images": ["https://example.com/image1.jpg"]
}
```

#### GET /api/products/[id]
Get product details with stock information.

#### PUT /api/products/[id]
Update product information.

#### DELETE /api/products/[id]
Deactivate product (soft delete).

### Stock Management

#### GET /api/stock
Get list of stock items with pagination and filtering.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `warehouseId`: Filter by warehouse
- `productId`: Filter by product
- `lowStock`: Filter low stock items (true/false)
- `expired`: Filter expired items (true/false)

#### POST /api/stock
Create a new stock item.

**Request Body:**
```json
{
  "productId": "product_id",
  "warehouseId": "warehouse_id",
  "quantity": 100,
  "reorderLevel": 10,
  "maxStockLevel": 500,
  "batchNumber": "BATCH-001",
  "expiryDate": "2024-12-31T00:00:00Z",
  "location": "A-1-2",
  "costPrice": 50.00
}
```

#### GET /api/stock/[id]
Get stock item details with movement history.

#### PUT /api/stock/[id]
Update stock item quantities.

#### POST /api/stock/[id]/movements
Record stock movement.

**Request Body:**
```json
{
  "movementType": "STOCK_IN",
  "quantity": 50,
  "reason": "Restock",
  "notes": "Monthly restock",
  "referenceType": "PURCHASE",
  "referenceId": "purchase_id"
}
```

### Order Management

#### GET /api/orders
Get list of orders with pagination and filtering.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by order status
- `warehouseId`: Filter by warehouse
- `paymentMethod`: Filter by payment method
- `dateFrom`: Filter from date
- `dateTo`: Filter to date
- `search`: Search by order number, customer name, email, or phone

#### POST /api/orders
Create a new order.

**Request Body:**
```json
{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+2348012345678",
  "shippingAddress": {
    "street": "123 Customer Street",
    "city": "Lagos",
    "state": "Lagos",
    "country": "Nigeria",
    "postalCode": "100001"
  },
  "orderValue": 500.00,
  "deliveryFee": 50.00,
  "paymentMethod": "COD",
  "notes": "Handle with care",
  "items": [
    {
      "productId": "product_id",
      "quantity": 2,
      "unitPrice": 250.00
    }
  ]
}
```

#### GET /api/orders/[id]
Get order details with items and status history.

#### PUT /api/orders/[id]
Update order status.

**Request Body:**
```json
{
  "status": "SHIPPED",
  "notes": "Order shipped via DHL",
  "trackingNumber": "DHL123456789",
  "expectedDelivery": "2024-01-15T00:00:00Z"
}
```

#### POST /api/orders/[id]/split
Split order across multiple warehouses.

### Warehouse Management

#### GET /api/warehouses
Get list of warehouses with capacity and stock information.

#### POST /api/warehouses
Create a new warehouse.

**Request Body:**
```json
{
  "name": "Lagos Main Warehouse",
  "code": "LAG-001",
  "address": "123 Warehouse Street",
  "city": "Lagos",
  "state": "Lagos",
  "country": "Nigeria",
  "capacity": 10000,
  "managerId": "user_id"
}
```

#### GET /api/warehouses/[id]
Get warehouse details with zones and stock.

#### PUT /api/warehouses/[id]
Update warehouse information.

#### DELETE /api/warehouses/[id]
Deactivate warehouse (soft delete).

#### POST /api/warehouses/[id]/zones
Create a new warehouse zone.

### Subscription Management

#### GET /api/subscriptions
Get list of subscriptions with billing information.

#### POST /api/subscriptions
Create a new subscription.

**Request Body:**
```json
{
  "merchantId": "merchant_id",
  "servicePlanId": "plan_id",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T00:00:00Z",
  "addons": [
    {
      "addonServiceId": "addon_id",
      "quantity": 1
    }
  ]
}
```

#### GET /api/subscriptions/[id]
Get subscription details with billing records.

#### PUT /api/subscriptions/[id]
Update subscription status.

#### GET /api/service-plans
Get available service plans.

#### GET /api/addon-services
Get available addon services.

### Logistics Partner Management

#### GET /api/logistics-partners
Get list of logistics partners with performance metrics.

#### POST /api/logistics-partners
Create a new logistics partner.

**Request Body:**
```json
{
  "companyName": "DHL Nigeria",
  "contactPerson": "Jane Smith",
  "email": "contact@dhl.com",
  "phone": "+2348012345678",
  "address": "123 Logistics Street",
  "city": "Lagos",
  "state": "Lagos",
  "cacNumber": "RC789012",
  "coverageAreas": ["Lagos", "Abuja", "Port Harcourt"],
  "guarantors": {
    "name": "Guarantor Name",
    "phone": "+2348012345678",
    "address": "123 Guarantor Street",
    "relationship": "Director"
  }
}
```

#### GET /api/logistics-partners/[id]
Get logistics partner details with delivery metrics.

#### PUT /api/logistics-partners/[id]
Update logistics partner information.

#### DELETE /api/logistics-partners/[id]
Suspend logistics partner.

#### POST /api/logistics-partners/[id]/delivery-metrics
Record delivery performance metrics.

### Returns Management

#### GET /api/returns
Get list of returns with filtering.

#### POST /api/returns
Create a new return request.

**Request Body:**
```json
{
  "orderId": "order_id",
  "reason": "DAMAGED",
  "description": "Product arrived damaged",
  "refundAmount": 250.00,
  "restockable": false
}
```

#### GET /api/returns/[id]
Get return details with order information.

#### PUT /api/returns/[id]
Update return status and process refund/restock.

#### DELETE /api/returns/[id]
Delete return (only if not processed).

### Notifications

#### GET /api/notifications
Get user notifications with pagination.

#### PUT /api/notifications/[id]/read
Mark notification as read.

#### PUT /api/notifications/read-all
Mark all notifications as read.

#### POST /api/notifications
Create a new notification.

### Audit & Analytics

#### GET /api/audit-logs
Get audit logs with filtering (Admin only).

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `userId`: Filter by user ID
- `entityType`: Filter by entity type
- `action`: Filter by action
- `dateFrom`: Filter from date
- `dateTo`: Filter to date

#### GET /api/audit-logs/[id]
Get specific audit log entry.

#### GET /api/dashboard/stats
Get dashboard statistics and metrics.

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

API requests are rate-limited to prevent abuse. Current limits:
- 1000 requests per hour per user
- 100 requests per minute per user

## Pagination

List endpoints support pagination with the following parameters:
- `page`: Page number (1-based)
- `limit`: Items per page (max 100)

Response includes pagination metadata:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## Webhooks

The API supports webhooks for real-time notifications:
- Order status changes
- Low stock alerts
- Payment confirmations
- Delivery updates

Configure webhooks in the merchant dashboard.
