import connectDB from '../../../../lib/mongodb.js';
import Product from '../../../../models/Product.js';
import Category from '../../../../models/Category.js';
import { authenticateRequest, requireAdminAccess } from '../../../../lib/auth.js';
import { uploadMultipleImages, deleteMultipleImages } from '../../../../lib/cloudinary.js';
import multer from 'multer';
import { promisify } from 'util';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

const uploadFields = upload.array('images', 10); // Max 10 images
const uploadFieldsAsync = promisify(uploadFields);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  try {
    await connectDB();

    // Authenticate and authorize
    const user = await authenticateRequest(req);
    requireAdminAccess(user);

    if (req.method === 'GET') {
      return await getProducts(req, res);
    } else if (req.method === 'POST') {
      return await createProduct(req, res);
    } else {
      return res.status(405).json({
        success: false,
        message: 'Method not allowed',
      });
    }
  } catch (error) {
    console.error('Products API error:', error);
    
    if (error.message === 'Access token required') {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
      });
    }
    
    if (error.message === 'Admin access required' || error.message === 'Invalid access token') {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

// GET /api/admin/products - Get all products with pagination
async function getProducts(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const status = req.query.status || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build filter query
    let filter = {};
    
    if (search) {
      filter.$text = { $search: search };
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (status) {
      filter.status = status;
    }

    // Get total count
    const total = await Product.countDocuments(filter);

    // Get products with pagination
    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
    });
  }
}

// POST /api/admin/products - Create new product
async function createProduct(req, res) {
  try {
    // Handle file upload
    await uploadFieldsAsync(req, res);

    const {
      name,
      description,
      shortDescription,
      price,
      comparePrice,
      costPrice,
      sku,
      barcode,
      trackQuantity,
      quantity,
      weight,
      dimensions,
      category,
      subcategory,
      tags,
      status,
      featured,
      seo,
    } = req.body;

    // Validation
    if (!name || !description || !shortDescription || !price || !sku || !category) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: name, description, shortDescription, price, sku, category',
      });
    }

    // Check if SKU already exists
    const existingSku = await Product.findOne({ sku });
    if (existingSku) {
      return res.status(400).json({
        success: false,
        message: 'SKU already exists',
      });
    }

    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Upload images to Cloudinary
    let images = [];
    if (req.files && req.files.length > 0) {
      try {
        const imageBuffers = req.files.map(file => 
          `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
        );
        
        const uploadedImages = await uploadMultipleImages(imageBuffers, 'products');
        
        images = uploadedImages.map((img, index) => ({
          url: img.url,
          public_id: img.public_id,
          alt: `${name} - Image ${index + 1}`,
          position: index,
        }));
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload images',
        });
      }
    }

    // Create product
    const product = new Product({
      name,
      description,
      shortDescription,
      price: parseFloat(price),
      comparePrice: comparePrice ? parseFloat(comparePrice) : undefined,
      costPrice: costPrice ? parseFloat(costPrice) : undefined,
      sku,
      barcode,
      trackQuantity: trackQuantity === 'true',
      quantity: trackQuantity === 'true' ? parseInt(quantity) || 0 : 0,
      weight: weight ? parseFloat(weight) : undefined,
      dimensions: dimensions ? (typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions) : undefined,
      category,
      subcategory,
      tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
      images,
      status: status || 'draft',
      featured: featured === 'true',
      seo: seo ? (typeof seo === 'string' ? JSON.parse(seo) : seo) : {},
    });

    await product.save();

    // Populate category for response
    await product.populate('category', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
    });
  }
}