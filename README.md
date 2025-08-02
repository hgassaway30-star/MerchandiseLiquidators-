# 🛒 E-Commerce Platform

A full-stack e-commerce platform built with Next.js, MongoDB, Upstash Redis, Stripe, and Cloudinary.

## ✨ Features

- 🔐 **JWT Authentication** with refresh tokens
- 👑 **Admin Dashboard** for product management
- 📦 **Product Management** with image uploads
- 🛍️ **Shopping Cart** with Redis caching
- 💳 **Stripe Payment** integration
- 🏷️ **Coupon System** with validation
- 📊 **Sales Analytics** for admins
- 🎨 **Responsive Design** with Tailwind CSS
- 🚀 **Performance Optimized** with caching
- 🛡️ **Security** best practices

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Cache**: Upstash Redis
- **Payments**: Stripe
- **Images**: Cloudinary
- **Authentication**: JWT with refresh tokens

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd ecommerce-platform
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

### 4. Configure Services

#### MongoDB
- Create a MongoDB Atlas account or use local MongoDB
- Get your connection string
- Update `MONGODB_URI` in `.env.local`

#### Upstash Redis
1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy the REST URL and Token
4. Update `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

#### Cloudinary
1. Create a [Cloudinary account](https://cloudinary.com/)
2. Get your Cloud Name, API Key, and API Secret from the dashboard
3. Update the Cloudinary variables in `.env.local`

#### Stripe
1. Create a [Stripe account](https://stripe.com/)
2. Get your publishable and secret keys from the dashboard
3. Update the Stripe variables in `.env.local`

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
├── components/          # React components
├── lib/                # Utility functions
│   ├── mongodb.js      # MongoDB connection
│   ├── redis.js        # Upstash Redis client
│   ├── auth.js         # JWT authentication
│   └── cloudinary.js   # Image upload utilities
├── models/             # MongoDB models
│   ├── User.js
│   ├── Product.js
│   ├── Category.js
│   ├── Order.js
│   └── Coupon.js
├── pages/
│   ├── api/           # API routes
│   │   ├── auth/      # Authentication endpoints
│   │   ├── admin/     # Admin-only endpoints
│   │   ├── products/  # Product endpoints
│   │   └── cart/      # Shopping cart endpoints
│   └── ...            # Next.js pages
└── styles/            # CSS styles
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Admin - Products
- `GET /api/admin/products` - Get all products (admin)
- `POST /api/admin/products` - Create product (admin)
- `PUT /api/admin/products/[id]` - Update product (admin)
- `DELETE /api/admin/products/[id]` - Delete product (admin)

### Admin - Categories
- `GET /api/admin/categories` - Get all categories (admin)
- `POST /api/admin/categories` - Create category (admin)
- `PUT /api/admin/categories/[id]` - Update category (admin)
- `DELETE /api/admin/categories/[id]` - Delete category (admin)

### Public
- `GET /api/products` - Get products (public)
- `GET /api/products/[id]` - Get single product
- `GET /api/categories` - Get categories
- `POST /api/cart` - Add to cart
- `GET /api/cart` - Get cart items
- `POST /api/checkout` - Create Stripe checkout session

## 🔐 Authentication

The platform uses JWT tokens with the following flow:

1. **Login/Register**: Returns access token (15min) and refresh token (7 days)
2. **Access Token**: Used for authenticated requests
3. **Refresh Token**: Stored in Upstash Redis, used to get new access tokens
4. **Logout**: Removes refresh token from Redis

### Protected Routes

- **Admin routes** require `role: 'admin'`
- **User routes** require valid JWT token
- **Public routes** accessible without authentication

## 🛍️ Admin Features

### Product Management
- Upload multiple images via Cloudinary
- Set product details, pricing, and inventory
- Manage product categories
- SEO optimization fields
- Product variants support

### Order Management
- View all orders
- Update order status
- Track payments
- Manage shipping

### Analytics
- Sales reports
- Product performance
- Customer insights

## 🎯 Performance Features

### Caching Strategy
- **Product caching**: 1 hour TTL
- **Category caching**: 2 hours TTL
- **Cart caching**: 24 hours TTL
- **Session management**: Configurable TTL

### Image Optimization
- Automatic WebP conversion
- Multiple image sizes (thumbnail, small, medium, large)
- Cloudinary transformations
- Lazy loading support

## 🛡️ Security Features

- Password hashing with bcrypt
- JWT token validation
- Role-based access control
- Rate limiting with Redis
- Input validation and sanitization
- CORS configuration
- Environment variable protection

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Environment Variables for Production

Make sure to set all environment variables in your deployment platform:

- `MONGODB_URI`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

## 📖 Usage Examples

### Creating an Admin User

```javascript
// Use MongoDB Compass or CLI to create an admin user
db.users.insertOne({
  firstName: "Admin",
  lastName: "User",
  email: "admin@example.com",
  password: "$2a$12$hashedpassword", // Use bcrypt to hash
  role: "admin",
  isEmailVerified: true,
  addresses: [],
  createdAt: new Date(),
  updatedAt: new Date()
});
```

### Adding Products via API

```javascript
const formData = new FormData();
formData.append('name', 'Product Name');
formData.append('description', 'Product description');
formData.append('price', '29.99');
formData.append('sku', 'PROD-001');
formData.append('category', 'category-id');
formData.append('images', imageFile1);
formData.append('images', imageFile2);

fetch('/api/admin/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: formData
});
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@yourstore.com or create an issue on GitHub.

---

**Built with ❤️ using Next.js and modern web technologies**