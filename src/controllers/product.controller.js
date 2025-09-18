const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { imageUploadQueue, videoUploadQueue } = require("../config/queue.config");

// Generic image uploader with queue processing
const uploadImages = async (files, fields, productId) => {
  const uploaded = {};
  for (const field of fields) {
    if (files[field]) {
      // Add jobs to queue for background processing
      const jobPromises = files[field].map(async (file) => {
        // Validate file size (max 10MB for images)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          throw new Error(`Image file ${file.originalname} is too large. Maximum size is 10MB.`);
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
          throw new Error(`Image file ${file.originalname} has unsupported format. Allowed formats: JPEG, JPG, PNG, GIF, WEBP`);
        }

        // Add to queue for background processing
        const job = await imageUploadQueue.add('single-image', {
          fileBuffer: file.buffer,
          fileName: file.originalname,
          productId,
          fieldName: field
        }, {
          priority: 1,
          delay: 0,
          attempts: 3
        });

        return {
          jobId: job.id,
          fileName: file.originalname,
          status: 'queued',
          message: 'Image upload queued for processing'
        };
      });

      const results = await Promise.all(jobPromises);
      uploaded[field] = results;
    }
  }
  return uploaded;
};

// Generic video uploader with queue processing
const uploadVideos = async (files, fields, productId) => {
  const uploaded = {};
  for (const field of fields) {
    if (files[field]) {
      // Add jobs to queue for background processing
      const jobPromises = files[field].map(async (file) => {
        // Validate file size (max 100MB for videos)
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) {
          throw new Error(`Video file ${file.originalname} is too large. Maximum size is 100MB.`);
        }

        // Validate file type
        const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'];
        if (!allowedTypes.includes(file.mimetype)) {
          throw new Error(`Video file ${file.originalname} has unsupported format. Allowed formats: MP4, AVI, MOV, WMV, FLV, WEBM`);
        }

        // Add to queue for background processing
        const job = await videoUploadQueue.add('single-video', {
          fileBuffer: file.buffer,
          fileName: file.originalname,
          productId,
          fieldName: field
        }, {
          priority: 1,
          delay: 0,
          attempts: 3
        });

        return {
          jobId: job.id,
          fileName: file.originalname,
          status: 'queued',
          message: 'Video upload queued for processing'
        };
      });

      const results = await Promise.all(jobPromises);
      uploaded[field] = results;
    }
  }
  return uploaded;
};

// Create product
const createProduct = async (req, res) => {
  try {
    let { 
      name, 
      description, 
      has_discount, 
      sold_in_bulk,
      stock, 
      vendor_id, 
      category_id, 
      subcategory_id, 
      specs 
    } = req.body;

    // Convert string values to appropriate types
    vendor_id = Number(vendor_id);
    category_id = Number(category_id);
    subcategory_id = Number(subcategory_id);
    stock = Number(stock);
    has_discount = has_discount === 'true' || has_discount === true;
    sold_in_bulk = sold_in_bulk === 'true' || sold_in_bulk === true;

    // Validate required fields
    if (isNaN(vendor_id)) return res.status(400).json({ error: "Invalid vendor ID" });
    if (isNaN(category_id)) return res.status(400).json({ error: "Invalid category ID" });
    if (isNaN(subcategory_id)) return res.status(400).json({ error: "Invalid subcategory ID" });
    if (isNaN(stock)) return res.status(400).json({ error: "Invalid stock value" });

    // Check if vendor exists
    const vendorExists = await prisma.vendor.findUnique({ where: { id: vendor_id } });
    if (!vendorExists) return res.status(404).json({ error: `Vendor with id ${vendor_id} does not exist.` });

    // Check if category exists
    const categoryExists = await prisma.category.findUnique({ where: { id: category_id } });
    if (!categoryExists) return res.status(404).json({ error: `Category with id ${category_id} does not exist.` });

    // Check if subcategory exists and belongs to the category
    const subcategoryExists = await prisma.subcategory.findFirst({
      where: { 
        id: subcategory_id,
        category_id: category_id
      }
    });
    if (!subcategoryExists) return res.status(404).json({ error: `Subcategory with id ${subcategory_id} does not exist or does not belong to the specified category.` });

    // Parse specs if sent as string
    if (specs && typeof specs === "string") {
      try {
        specs = JSON.parse(specs);
      } catch {
        return res.status(400).json({ error: "Invalid specs format" });
      }
    }

    // Process files immediately for faster response
    let imageRecords = [];
    let videoRecords = [];
    
    if (req.files && Object.keys(req.files).length > 0) {
      // Process images immediately
      if (req.files.images) {
        for (const file of req.files.images) {
          // Validate file size (max 10MB for images)
          const maxSize = 10 * 1024 * 1024; // 10MB
          if (file.size > maxSize) {
            throw new Error(`Image file ${file.originalname} is too large. Maximum size is 10MB.`);
          }

          // Validate file type
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
          if (!allowedTypes.includes(file.mimetype)) {
            throw new Error(`Image file ${file.originalname} has unsupported format. Allowed formats: JPEG, JPG, PNG, GIF, WEBP`);
          }

          // Create placeholder record immediately
          const imageRecord = await prisma.image.create({
            data: {
              image_url: `pending_${Date.now()}_${file.originalname}`, // Temporary placeholder
              product_id: null, // Will be updated after product creation
            }
          });
          imageRecords.push({ ...imageRecord, originalFile: file });
        }
      }
      
      // Process videos immediately
      if (req.files.videos) {
        for (const file of req.files.videos) {
          // Validate file size (max 100MB for videos)
          const maxSize = 100 * 1024 * 1024; // 100MB
          if (file.size > maxSize) {
            throw new Error(`Video file ${file.originalname} is too large. Maximum size is 100MB.`);
          }

          // Validate file type
          const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'];
          if (!allowedTypes.includes(file.mimetype)) {
            throw new Error(`Video file ${file.originalname} has unsupported format. Allowed formats: MP4, AVI, MOV, WMV, FLV, WEBM`);
          }

          // Create placeholder record immediately
          const videoRecord = await prisma.video.create({
            data: {
              video_url: `pending_${Date.now()}_${file.originalname}`, // Temporary placeholder
              product_id: null, // Will be updated after product creation
            }
          });
          videoRecords.push({ ...videoRecord, originalFile: file });
        }
      }
    }

    // Create product with placeholder file references
    const product = await prisma.product.create({
      data: {
        name,
        description,
        has_discount,
        sold_in_bulk,
        stock,
        vendor: { connect: { id: vendor_id } },
        category: { connect: { id: category_id } },
        subcategory: { connect: { id: subcategory_id } },
        specs: specs?.length ? { create: specs } : undefined,
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        },
        category: {
          select: {
            id: true,
            name: true,
          }
        },
        subcategory: {
          select: {
            id: true,
            name: true,
          }
        },
        specs: true,
        rating: true,
        images: true,
        videos: true,
      },
    });

    // Update file records with product ID and queue for background processing
    let uploadJobs = [];
    
    if (imageRecords.length > 0) {
      // Update image records with product ID
      for (const record of imageRecords) {
        await prisma.image.update({
          where: { id: record.id },
          data: { product_id: product.id }
        });
        
        // Add to queue for background processing
        const job = await imageUploadQueue.add('single-image', {
          fileBuffer: record.originalFile.buffer.toString('base64'),
          fileName: record.originalFile.originalname,
          productId: product.id,
          fieldName: 'images',
          imageRecordId: record.id
        }, {
          priority: 1,
          delay: 0,
          attempts: 3
        });

        uploadJobs.push({
          jobId: job.id,
          fileName: record.originalFile.originalname,
          status: 'queued',
          message: 'Image upload queued for processing',
          recordId: record.id
        });
      }
    }
    
    if (videoRecords.length > 0) {
      // Update video records with product ID
      for (const record of videoRecords) {
        await prisma.video.update({
          where: { id: record.id },
          data: { product_id: product.id }
        });
        
        // Add to queue for background processing
        const job = await videoUploadQueue.add('single-video', {
          fileBuffer: record.originalFile.buffer.toString('base64'),
          fileName: record.originalFile.originalname,
          productId: product.id,
          fieldName: 'videos',
          videoRecordId: record.id
        }, {
          priority: 1,
          delay: 0,
          attempts: 3
        });

        uploadJobs.push({
          jobId: job.id,
          fileName: record.originalFile.originalname,
          status: 'queued',
          message: 'Video upload queued for processing',
          recordId: record.id
        });
      }
    }

    // Fetch the complete product with files
    const completeProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        },
        category: {
          select: {
            id: true,
            name: true,
          }
        },
        subcategory: {
          select: {
            id: true,
            name: true,
          }
        },
        images: true,
        videos: true,
        specs: true,
        rating: true,
      },
    });

    return res.status(201).json({ 
      message: "Product created successfully", 
      product: completeProduct,
      uploadJobs: {
        total: uploadJobs.length,
        jobs: uploadJobs,
        message: "Files are being processed in the background"
      }
    });

  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({ 
      message: "Failed to create product", 
      error: error.message 
    });
  }
};

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category_id, vendor_id, search } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const where = {};
    
    if (category_id) {
      where.category_id = Number(category_id);
    }
    
    if (vendor_id) {
      where.vendor_id = Number(vendor_id);
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        },
        category: {
          select: {
            id: true,
            name: true,
          }
        },
        subcategory: {
          select: {
            id: true,
            name: true,
          }
        },
        images: true,
        videos: true,
        specs: true,
        rating: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const total = await prisma.product.count({ where });

    return res.status(200).json({
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });

  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ 
      message: "Failed to fetch products", 
      error: error.message 
    });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const productId = Number(id);

    if (isNaN(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        },
        category: {
          select: {
            id: true,
            name: true,
          }
        },
        subcategory: {
          select: {
            id: true,
            name: true,
          }
        },
        images: true,
        videos: true,
        specs: true,
        rating: true,
      },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.status(200).json({ product });

  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({ 
      message: "Failed to fetch product", 
      error: error.message 
    });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productId = Number(id);

    if (isNaN(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    let { 
      name, 
      description, 
      has_discount, 
      sold_in_bulk,
      stock, 
      category_id, 
      subcategory_id, 
      specs 
    } = req.body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Convert string values to appropriate types
    if (category_id) category_id = Number(category_id);
    if (subcategory_id) subcategory_id = Number(subcategory_id);
    if (stock) stock = Number(stock);
    if (has_discount !== undefined) has_discount = has_discount === 'true' || has_discount === true;
    if (sold_in_bulk !== undefined) sold_in_bulk = sold_in_bulk === 'true' || sold_in_bulk === true;

    // Validate category and subcategory if provided
    if (category_id && isNaN(category_id)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    if (subcategory_id && isNaN(subcategory_id)) {
      return res.status(400).json({ error: "Invalid subcategory ID" });
    }

    if (stock && isNaN(stock)) {
      return res.status(400).json({ error: "Invalid stock value" });
    }

    // Check if category exists
    if (category_id) {
      const categoryExists = await prisma.category.findUnique({ where: { id: category_id } });
      if (!categoryExists) return res.status(404).json({ error: `Category with id ${category_id} does not exist.` });
    }

    // Check if subcategory exists and belongs to the category
    if (subcategory_id) {
      const subcategoryExists = await prisma.subcategory.findFirst({
        where: { 
          id: subcategory_id,
          category_id: category_id || existingProduct.category_id
        }
      });
      if (!subcategoryExists) return res.status(404).json({ error: `Subcategory with id ${subcategory_id} does not exist or does not belong to the specified category.` });
    }

    // Parse specs if sent as string
    if (specs && typeof specs === "string") {
      try {
        specs = JSON.parse(specs);
      } catch {
        return res.status(400).json({ error: "Invalid specs format" });
      }
    }

    // Prepare update data
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (has_discount !== undefined) updateData.has_discount = has_discount;
    if (sold_in_bulk !== undefined) updateData.sold_in_bulk = sold_in_bulk;
    if (stock !== undefined) updateData.stock = stock;
    if (category_id) updateData.category = { connect: { id: category_id } };
    if (subcategory_id) updateData.subcategory = { connect: { id: subcategory_id } };

    // Update specs if provided
    if (specs) {
      // Delete existing specs and create new ones
      await prisma.spec.deleteMany({ where: { product_id: productId } });
      if (specs.length > 0) {
        updateData.specs = { create: specs };
      }
    }

    // Update the product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        },
        category: {
          select: {
            id: true,
            name: true,
          }
        },
        subcategory: {
          select: {
            id: true,
            name: true,
          }
        },
        specs: true,
        rating: true,
        images: true,
        videos: true,
      },
    });

    // Process file uploads in background using Bull Queue
    let uploadJobs = [];
    
    if (req.files && Object.keys(req.files).length > 0) {
      try {
        // Process images immediately
        if (req.files.images) {
          for (const file of req.files.images) {
            // Validate file size (max 10MB for images)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
              throw new Error(`Image file ${file.originalname} is too large. Maximum size is 10MB.`);
            }

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.mimetype)) {
              throw new Error(`Image file ${file.originalname} has unsupported format. Allowed formats: JPEG, JPG, PNG, GIF, WEBP`);
            }

            // Create placeholder record immediately
            const imageRecord = await prisma.image.create({
              data: {
                image_url: `pending_${Date.now()}_${file.originalname}`, // Temporary placeholder
                product_id: productId,
              }
            });

            // Add to queue for background processing
            const job = await imageUploadQueue.add('single-image', {
              fileBuffer: file.buffer.toString('base64'),
              fileName: file.originalname,
              productId: productId,
              fieldName: 'images',
              imageRecordId: imageRecord.id
            }, {
              priority: 1,
              delay: 0,
              attempts: 3
            });

            uploadJobs.push({
              jobId: job.id,
              fileName: file.originalname,
              status: 'queued',
              message: 'Image upload queued for processing',
              recordId: imageRecord.id
            });
          }
        }
        
        // Process videos immediately
        if (req.files.videos) {
          for (const file of req.files.videos) {
            // Validate file size (max 100MB for videos)
            const maxSize = 100 * 1024 * 1024; // 100MB
            if (file.size > maxSize) {
              throw new Error(`Video file ${file.originalname} is too large. Maximum size is 100MB.`);
            }

            // Validate file type
            const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'];
            if (!allowedTypes.includes(file.mimetype)) {
              throw new Error(`Video file ${file.originalname} has unsupported format. Allowed formats: MP4, AVI, MOV, WMV, FLV, WEBM`);
            }

            // Create placeholder record immediately
            const videoRecord = await prisma.video.create({
              data: {
                video_url: `pending_${Date.now()}_${file.originalname}`, // Temporary placeholder
                product_id: productId,
              }
            });

            // Add to queue for background processing
            const job = await videoUploadQueue.add('single-video', {
              fileBuffer: file.buffer.toString('base64'),
              fileName: file.originalname,
              productId: productId,
              fieldName: 'videos',
              videoRecordId: videoRecord.id
            }, {
              priority: 1,
              delay: 0,
              attempts: 3
            });

            uploadJobs.push({
              jobId: job.id,
              fileName: file.originalname,
              status: 'queued',
              message: 'Video upload queued for processing',
              recordId: videoRecord.id
            });
          }
        }
      } catch (uploadError) {
        console.error('Error queuing uploads:', uploadError);
        // Don't fail the product update, just log the error
      }
    }

    // Fetch the complete updated product with files
    const completeUpdatedProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        },
        category: {
          select: {
            id: true,
            name: true,
          }
        },
        subcategory: {
          select: {
            id: true,
            name: true,
          }
        },
        images: true,
        videos: true,
        specs: true,
        rating: true,
      },
    });

    return res.status(200).json({ 
      message: "Product updated successfully", 
      product: completeUpdatedProduct,
      uploadJobs: {
        total: uploadJobs.length,
        jobs: uploadJobs,
        message: "Files are being processed in the background"
      }
    });

  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({ 
      message: "Failed to update product", 
      error: error.message 
    });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productId = Number(id);

    if (isNaN(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Delete the product (cascade will handle related records)
    await prisma.product.delete({
      where: { id: productId },
    });

    return res.status(200).json({ 
      message: "Product deleted successfully" 
    });

  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ 
      message: "Failed to delete product", 
      error: error.message 
    });
  }
};

// Get product statistics for admin dashboard
const getAdminProductStats = async (req, res) => {
  try {
    const [
      totalProducts,
      approvedProducts,
      pendingProducts,
      rejectedProducts,
      totalVendors,
      activeVendors,
      totalCategories
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { vendor: { is_approved: true } } }),
      prisma.product.count({ where: { vendor: { is_approved: false } } }),
      prisma.product.count({ where: { vendor: { status: false } } }),
      prisma.vendor.count(),
      prisma.vendor.count({ where: { is_approved: true, status: true } }),
      prisma.category.count()
    ]);

    // Get recent products (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentProducts = await prisma.product.count({
      where: {
        created_at: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Get products by category
    const productsByCategory = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: { products: true }
        }
      },
      orderBy: {
        products: {
          _count: 'desc'
        }
      },
      take: 10
    });

    return res.status(200).json({
      message: "Admin product statistics retrieved successfully",
      stats: {
        products: {
          total: totalProducts,
          approved: approvedProducts,
          pending: pendingProducts,
          rejected: rejectedProducts,
          recent: recentProducts
        },
        vendors: {
          total: totalVendors,
          active: activeVendors
        },
        categories: {
          total: totalCategories,
          breakdown: productsByCategory
        }
      }
    });

  } catch (error) {
    console.error("Error fetching admin product stats:", error);
    return res.status(500).json({
      message: "Failed to fetch admin product statistics",
      error: error.message
    });
  }
};

// Get all products for admin dashboard
const getAdminAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      vendor_id,
      category_id,
      status,
      approved,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { vendor: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (vendor_id) {
      where.vendor_id = Number(vendor_id);
    }

    if (category_id) {
      where.category_id = Number(category_id);
    }

    if (status !== undefined) {
      where.vendor = { ...where.vendor, status: status === 'true' };
    }

    if (approved !== undefined) {
      where.vendor = { ...where.vendor, is_approved: approved === 'true' };
    }

    const products = await prisma.product.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            type: true,
            is_approved: true,
            status: true,
            user: {
              select: {
                email: true,
                first_name: true,
                last_name: true
              }
            }
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        },
        subcategory: {
          select: {
            id: true,
            name: true
          }
        },
        images: {
          select: {
            id: true,
            image_url: true
          },
          take: 1 // Just get one image for preview
        },
        _count: {
          select: {
            images: true,
            videos: true,
            specs: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      }
    });

    const total = await prisma.product.count({ where });

    return res.status(200).json({
      message: "Admin products retrieved successfully",
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error("Error fetching admin products:", error);
    return res.status(500).json({
      message: "Failed to fetch admin products",
      error: error.message
    });
  }
};

// Get pending products for approval
const getPendingProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const products = await prisma.product.findMany({
      where: {
        vendor: {
          is_approved: false
        }
      },
      skip,
      take: Number(limit),
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            type: true,
            is_approved: true,
            status: true,
            user: {
              select: {
                email: true,
                first_name: true,
                last_name: true
              }
            }
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        },
        subcategory: {
          select: {
            id: true,
            name: true
          }
        },
        images: {
          select: {
            id: true,
            image_url: true
          },
          take: 3
        },
        specs: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    const total = await prisma.product.count({
      where: {
        vendor: {
          is_approved: false
        }
      }
    });

    return res.status(200).json({
      message: "Pending products retrieved successfully",
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error("Error fetching pending products:", error);
    return res.status(500).json({
      message: "Failed to fetch pending products",
      error: error.message
    });
  }
};

// Get products by specific vendor
const getProductsByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const vendorIdNum = Number(vendorId);
    if (isNaN(vendorIdNum)) {
      return res.status(400).json({ error: "Invalid vendor ID" });
    }

    // Check if vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorIdNum },
      select: {
        id: true,
        name: true,
        type: true,
        is_approved: true,
        status: true,
        user: {
          select: {
            email: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });

    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const products = await prisma.product.findMany({
      where: {
        vendor_id: vendorIdNum
      },
      skip,
      take: Number(limit),
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        subcategory: {
          select: {
            id: true,
            name: true
          }
        },
        images: {
          select: {
            id: true,
            image_url: true
          },
          take: 3
        },
        _count: {
          select: {
            images: true,
            videos: true,
            specs: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    const total = await prisma.product.count({
      where: {
        vendor_id: vendorIdNum
      }
    });

    return res.status(200).json({
      message: "Vendor products retrieved successfully",
      vendor,
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error("Error fetching vendor products:", error);
    return res.status(500).json({
      message: "Failed to fetch vendor products",
      error: error.message
    });
  }
};

// Approve a product
const approveProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productId = Number(id);

    if (isNaN(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        vendor: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Update vendor approval status
    await prisma.vendor.update({
      where: { id: product.vendor_id },
      data: {
        is_approved: true,
        status: true
      }
    });

    return res.status(200).json({
      message: "Product approved successfully",
      product_id: productId,
      vendor_id: product.vendor_id
    });

  } catch (error) {
    console.error("Error approving product:", error);
    return res.status(500).json({
      message: "Failed to approve product",
      error: error.message
    });
  }
};

// Reject a product
const rejectProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const productId = Number(id);

    if (isNaN(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        vendor: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Update vendor status to rejected
    await prisma.vendor.update({
      where: { id: product.vendor_id },
      data: {
        status: false
      }
    });

    return res.status(200).json({
      message: "Product rejected successfully",
      product_id: productId,
      vendor_id: product.vendor_id,
      reason: reason || "Product rejected by admin"
    });

  } catch (error) {
    console.error("Error rejecting product:", error);
    return res.status(500).json({
      message: "Failed to reject product",
      error: error.message
    });
  }
};

// Update product status
const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const productId = Number(id);

    if (isNaN(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    if (typeof status !== 'boolean') {
      return res.status(400).json({ error: "Status must be a boolean" });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        vendor: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Update vendor status
    await prisma.vendor.update({
      where: { id: product.vendor_id },
      data: {
        status: status
      }
    });

    return res.status(200).json({
      message: `Product ${status ? 'activated' : 'deactivated'} successfully`,
      product_id: productId,
      vendor_id: product.vendor_id,
      new_status: status,
      reason: reason || `Product ${status ? 'activated' : 'deactivated'} by admin`
    });

  } catch (error) {
    console.error("Error updating product status:", error);
    return res.status(500).json({
      message: "Failed to update product status",
      error: error.message
    });
  }
};

// Update product images (using keepImages system like categories)
const updateProductImages = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const { keepImages } = req.body; // JSON string array of image IDs to keep
    const pictures = req.files?.images; // New images to upload

    if (isNaN(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    // Parse keepImages (should be a JSON string array)
    let keepImageIds = [];
    if (keepImages) {
      try {
        keepImageIds = JSON.parse(keepImages);
        if (!Array.isArray(keepImageIds)) throw new Error();
      } catch {
        return res.status(400).json({ error: "Invalid format for keepImages" });
      }
    }

    // Fetch product with current images
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true }
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Identify images to delete (those NOT in keepImageIds)
    const imagesToDelete = product.images.filter(
      (img) => !keepImageIds.includes(img.id)
    );

    if (imagesToDelete.length > 0) {
      const deleteIds = imagesToDelete.map((img) => img.id);
      await prisma.image.deleteMany({
        where: { id: { in: deleteIds } },
      });
      // Optional: Delete images from Cloudinary if you have public_id stored
    }

    // Upload new images if any
    let newImages = [];
    if (pictures && pictures.length > 0) {
      const uploadPromises = pictures.map(async (file) => {
        // Validate file size (max 10MB for images)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          throw new Error(`Image file ${file.originalname} is too large. Maximum size is 10MB.`);
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
          throw new Error(`Image file ${file.originalname} has unsupported format. Allowed formats: JPEG, JPG, PNG, GIF, WEBP`);
        }

        // Upload to cloudinary
        const imageUrl = await uploadImageToCloudinary(
          file.buffer,
          `${productId}_product_${file.originalname}`
        );

        return prisma.image.create({
          data: {
            image_url: imageUrl,
            product_id: productId,
          },
        });
      });

      newImages = await Promise.all(uploadPromises);
    }

    // Combine kept + new images
    const finalImages = product.images
      .filter((img) => keepImageIds.includes(img.id))
      .concat(newImages);

    return res.status(200).json({
      message: "Product images updated successfully",
      images: finalImages.map(({ id, image_url, created_at }) => ({
        id,
        image_url,
        created_at,
      })),
      deleted_count: imagesToDelete.length,
      added_count: newImages.length
    });

  } catch (error) {
    console.error("Error updating product images:", error);
    return res.status(500).json({
      message: "Failed to update product images",
      error: error.message
    });
  }
};

// Delete specific product image
const deleteProductImage = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const imageId = Number(req.params.imageId);

    if (isNaN(productId) || isNaN(imageId)) {
      return res.status(400).json({ error: "Invalid product ID or image ID" });
    }

    // Check if image belongs to product
    const image = await prisma.image.findFirst({
      where: {
        id: imageId,
        product_id: productId
      }
    });

    if (!image) {
      return res.status(404).json({ error: "Image not found for this product" });
    }

    // Delete the image
    await prisma.image.delete({
      where: { id: imageId }
    });

    return res.status(200).json({
      message: "Product image deleted successfully",
      deleted_image_id: imageId
    });

  } catch (error) {
    console.error("Error deleting product image:", error);
    return res.status(500).json({
      message: "Failed to delete product image",
      error: error.message
    });
  }
};

// Bulk update stock for multiple products
const bulkUpdateStock = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { product_id, stock }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: "updates must be a non-empty array" });
    }

    // Validate all updates
    const validatedUpdates = [];
    for (const update of updates) {
      if (!update.product_id || typeof update.stock !== 'number' || update.stock < 0) {
        return res.status(400).json({
          error: `Invalid update: product_id and non-negative stock required. Got: ${JSON.stringify(update)}`
        });
      }
      validatedUpdates.push({
        product_id: Number(update.product_id),
        stock: update.stock
      });
    }

    // Check which products exist
    const productIds = validatedUpdates.map(u => u.product_id);
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true }
    });

    const existingIds = existingProducts.map(p => p.id);
    const notFoundIds = productIds.filter(id => !existingIds.includes(id));

    if (notFoundIds.length > 0) {
      return res.status(404).json({
        error: `Products not found: ${notFoundIds.join(', ')}`
      });
    }

    // Update stock for each product
    const updatePromises = validatedUpdates.map(update =>
      prisma.product.update({
        where: { id: update.product_id },
        data: { stock: update.stock },
        select: { id: true, stock: true }
      })
    );

    const results = await Promise.all(updatePromises);

    return res.status(200).json({
      message: "Stock updated successfully",
      updated_count: results.length,
      updates: results
    });

  } catch (error) {
    console.error("Error bulk updating stock:", error);
    return res.status(500).json({
      message: "Failed to update stock",
      error: error.message
    });
  }
};

// Bulk update status for multiple products (vendor status)
const bulkUpdateStatus = async (req, res) => {
  try {
    const { product_ids, status } = req.body; // Array of product IDs and boolean status

    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({ error: "product_ids must be a non-empty array" });
    }

    if (typeof status !== 'boolean') {
      return res.status(400).json({ error: "status must be a boolean" });
    }

    // Validate all product IDs
    const productIdNumbers = product_ids.map(id => {
      const num = Number(id);
      if (isNaN(num)) throw new Error(`Invalid product ID: ${id}`);
      return num;
    });

    // Get products with vendor info
    const products = await prisma.product.findMany({
      where: { id: { in: productIdNumbers } },
      include: { vendor: true }
    });

    if (products.length !== productIdNumbers.length) {
      const foundIds = products.map(p => p.id);
      const notFoundIds = productIdNumbers.filter(id => !foundIds.includes(id));
      return res.status(404).json({
        error: `Products not found: ${notFoundIds.join(', ')}`
      });
    }

    // Get unique vendor IDs
    const vendorIds = [...new Set(products.map(p => p.vendor_id))];

    // Update vendor statuses
    await prisma.vendor.updateMany({
      where: { id: { in: vendorIds } },
      data: { status: status }
    });

    return res.status(200).json({
      message: `Products ${status ? 'activated' : 'deactivated'} successfully`,
      updated_count: products.length,
      affected_vendors: vendorIds.length,
      new_status: status,
      product_ids: productIdNumbers
    });

  } catch (error) {
    console.error("Error bulk updating status:", error);
    return res.status(500).json({
      message: "Failed to update product status",
      error: error.message
    });
  }
};

// Get all products for the authenticated vendor owner
const getVendorProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category_id, subcategory_id } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Get all vendor IDs owned by the authenticated user
    const userVendors = await prisma.vendor.findMany({
      where: {
        user_id: Number(userId),
        status: true, // Only active vendors
        is_approved: true // Only approved vendors
      },
      select: { id: true }
    });

    const vendorIds = userVendors.map(vendor => vendor.id);

    if (vendorIds.length === 0) {
      return res.status(200).json({
        message: "No vendors found for this user",
        products: [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 0,
          pages: 0,
        },
      });
    }

    // Build where clause
    const where = {
      vendor_id: { in: vendorIds } // Only products from user's vendors
    };

    if (category_id) {
      where.category_id = Number(category_id);
    }

    if (subcategory_id) {
      where.subcategory_id = Number(subcategory_id);
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get products
    const products = await prisma.product.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        },
        category: {
          select: {
            id: true,
            name: true,
          }
        },
        subcategory: {
          select: {
            id: true,
            name: true,
          }
        },
        images: {
          select: {
            id: true,
            image_url: true
          }
        },
        videos: {
          select: {
            id: true,
            video_url: true
          }
        },
        specs: true,
        rating: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const total = await prisma.product.count({ where });

    // Filter out products with invalid image/video URLs
    const filteredProducts = products.map(product => ({
      ...product,
      images: product.images.filter(img => img.image_url && img.image_url.trim() !== ''),
      videos: product.videos.filter(vid => vid.video_url && vid.video_url.trim() !== '')
    }));

    return res.status(200).json({
      message: "Vendor products retrieved successfully",
      products: filteredProducts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
      vendor_count: vendorIds.length
    });

  } catch (error) {
    console.error("Error fetching vendor products:", error);
    return res.status(500).json({
      message: "Failed to fetch vendor products",
      error: error.message
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getVendorProducts,
  getAdminProductStats,
  getAdminAllProducts,
  getPendingProducts,
  getProductsByVendor,
  approveProduct,
  rejectProduct,
  updateProductStatus,
  updateProductImages,
  deleteProductImage,
  bulkUpdateStock,
  bulkUpdateStatus,
};
