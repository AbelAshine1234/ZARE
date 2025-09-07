const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { imageUploadQueue, videoUploadQueue } = require("../config/queue.config");

// Stock status calculation function
const calculateStockStatus = (stock, lowStockThreshold = 10) => {
  if (stock <= 0) {
    return 'out_of_stock';
  } else if (stock <= lowStockThreshold) {
    return 'low_stock';
  } else {
    return 'active';
  }
};

// Update stock status for all products (useful for bulk updates)
const updateAllStockStatus = async () => {
  try {
    const products = await prisma.product.findMany({
      select: { id: true, stock: true, low_stock_threshold: true }
    });

    const updatePromises = products.map(product => {
      const stock_status = calculateStockStatus(product.stock, product.low_stock_threshold);
      const is_active = product.stock > 0;
      
      return prisma.product.update({
        where: { id: product.id },
        data: { stock_status, is_active }
      });
    });

    await Promise.all(updatePromises);
    console.log(`Updated stock status for ${products.length} products`);
  } catch (error) {
    console.error('Error updating stock status:', error);
    throw error;
  }
};

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
      stock, 
      vendor_id, 
      category_id, 
      subcategory_id, 
      price,
      specs,
      low_stock_threshold = 10
    } = req.body;

    // Convert string values to appropriate types
    price = Number(price);
    vendor_id = Number(vendor_id);
    category_id = Number(category_id);
    subcategory_id = Number(subcategory_id);
    stock = Number(stock);
    low_stock_threshold = Number(low_stock_threshold);
    has_discount = has_discount === 'true' || has_discount === true;

    // Validate required fields
    if (isNaN(vendor_id)) return res.status(400).json({ error: "Invalid vendor ID" });
    if (isNaN(category_id)) return res.status(400).json({ error: "Invalid category ID" });
    if (isNaN(subcategory_id)) return res.status(400).json({ error: "Invalid subcategory ID" });
    if (isNaN(stock)) return res.status(400).json({ error: "Invalid stock value" });
    if (isNaN(low_stock_threshold)) return res.status(400).json({ error: "Invalid low stock threshold" });
    if (stock < 0) return res.status(400).json({ error: "Stock cannot be negative" });
    if (low_stock_threshold < 0) return res.status(400).json({ error: "Low stock threshold cannot be negative" });
    if(price<=0) return res.status(400).json({ error: "Price cannot be negative or zero" });

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

    // Calculate stock status
    const stock_status = calculateStockStatus(stock, low_stock_threshold);
    const is_active = stock > 0; // Product is active if stock > 0

    // Create product with placeholder file references
    const product = await prisma.product.create({
      data: {
        name,
        description,
        has_discount,
        stock,
        stock_status,
        low_stock_threshold,
        is_active,
        vendor: { connect: { id: vendor_id } },
        category: { connect: { id: category_id } },
        subcategory: { connect: { id: subcategory_id } },
        specs: specs?.length ? { create: specs } : undefined,
        price,
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

// Get all products -- for a specific vendor, specific category
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

//Get all products by vendor
const getProductsByVendor = async (req, res) => {
  try {
    const { vendor_id } = req.query;
    const vendorId = Number(vendor_id);

    if (isNaN(vendorId)) {
      return res.status(400).json({ error: "Invalid vendor ID" });
    }

    const products = await prisma.product.findMany({
      where: { vendor_id: vendorId },
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

    const total = await prisma.product.count({ where: { vendor_id: vendorId } });

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
      stock, 
      category_id, 
      subcategory_id, 
      specs,
      low_stock_threshold
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
    if (low_stock_threshold) low_stock_threshold = Number(low_stock_threshold);
    if (has_discount !== undefined) has_discount = has_discount === 'true' || has_discount === true;

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

    if (low_stock_threshold && isNaN(low_stock_threshold)) {
      return res.status(400).json({ error: "Invalid low stock threshold" });
    }

    if (stock !== undefined && stock < 0) {
      return res.status(400).json({ error: "Stock cannot be negative" });
    }

    if (low_stock_threshold !== undefined && low_stock_threshold < 0) {
      return res.status(400).json({ error: "Low stock threshold cannot be negative" });
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
    if (stock !== undefined) updateData.stock = stock;
    if (low_stock_threshold !== undefined) updateData.low_stock_threshold = low_stock_threshold;
    if (category_id) updateData.category = { connect: { id: category_id } };
    if (subcategory_id) updateData.subcategory = { connect: { id: subcategory_id } };

    // Calculate and update stock status if stock or low_stock_threshold changed
    if (stock !== undefined || low_stock_threshold !== undefined) {
      const currentStock = stock !== undefined ? stock : existingProduct.stock;
      const currentThreshold = low_stock_threshold !== undefined ? low_stock_threshold : existingProduct.low_stock_threshold;
      
      updateData.stock_status = calculateStockStatus(currentStock, currentThreshold);
      updateData.is_active = currentStock > 0;
    }

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

// Get products by stock status
const getProductsByStockStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 10, vendor_id } = req.query;
    
    const validStatuses = ['active', 'low_stock', 'out_of_stock'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid stock status. Must be one of: active, low_stock, out_of_stock" });
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const whereClause = {
      stock_status: status,
      is_active: status !== 'out_of_stock' // Only show active products unless out of stock
    };

    if (vendor_id) {
      whereClause.vendor_id = Number(vendor_id);
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
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
        orderBy: { created_at: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.product.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return res.status(200).json({
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: totalPages,
      },
      stock_status: status
    });

  } catch (error) {
    console.error("Error fetching products by stock status:", error);
    return res.status(500).json({ 
      message: "Failed to fetch products by stock status", 
      error: error.message 
    });
  }
};

// Get low stock products for vendor
const getLowStockProducts = async (req, res) => {
  try {
    const { vendor_id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const whereClause = {
      vendor_id: Number(vendor_id),
      stock_status: 'low_stock',
      is_active: true
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
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
          specs: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.product.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return res.status(200).json({
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: totalPages,
      },
      message: `Found ${total} products with low stock`
    });

  } catch (error) {
    console.error("Error fetching low stock products:", error);
    return res.status(500).json({ 
      message: "Failed to fetch low stock products", 
      error: error.message 
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  getProductsByVendor,
  updateProduct,
  deleteProduct,
  getProductsByStockStatus,
  getLowStockProducts,
  updateAllStockStatus,
};
