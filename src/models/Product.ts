import mongoose, { Schema } from 'mongoose';
import { IProduct, IProductImage, IProductVariant } from '@/types';

const ProductImageSchema = new Schema<IProductImage>({
  url: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    required: true,
  },
  position: {
    type: Number,
    default: 0,
  },
});

const ProductVariantSchema = new Schema<IProductVariant>({
  name: {
    type: String,
    required: true,
  },
  values: [{
    type: String,
    required: true,
  }],
  price: {
    type: Number,
  },
  sku: {
    type: String,
  },
  quantity: {
    type: Number,
    default: 0,
  },
  image: {
    type: String,
  },
});

const ProductSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  description: {
    type: String,
    required: true,
  },
  shortDescription: {
    type: String,
    required: true,
    maxlength: 200,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    index: true,
  },
  comparePrice: {
    type: Number,
    min: 0,
  },
  costPrice: {
    type: Number,
    min: 0,
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  barcode: {
    type: String,
    trim: true,
  },
  trackQuantity: {
    type: Boolean,
    default: true,
  },
  quantity: {
    type: Number,
    default: 0,
    min: 0,
  },
  weight: {
    type: Number,
    min: 0,
  },
  dimensions: {
    length: {
      type: Number,
      min: 0,
    },
    width: {
      type: Number,
      min: 0,
    },
    height: {
      type: Number,
      min: 0,
    },
  },
  category: {
    type: String,
    required: true,
    index: true,
  },
  subcategory: {
    type: String,
    index: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  images: [ProductImageSchema],
  variants: [ProductVariantSchema],
  seo: {
    title: {
      type: String,
      maxlength: 60,
    },
    description: {
      type: String,
      maxlength: 160,
    },
    keywords: [{
      type: String,
    }],
  },
  status: {
    type: String,
    enum: ['active', 'draft', 'archived'],
    default: 'draft',
    index: true,
  },
  featured: {
    type: Boolean,
    default: false,
    index: true,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
});

// Indexes for search and filtering
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ price: 1, status: 1 });
ProductSchema.index({ featured: 1, status: 1 });
ProductSchema.index({ createdAt: -1 });

// Virtual for discounted price
ProductSchema.virtual('isOnSale').get(function () {
  return this.comparePrice && this.comparePrice > this.price;
});

ProductSchema.virtual('discountPercentage').get(function () {
  if (this.comparePrice && this.comparePrice > this.price) {
    return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
  }
  return 0;
});

// Virtual for availability
ProductSchema.virtual('inStock').get(function () {
  if (!this.trackQuantity) return true;
  return this.quantity > 0;
});

// Pre-save middleware to update SEO fields if not provided
ProductSchema.pre('save', function (next) {
  if (!this.seo.title) {
    this.seo.title = this.name.substring(0, 60);
  }
  if (!this.seo.description) {
    this.seo.description = this.shortDescription.substring(0, 160);
  }
  next();
});

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);