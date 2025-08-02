import mongoose, { Schema } from 'mongoose';
import { ICoupon } from '@/types';

const CouponSchema = new Schema<ICoupon>({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed_amount', 'free_shipping'],
    required: true,
  },
  value: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    trim: true,
  },
  minimumAmount: {
    type: Number,
    min: 0,
  },
  maximumDiscount: {
    type: Number,
    min: 0,
  },
  usageLimit: {
    type: Number,
    min: 1,
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  userLimit: {
    type: Number,
    min: 1,
  },
  applicableProducts: [{
    type: Schema.Types.ObjectId,
    ref: 'Product',
  }],
  applicableCategories: [{
    type: String,
  }],
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
CouponSchema.index({ code: 1, isActive: 1 });
CouponSchema.index({ startDate: 1, endDate: 1 });

// Virtual for checking if coupon is valid by date
CouponSchema.virtual('isValidByDate').get(function () {
  const now = new Date();
  if (this.startDate && now < this.startDate) return false;
  if (this.endDate && now > this.endDate) return false;
  return true;
});

// Virtual for checking if coupon has usage left
CouponSchema.virtual('hasUsageLeft').get(function () {
  if (!this.usageLimit) return true;
  return this.usageCount < this.usageLimit;
});

// Method to check if coupon is valid
CouponSchema.methods.isValid = function () {
  return this.isActive && this.isValidByDate && this.hasUsageLeft;
};

// Method to calculate discount
CouponSchema.methods.calculateDiscount = function (subtotal: number) {
  if (!this.isValid()) return 0;
  
  if (this.minimumAmount && subtotal < this.minimumAmount) return 0;
  
  let discount = 0;
  
  switch (this.type) {
    case 'percentage':
      discount = (subtotal * this.value) / 100;
      if (this.maximumDiscount && discount > this.maximumDiscount) {
        discount = this.maximumDiscount;
      }
      break;
    case 'fixed_amount':
      discount = Math.min(this.value, subtotal);
      break;
    case 'free_shipping':
      // This would be handled in shipping calculation
      discount = 0;
      break;
  }
  
  return Math.round(discount * 100) / 100; // Round to 2 decimal places
};

export default mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);