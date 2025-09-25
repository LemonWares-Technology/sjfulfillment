# SJFulfillment API Setup Guide

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file with the following variables:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/sjfulfillment"
   JWT_SECRET="your-super-secret-jwt-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-nextauth-secret-here"
   ```

3. **Run database migrations:**
   ```bash
   npx prisma migrate dev
   ```

4. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

## API Testing

### Using curl

1. **Login:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@sjfulfillment.com","password":"admin123"}'
   ```

2. **Get products (with token):**
   ```bash
   curl -X GET http://localhost:3000/api/products \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

### Using Postman

1. Import the API collection (if available)
2. Set up environment variables:
   - `base_url`: http://localhost:3000/api
   - `token`: Your JWT token from login

## Database Seeding

Create initial data for testing:

```bash
# Create admin user
npx prisma db seed
```

## API Endpoints Overview

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (Admin only)
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile

### User Management
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/[id]` - Get user details
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Deactivate user

### Merchant Management
- `GET /api/merchants` - List merchants
- `POST /api/merchants` - Create merchant
- `GET /api/merchants/[id]` - Get merchant details
- `PUT /api/merchants/[id]` - Update merchant
- `DELETE /api/merchants/[id]` - Deactivate merchant

### Product Management
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/products/[id]` - Get product details
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Deactivate product

### Stock Management
- `GET /api/stock` - List stock items
- `POST /api/stock` - Create stock item
- `GET /api/stock/[id]` - Get stock details
- `PUT /api/stock/[id]` - Update stock
- `POST /api/stock/[id]/movements` - Record stock movement

### Order Management
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `GET /api/orders/[id]` - Get order details
- `PUT /api/orders/[id]` - Update order status
- `POST /api/orders/[id]/split` - Split order

### Warehouse Management
- `GET /api/warehouses` - List warehouses
- `POST /api/warehouses` - Create warehouse
- `GET /api/warehouses/[id]` - Get warehouse details
- `PUT /api/warehouses/[id]` - Update warehouse
- `DELETE /api/warehouses/[id]` - Deactivate warehouse
- `POST /api/warehouses/[id]/zones` - Create warehouse zone

### Subscription Management
- `GET /api/subscriptions` - List subscriptions
- `POST /api/subscriptions` - Create subscription
- `GET /api/subscriptions/[id]` - Get subscription details
- `PUT /api/subscriptions/[id]` - Update subscription
- `GET /api/service-plans` - Get service plans
- `GET /api/addon-services` - Get addon services

### Logistics Partner Management
- `GET /api/logistics-partners` - List logistics partners
- `POST /api/logistics-partners` - Create logistics partner
- `GET /api/logistics-partners/[id]` - Get partner details
- `PUT /api/logistics-partners/[id]` - Update partner
- `DELETE /api/logistics-partners/[id]` - Suspend partner
- `POST /api/logistics-partners/[id]/delivery-metrics` - Record delivery metrics

### Returns Management
- `GET /api/returns` - List returns
- `POST /api/returns` - Create return
- `GET /api/returns/[id]` - Get return details
- `PUT /api/returns/[id]` - Update return
- `DELETE /api/returns/[id]` - Delete return

### Notifications
- `GET /api/notifications` - List notifications
- `PUT /api/notifications/[id]/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all as read
- `POST /api/notifications` - Create notification

### Audit & Analytics
- `GET /api/audit-logs` - List audit logs (Admin only)
- `GET /api/audit-logs/[id]` - Get audit log details
- `GET /api/dashboard/stats` - Get dashboard statistics

## User Roles & Permissions

### SJFS_ADMIN
- Full access to all endpoints
- Can manage users, merchants, warehouses
- Can view all audit logs and analytics

### MERCHANT_ADMIN
- Can manage their merchant's data
- Can create and manage merchant staff
- Can view their merchant's orders, products, stock

### MERCHANT_STAFF
- Can view and update orders
- Can manage products and stock
- Limited access to merchant data

### WAREHOUSE_STAFF
- Can manage stock and inventory
- Can update order statuses
- Can manage warehouse operations

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

- 1000 requests per hour per user
- 100 requests per minute per user

## Pagination

List endpoints support pagination:
- `page`: Page number (1-based)
- `limit`: Items per page (max 100)

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npm run type-check
```

### Database Management
```bash
# View database in Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset

# Deploy migrations
npx prisma migrate deploy
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a production PostgreSQL database
3. Set strong JWT secrets
4. Configure proper CORS settings
5. Set up monitoring and logging
6. Use HTTPS in production

## Support

For API support and questions, contact the development team.
