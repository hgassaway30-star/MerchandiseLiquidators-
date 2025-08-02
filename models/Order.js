import mongoose, { Schema } from 'mongoose';
import { nanoid } from 'nanoid';

const OrderItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  variantId: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
  image: {
    url: String,
    public_id: String,
  },
  sku: {
    type: String,
  },
});

const AddressSchema = new Schema({
  type: {
    type: String,
    enum: ['shipping', 'billing'],
    required: true,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  company: {
    type: String,
    trim: true,
  },
  address1: {
    type: String,
    required: true,
    trim: true,
  },
  address2: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    required: true,
    trim: true,
  },
  state: {
    type: String,
    required: true,
    trim: true,
  },
  zipCode: {
    type: String,
    required: true,
    trim: true,
  },
  country: {
    type: String,
    required: true,
    trim: true,
    default: 'US',
  },
  phone: {
    type: String,
    trim: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
});

const OrderSchema = new Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    default: () => `ORD-${nanoid(10).toUpperCase()}`,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
    index: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
    index: true,
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'cash_on_delivery'],
    required: true,
  },
  paymentIntentId: {
    type: String,
    index: true,
  },
  items: [OrderItemSchema],
  shippingAddress: {
    type: AddressSchema,
    required: true,
  },
  billingAddress: {
    type: AddressSchema,
    required: true,
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  tax: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  shipping: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  discount: {
    type: Number,
    min: 0,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
  couponCode: {
    type: String,
    trim: true,
    uppercase: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  trackingNumber: {
    type: String,
    trim: true,
  },
  shippedAt: {
    type: Date,
  },
  deliveredAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ email: 1, createdAt: -1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ paymentIntentId: 1 });

// Virtual for total items count
OrderSchema.virtual('totalItems').get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Update status timestamps
OrderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'shipped' && !this.shippedAt) {
      this.shippedAt = new Date();
    }
    if (this.status === 'delivered' && !this.deliveredAt) {
      this.deliveredAt = new Date();
    }
  }
  next();
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);