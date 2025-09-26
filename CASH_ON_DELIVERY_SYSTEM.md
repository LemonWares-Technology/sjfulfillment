# Cash on Delivery Service System

## Overview

The SJFulfillment platform now operates on a **Cash on Delivery (COD)** model where merchants:

1. **Create and verify their account** (automatically approved)
2. **Select services** they want access to (with visible daily costs)
3. **Pay daily** for accumulated service costs via cash on delivery

## How It Works

### 1. Merchant Registration
- Merchants register their business account
- Account is automatically approved (no manual verification needed)
- After registration, merchants are directed to service selection

### 2. Service Selection
- Merchants can browse available services with **daily pricing**
- Each service shows:
  - Service name and description
  - Daily cost (e.g., ₦500/day)
  - Features included
  - Category (Core Services, Analytics, etc.)
- Merchants can select multiple services and adjust quantities
- Total daily cost is calculated and displayed

### 3. Daily Billing
- **Daily charges** are automatically calculated based on selected services
- Charges accumulate throughout the month
- **No upfront payment** required
- All charges are collected via **cash on delivery** when orders are fulfilled

### 4. Merchant Dashboard
Merchants can view:
- **Today's charges**: Current daily cost for selected services
- **Accumulated charges**: Total charges for the current month
- **Service breakdown**: Detailed view of each service and its daily cost
- **Payment method**: Clear indication that charges are collected via COD

## Available Services

| Service | Daily Cost | Category | Description |
|---------|------------|----------|-------------|
| Inventory Management | ₦500 | Core Services | Track stock levels, manage products |
| Order Processing | ₦300 | Core Services | Process orders, manage fulfillment |
| Warehouse Management | ₦400 | Core Services | Manage warehouse operations |
| Delivery Tracking | ₦200 | Logistics | Track deliveries, manage partners |
| Returns Management | ₦150 | Customer Service | Handle returns and refunds |
| Analytics Dashboard | ₦250 | Analytics | Business insights and reports |
| Staff Management | ₦100 | Administration | Manage staff and permissions |
| API Access | ₦350 | Integration | Programmatic platform access |

## Technical Implementation

### Database Models

#### Service Model
```prisma
model Service {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  price       Decimal  @db.Decimal(10, 2) // Daily price
  category    String
  features    Json     // Service features as JSON
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### MerchantServiceSubscription Model
```prisma
model MerchantServiceSubscription {
  id                  String             @id @default(cuid())
  merchantId          String
  serviceId           String
  quantity            Int                @default(1)
  priceAtSubscription Decimal            @db.Decimal(10, 2) // Daily price when subscribed
  status              SubscriptionStatus @default(ACTIVE)
  startDate           DateTime
  endDate             DateTime?
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt
}
```

#### BillingRecord Model (Updated)
- Added `DAILY_SERVICE_FEE` billing type
- Tracks daily service charges
- Status: PENDING (until collected via COD)

### API Endpoints

#### Daily Charges API
- `GET /api/billing/daily-charges` - Get merchant's daily charges
- `POST /api/billing/daily-charges` - Create daily billing records (admin only)

#### Service Management API
- `GET /api/services` - Get available services
- `POST /api/merchant-services/subscribe` - Subscribe to services

### Daily Billing Process

1. **Automated Daily Billing**: A cron job runs daily to create billing records
2. **Charge Calculation**: For each merchant with active services:
   - Calculate daily cost = Σ(service_price × quantity)
   - Create billing record with status PENDING
3. **Collection**: Charges are collected when orders are delivered (COD)
4. **Tracking**: Merchants can view accumulated charges in their dashboard

## Benefits

### For Merchants
- **No upfront costs** - Start using services immediately
- **Pay only for what you use** - Daily pricing model
- **Transparent pricing** - Clear daily costs for each service
- **Flexible service selection** - Add/remove services as needed
- **Cash flow friendly** - Pay when you receive money from customers

### For SJFulfillment
- **Reduced payment friction** - No complex payment processing
- **Better cash flow** - Collect fees when delivering orders
- **Lower transaction costs** - No online payment processing fees
- **Higher adoption** - Lower barrier to entry for merchants

## Usage Examples

### Example 1: Small E-commerce Store
- **Services**: Inventory Management (₦500) + Order Processing (₦300)
- **Daily Cost**: ₦800
- **Monthly Cost**: ₦24,000
- **Payment**: Collected when orders are delivered

### Example 2: Large Warehouse Operation
- **Services**: All Core Services + Analytics + API Access
- **Daily Cost**: ₦1,400
- **Monthly Cost**: ₦42,000
- **Payment**: Collected when orders are delivered

## Migration Notes

- Existing subscription models remain for backward compatibility
- New `Service` model added for individual service management
- `MerchantServiceSubscription` model for daily billing
- Updated billing types to include `DAILY_SERVICE_FEE`
- Service selection page updated to show daily pricing
- Merchant dashboard enhanced with daily charges section

## Future Enhancements

1. **Service Bundles**: Pre-defined service packages with discounts
2. **Usage-based Pricing**: Some services could have per-transaction pricing
3. **Payment Plans**: Option for weekly/monthly COD collection
4. **Service Analytics**: Track service usage and optimize pricing
5. **Automated Collections**: Integration with delivery partners for automatic fee collection

