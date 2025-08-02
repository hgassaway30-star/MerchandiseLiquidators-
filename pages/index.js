import Head from 'next/head';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Head>
        <title>E-Commerce Platform</title>
        <meta name="description" content="Full-stack e-commerce platform with Next.js, MongoDB, Upstash Redis, Stripe, and Cloudinary" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            🛒 E-Commerce Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A full-stack e-commerce solution built with Next.js, MongoDB, Upstash Redis, Stripe, and Cloudinary
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            <FeatureCard
              icon="🔐"
              title="JWT Authentication"
              description="Secure authentication with access and refresh tokens"
            />
            <FeatureCard
              icon="👑"
              title="Admin Dashboard"
              description="Complete product management with image uploads"
            />
            <FeatureCard
              icon="💳"
              title="Stripe Payments"
              description="Secure payment processing with Stripe integration"
            />
            <FeatureCard
              icon="🚀"
              title="Redis Caching"
              description="High-performance caching with Upstash Redis"
            />
            <FeatureCard
              icon="📸"
              title="Image Management"
              description="Cloudinary integration for optimized images"
            />
            <FeatureCard
              icon="🛍️"
              title="Shopping Cart"
              description="Persistent cart with Redis storage"
            />
          </div>

          <div className="mt-12">
            <a
              href="/api/health"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Check System Health
            </a>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            <p>API Endpoints:</p>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              <code className="bg-gray-200 px-2 py-1 rounded">POST /api/auth/register</code>
              <code className="bg-gray-200 px-2 py-1 rounded">POST /api/auth/login</code>
              <code className="bg-gray-200 px-2 py-1 rounded">GET /api/admin/products</code>
              <code className="bg-gray-200 px-2 py-1 rounded">GET /api/health</code>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}