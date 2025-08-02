import mongoose, { Schema } from 'mongoose';
import { ICategory } from '@/types';

const CategorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  description: {
    type: String,
    trim: true,
  },
  image: {
    type: String,
  },
  parentCategory: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    index: true,
  },
  subcategories: [{
    type: Schema.Types.ObjectId,
    ref: 'Category',
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
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
}, {
  timestamps: true,
});

// Index for hierarchical queries
CategorySchema.index({ parentCategory: 1, isActive: 1 });
CategorySchema.index({ sortOrder: 1 });

// Generate slug from name if not provided
CategorySchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  
  if (!this.seo.title) {
    this.seo.title = this.name.substring(0, 60);
  }
  
  if (!this.seo.description && this.description) {
    this.seo.description = this.description.substring(0, 160);
  }
  
  next();
});

// Virtual for full path (for breadcrumbs)
CategorySchema.virtual('fullPath').get(function () {
  // This would need to be populated with parent data in practice
  return this.name;
});

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);