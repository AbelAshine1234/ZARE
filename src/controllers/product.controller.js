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

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
