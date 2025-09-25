# SJFulfillment Frontend

A comprehensive, modern frontend for the SJFulfillment platform built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Features

### Multi-User Role Support
- **SJFS Admin**: Complete platform management
- **Merchant Admin**: Business management and oversight
- **Merchant Staff**: Day-to-day operations
- **Warehouse Staff**: Inventory and fulfillment management

### Core Functionality
- **Authentication System**: JWT-based login with role-based access control
- **Dashboard**: Role-specific dashboards with relevant metrics and quick actions
- **Product Management**: Complete product catalog management
- **Inventory Management**: Real-time stock tracking and management
- **Order Management**: End-to-end order processing and tracking
- **Warehouse Management**: Multi-location warehouse support
- **Subscription Management**: Billing and subscription handling
- **Notifications**: Real-time alerts and updates
- **Responsive Design**: Mobile-first approach with full responsive support

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **State Management**: React Context API
- **HTTP Client**: Fetch API with custom hooks
- **Notifications**: React Hot Toast
- **Authentication**: JWT tokens with localStorage

## 📁 Project Structure

```
app/
├── components/           # Reusable UI components
│   ├── dashboard-layout.tsx
│   ├── sidebar.tsx
│   └── mobile-menu.tsx
├── lib/                 # Utility functions and hooks
│   ├── auth-context.tsx
│   ├── use-api.ts
│   └── utils.ts
├── admin/               # Admin-specific pages
│   └── dashboard/
├── merchant/            # Merchant-specific pages
│   └── dashboard/
├── staff/               # Staff-specific pages
│   └── dashboard/
├── warehouse/           # Warehouse-specific pages
│   └── dashboard/
├── login/               # Authentication pages
├── products/            # Product management
├── orders/              # Order management
├── inventory/           # Inventory management
├── warehouses/          # Warehouse management
├── subscriptions/        # Subscription management
├── notifications/       # Notifications
└── layout.tsx           # Root layout
```

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#3B82F6)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Error**: Red (#EF4444)
- **Neutral**: Gray scale

### Typography
- **Font Family**: Geist Sans & Geist Mono
- **Headings**: Bold weights (600-700)
- **Body**: Regular weight (400)

### Components
- **Cards**: White background with subtle shadows
- **Buttons**: Rounded corners with hover states
- **Forms**: Clean inputs with focus states
- **Tables**: Responsive with hover effects
- **Navigation**: Sidebar with mobile menu

## 🔐 Authentication Flow

1. **Login**: Users authenticate with email/password
2. **Token Storage**: JWT stored in localStorage
3. **Role-Based Routing**: Automatic redirect to appropriate dashboard
4. **Session Management**: Token validation and refresh
5. **Logout**: Token cleanup and redirect to login

## 📱 Responsive Design

- **Mobile First**: Designed for mobile devices first
- **Breakpoints**: 
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
- **Navigation**: Collapsible sidebar on mobile
- **Tables**: Horizontal scroll on small screens
- **Cards**: Stack vertically on mobile

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API running

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   JWT_SECRET=your-jwt-secret
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open browser**:
   Navigate to `http://localhost:3000`

## 🎯 User Roles & Access

### SJFS Admin
- **Dashboard**: Platform overview with all metrics
- **Merchants**: Manage all merchants
- **Products**: View all products across merchants
- **Orders**: Monitor all orders
- **Warehouses**: Manage warehouse locations
- **Subscriptions**: Handle billing and subscriptions
- **Logistics**: Manage logistics partners

### Merchant Admin
- **Dashboard**: Business metrics and overview
- **Products**: Manage product catalog
- **Inventory**: Track stock levels
- **Orders**: Process customer orders
- **Staff**: Manage team members
- **Subscriptions**: View billing information

### Merchant Staff
- **Dashboard**: Task-focused overview
- **Products**: View and update products
- **Inventory**: Stock management
- **Orders**: Order processing
- **Reports**: Generate business reports

### Warehouse Staff
- **Dashboard**: Inventory-focused metrics
- **Inventory**: Stock management
- **Orders**: Fulfillment processing
- **Warehouses**: Zone management
- **Logistics**: Shipping coordination

## 🔧 API Integration

The frontend integrates with the backend API through:

- **Custom Hooks**: `useApi` for HTTP requests
- **Authentication**: JWT token management
- **Error Handling**: Toast notifications for errors
- **Loading States**: Spinner components during requests

### API Endpoints Used
- `/api/auth/*` - Authentication
- `/api/products/*` - Product management
- `/api/orders/*` - Order management
- `/api/stock/*` - Inventory management
- `/api/warehouses/*` - Warehouse management
- `/api/subscriptions/*` - Subscription management
- `/api/notifications/*` - Notifications

## 🎨 Customization

### Styling
- Modify `tailwind.config.js` for theme customization
- Update color palette in component files
- Adjust spacing and typography in CSS classes

### Components
- Extend existing components in `/app/components/`
- Create new reusable components
- Follow existing patterns for consistency

### Navigation
- Update `navigationItems` in sidebar components
- Add new routes and permissions
- Modify role-based access logic

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically on push

### Deploy to Other Platforms
- **Netlify**: Use `npm run build` and deploy `out/` folder
- **AWS**: Use AWS Amplify or S3 + CloudFront
- **Docker**: Create Dockerfile and deploy to container platform

## 📊 Performance

- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Use `npm run analyze`
- **Lighthouse Score**: Optimized for 90+ scores

## 🔒 Security

- **JWT Tokens**: Secure authentication
- **Role-Based Access**: Frontend route protection
- **Input Validation**: Client-side validation
- **XSS Protection**: React's built-in protection
- **CSRF Protection**: SameSite cookies

## 🧪 Testing

### Manual Testing
- Test all user roles and permissions
- Verify responsive design on different devices
- Check API integration and error handling
- Validate form submissions and data flow

### Automated Testing (Future)
- Unit tests with Jest
- Integration tests with React Testing Library
- E2E tests with Playwright

## 📈 Future Enhancements

- **Real-time Updates**: WebSocket integration
- **Advanced Analytics**: Charts and reporting
- **Bulk Operations**: Mass product/order updates
- **Export Features**: PDF/Excel exports
- **Dark Mode**: Theme switching
- **PWA Support**: Offline capabilities
- **Multi-language**: Internationalization

## 🤝 Contributing

1. Follow existing code patterns
2. Use TypeScript for type safety
3. Write responsive components
4. Test on multiple devices
5. Update documentation

## 📞 Support

For issues or questions:
- Check existing documentation
- Review API documentation
- Contact development team

---

**Built with ❤️ for SJFulfillment Platform**
