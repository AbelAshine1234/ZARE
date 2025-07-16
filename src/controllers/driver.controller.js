const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { uploadImageToCloudinary } = require("../utils/cloudinary");
const { driverQuerySchema, adminDriverCreationSchema } = require("../schemas/driver.schema");
const bcrypt = require("bcrypt");

// Generic image uploader
const uploadImages = async (files, fields) => {
  const uploaded = {};
  for (const field of fields) {
    if (files[field]?.[0]) {
      const file = files[field][0];
      const url = await uploadImageToCloudinary(file.buffer, `zare_driver_uploads/${file.originalname}`);
      uploaded[field] = { url };
    }
  }
  return uploaded;
};

// Get all drivers
const getAllDrivers = async (req, res) => {
  try {
    // Validate query parameters
    const { error, value } = driverQuerySchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { page = 1, limit = 10, status, approved, search } = value;
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    
    if (status) {
      whereClause.current_status = status;
    }
    
    if (approved !== undefined) {
      whereClause.isApproved = approved;
    }

    if (search) {
      whereClause.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone_number: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const drivers = await prisma.driver.findMany({
      where: whereClause,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone_number: true,
            email: true,
            type: true,
            is_verified: true,
            isotpVerified: true,
          }
        },
        profile_image: true,
        license_image: true,
        fayda_image: true,
        wallet: {
          select: {
            id: true,
            balance: true,
            status: true,
          }
        },
      },
      orderBy: {
        id: 'desc'
      }
    });

    // Get total count for pagination
    const totalDrivers = await prisma.driver.count({ where: whereClause });

    // Clean up response to only include image URLs
    const cleanDrivers = drivers.map(driver => ({
      id: driver.id,
      vehicle_info: driver.vehicle_info,
      current_status: driver.current_status,
      isApproved: driver.isApproved,
      profile_image: driver.profile_image ? {
        id: driver.profile_image.id,
        url: driver.profile_image.image_url
      } : null,
      license_image: driver.license_image ? {
        id: driver.license_image.id,
        url: driver.license_image.image_url
      } : null,
      fayda_image: driver.fayda_image ? {
        id: driver.fayda_image.id,
        url: driver.fayda_image.image_url
      } : null,
      user: driver.user,
      wallet: driver.wallet,
    }));

    return res.status(200).json({ 
      message: "Drivers retrieved successfully", 
      drivers: cleanDrivers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalDrivers,
        totalPages: Math.ceil(totalDrivers / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return res.status(500).json({ 
      message: "Failed to fetch drivers", 
      error: error.message 
    });
  }
};

// Get driver by ID
const getDriverById = async (req, res) => {
  try {
    const { id } = req.params;
    const driverId = parseInt(id);

    if (isNaN(driverId)) {
      return res.status(400).json({ error: "Invalid driver ID" });
    }

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone_number: true,
            email: true,
            type: true,
            is_verified: true,
            isotpVerified: true,
          }
        },
        profile_image: true,
        license_image: true,
        fayda_image: true,
        wallet: {
          select: {
            id: true,
            balance: true,
            status: true,
          }
        },
        deliveries: {
          include: {
            order: {
              include: {
                client: {
                  include: {
                    user: {
                      select: {
                        name: true,
                        phone_number: true,
                      }
                    }
                  }
                },
                product: true,
              }
            }
          }
        }
      },
    });

    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    // Check if user is authorized to view this driver
    // Drivers can only view their own profile, admins can view any
    if (req.user.type === 'driver' && driver.user_id !== req.user.id) {
      return res.status(403).json({ error: "You can only view your own profile" });
    }

    // Clean up response
    const cleanDriver = {
      id: driver.id,
      vehicle_info: driver.vehicle_info,
      current_status: driver.current_status,
      isApproved: driver.isApproved,
      profile_image: driver.profile_image ? {
        id: driver.profile_image.id,
        url: driver.profile_image.image_url
      } : null,
      license_image: driver.license_image ? {
        id: driver.license_image.id,
        url: driver.license_image.image_url
      } : null,
      fayda_image: driver.fayda_image ? {
        id: driver.fayda_image.id,
        url: driver.fayda_image.image_url
      } : null,
      user: driver.user,
      wallet: driver.wallet,
      deliveries: driver.deliveries,
    };

    return res.status(200).json({ 
      message: "Driver retrieved successfully", 
      driver: cleanDriver 
    });
  } catch (error) {
    console.error("Error fetching driver:", error);
    return res.status(500).json({ 
      message: "Failed to fetch driver", 
      error: error.message 
    });
  }
};

// Update driver profile (driver can only update their own profile)
const updateDriverByDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const driverId = parseInt(id);

    if (isNaN(driverId)) {
      return res.status(400).json({ error: "Invalid driver ID" });
    }

    // Check if request body exists and has data
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ 
        error: "Request body cannot be empty. Please provide at least one field to update (vehicle_info or current_status)." 
      });
    }

    const { vehicle_info, current_status } = req.body;

    // Check if driver exists
    const existingDriver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: { user: true }
    });

    if (!existingDriver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    // Only drivers can update their own profile
    if (req.user.type !== 'driver' || existingDriver.user_id !== req.user.id) {
      return res.status(403).json({ error: "You can only update your own profile" });
    }

    // Note: Joi schema validation already ensures at least one field is provided

    // Update driver
    const updatedDriver = await prisma.driver.update({
      where: { id: driverId },
      data: {
        ...(vehicle_info && { vehicle_info }),
        ...(current_status && { current_status }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone_number: true,
            email: true,
            type: true,
            is_verified: true,
            isotpVerified: true,
          }
        },
        profile_image: true,
        license_image: true,
        fayda_image: true,
        wallet: {
          select: {
            id: true,
            balance: true,
            status: true,
          }
        },
      },
    });

    // Clean up response
    const cleanDriver = {
      id: updatedDriver.id,
      vehicle_info: updatedDriver.vehicle_info,
      current_status: updatedDriver.current_status,
      isApproved: updatedDriver.isApproved,
      profile_image: updatedDriver.profile_image ? {
        id: updatedDriver.profile_image.id,
        url: updatedDriver.profile_image.image_url
      } : null,
      license_image: updatedDriver.license_image ? {
        id: updatedDriver.license_image.id,
        url: updatedDriver.license_image.image_url
      } : null,
      fayda_image: updatedDriver.fayda_image ? {
        id: updatedDriver.fayda_image.id,
        url: updatedDriver.fayda_image.image_url
      } : null,
      user: updatedDriver.user,
      wallet: updatedDriver.wallet,
    };

    return res.status(200).json({ 
      message: "Driver profile updated successfully", 
      driver: cleanDriver 
    });
  } catch (error) {
    console.error("Error updating driver profile:", error);
    return res.status(500).json({ 
      message: "Failed to update driver profile", 
      error: error.message 
    });
  }
};

// Update driver profile with images (admin or driver with keepImages)
const updateDriverProfileWithImages = async (req, res) => {
  try {
    const { id } = req.params;
    const driverId = parseInt(id);

    if (isNaN(driverId)) {
      return res.status(400).json({ error: "Invalid driver ID" });
    }

    const { vehicle_info, current_status } = req.body;

    // Check if driver exists
    const existingDriver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: { 
        user: true,
        profile_image: true,
        license_image: true,
        fayda_image: true
      }
    });

    if (!existingDriver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    // Check authorization - admin can update any, driver can only update their own
    if (req.user.type === 'driver' && existingDriver.user_id !== req.user.id) {
      return res.status(403).json({ error: "You can only update your own profile" });
    }

    // Upload new images if provided
    const imageFields = ["profile_image", "license_image", "fayda_image"];
    const uploadedImages = await uploadImages(req.files, imageFields);

    // Track what was updated
    const updateSummary = {
      imagesUpdated: [],
      imagesKept: [],
      profileDataUpdated: []
    };

    // Prepare image updates
    const imageUpdates = {};
    
    // Handle profile_image
    if (uploadedImages.profile_image?.url) {
      const imageRecord = await prisma.image.create({
        data: { image_url: uploadedImages.profile_image.url },
      });
      imageUpdates.profile_image_id = imageRecord.id;
      updateSummary.imagesUpdated.push('profile_image');
    } else {
      // Keep existing profile image if no new one provided
      if (existingDriver.profile_image) {
        imageUpdates.profile_image_id = existingDriver.profile_image.id;
        updateSummary.imagesKept.push('profile_image');
      }
    }

    // Handle license_image
    if (uploadedImages.license_image?.url) {
      const imageRecord = await prisma.image.create({
        data: { image_url: uploadedImages.license_image.url },
      });
      imageUpdates.license_image_id = imageRecord.id;
      updateSummary.imagesUpdated.push('license_image');
    } else {
      // Keep existing license image if no new one provided
      if (existingDriver.license_image) {
        imageUpdates.license_image_id = existingDriver.license_image.id;
        updateSummary.imagesKept.push('license_image');
      }
    }

    // Handle fayda_image
    if (uploadedImages.fayda_image?.url) {
      const imageRecord = await prisma.image.create({
        data: { image_url: uploadedImages.fayda_image.url },
      });
      imageUpdates.fayda_image_id = imageRecord.id;
      updateSummary.imagesUpdated.push('fayda_image');
    } else {
      // Keep existing fayda image if no new one provided
      if (existingDriver.fayda_image) {
        imageUpdates.fayda_image_id = existingDriver.fayda_image.id;
        updateSummary.imagesKept.push('fayda_image');
      }
    }

    // Prepare update data
    const updateData = {
      ...imageUpdates,
    };

    // Only add vehicle_info and current_status if they are provided (for profile updates)
    if (vehicle_info !== undefined) {
      updateData.vehicle_info = vehicle_info;
      updateSummary.profileDataUpdated.push('vehicle_info');
    }
    if (current_status !== undefined) {
      updateData.current_status = current_status;
      updateSummary.profileDataUpdated.push('current_status');
    }

    // Update driver
    const updatedDriver = await prisma.driver.update({
      where: { id: driverId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone_number: true,
            email: true,
            type: true,
            is_verified: true,
            isotpVerified: true,
          }
        },
        profile_image: true,
        license_image: true,
        fayda_image: true,
        wallet: {
          select: {
            id: true,
            balance: true,
            status: true,
          }
        },
      },
    });

    // Clean up response
    const cleanDriver = {
      id: updatedDriver.id,
      vehicle_info: updatedDriver.vehicle_info,
      current_status: updatedDriver.current_status,
      isApproved: updatedDriver.isApproved,
      profile_image: updatedDriver.profile_image ? {
        id: updatedDriver.profile_image.id,
        url: updatedDriver.profile_image.image_url
      } : null,
      license_image: updatedDriver.license_image ? {
        id: updatedDriver.license_image.id,
        url: updatedDriver.license_image.image_url
      } : null,
      fayda_image: updatedDriver.fayda_image ? {
        id: updatedDriver.fayda_image.id,
        url: updatedDriver.fayda_image.image_url
      } : null,
      user: updatedDriver.user,
      wallet: updatedDriver.wallet,
    };

    // Create detailed update message
    let updateMessage = "Driver profile updated successfully.";
    
    if (updateSummary.imagesUpdated.length > 0) {
      updateMessage += ` Images updated: ${updateSummary.imagesUpdated.join(', ')}.`;
    }
    
    if (updateSummary.imagesKept.length > 0) {
      updateMessage += ` Images kept unchanged: ${updateSummary.imagesKept.join(', ')}.`;
    }
    
    if (updateSummary.profileDataUpdated.length > 0) {
      updateMessage += ` Profile data updated: ${updateSummary.profileDataUpdated.join(', ')}.`;
    }

    return res.status(200).json({ 
      message: updateMessage,
      updateSummary,
      driver: cleanDriver 
    });
  } catch (error) {
    console.error("Error updating driver profile with images:", error);
    return res.status(500).json({ 
      message: "Failed to update driver profile", 
      error: error.message 
    });
  }
};

// Update driver approval status (admin only)
const updateDriverApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const driverId = parseInt(id);
    const { isApproved } = req.body;

    if (isNaN(driverId)) {
      return res.status(400).json({ error: "Invalid driver ID" });
    }

    // Convert string to boolean
    let approvalStatus;
    if (isApproved === 'true' || isApproved === '1') {
      approvalStatus = true;
    } else if (isApproved === 'false' || isApproved === '0') {
      approvalStatus = false;
    } else {
      return res.status(400).json({ 
        error: "Invalid approval value. Please provide: true, false, 1, or 0." 
      });
    }

    // Check if driver exists
    const existingDriver = await prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!existingDriver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    // Update driver approval status
    const updatedDriver = await prisma.driver.update({
      where: { id: driverId },
      data: { isApproved: approvalStatus },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone_number: true,
            email: true,
            type: true,
            is_verified: true,
            isotpVerified: true,
          }
        },
        profile_image: true,
        license_image: true,
        fayda_image: true,
        wallet: {
          select: {
            id: true,
            balance: true,
            status: true,
          }
        },
      },
    });

    // Clean up response
    const cleanDriver = {
      id: updatedDriver.id,
      vehicle_info: updatedDriver.vehicle_info,
      current_status: updatedDriver.current_status,
      isApproved: updatedDriver.isApproved,
      profile_image: updatedDriver.profile_image ? {
        id: updatedDriver.profile_image.id,
        url: updatedDriver.profile_image.image_url
      } : null,
      license_image: updatedDriver.license_image ? {
        id: updatedDriver.license_image.id,
        url: updatedDriver.license_image.image_url
      } : null,
      fayda_image: updatedDriver.fayda_image ? {
        id: updatedDriver.fayda_image.id,
        url: updatedDriver.fayda_image.image_url
      } : null,
      user: updatedDriver.user,
      wallet: updatedDriver.wallet,
    };

    return res.status(200).json({ 
      message: `Driver ${approvalStatus ? 'approved' : 'rejected'} successfully`, 
      driver: cleanDriver 
    });
  } catch (error) {
    console.error("Error updating driver approval:", error);
    return res.status(500).json({ 
      message: "Failed to update driver approval", 
      error: error.message 
    });
  }
};

// Get approved drivers only
const getApprovedDrivers = async (req, res) => {
  try {
    const drivers = await prisma.driver.findMany({
      where: { isApproved: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone_number: true,
            email: true,
            type: true,
            is_verified: true,
            isotpVerified: true,
          }
        },
        profile_image: true,
        license_image: true,
        fayda_image: true,
        wallet: {
          select: {
            id: true,
            balance: true,
            status: true,
          }
        },
      },
    });

    // Clean up response
    const cleanDrivers = drivers.map(driver => ({
      id: driver.id,
      vehicle_info: driver.vehicle_info,
      current_status: driver.current_status,
      isApproved: driver.isApproved,
      profile_image: driver.profile_image ? {
        id: driver.profile_image.id,
        url: driver.profile_image.image_url
      } : null,
      license_image: driver.license_image ? {
        id: driver.license_image.id,
        url: driver.license_image.image_url
      } : null,
      fayda_image: driver.fayda_image ? {
        id: driver.fayda_image.id,
        url: driver.fayda_image.image_url
      } : null,
      user: driver.user,
      wallet: driver.wallet,
    }));

    return res.status(200).json({ 
      message: "Approved drivers retrieved successfully", 
      drivers: cleanDrivers 
    });
  } catch (error) {
    console.error("Error fetching approved drivers:", error);
    return res.status(500).json({ 
      message: "Failed to fetch approved drivers", 
      error: error.message 
    });
  }
};

// Delete driver
const deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const driverId = parseInt(id);

    if (isNaN(driverId)) {
      return res.status(400).json({ error: "Invalid driver ID" });
    }

    // Check if driver exists
    const existingDriver = await prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!existingDriver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    // Delete driver (this will cascade to related records)
    await prisma.driver.delete({
      where: { id: driverId },
    });

    return res.status(200).json({ 
      message: "Driver deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting driver:", error);
    return res.status(500).json({ 
      message: "Failed to delete driver", 
      error: error.message 
    });
  }
};

// Create a new driver (admin only)
const createDriver = async (req, res) => {
  try {
    // Validate request body
    const { error } = adminDriverCreationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, phone_number, email, password, vehicle_info, current_status = 'offline' } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone_number },
          ...(email ? [{ email }] : [])
        ]
      },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "User with this phone number or email already exists.",
      });
    }

    // Check if vehicle_info already exists
    const existingVehicle = await prisma.driver.findFirst({
      where: { vehicle_info },
    });

    if (existingVehicle) {
      return res.status(409).json({
        error: "Vehicle ID/Number already exists.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        phone_number,
        email,
        password: hashedPassword,
        type: 'driver',
        is_verified: true, // Admin created users are pre-verified
        isotpVerified: true, // Skip OTP for admin-created users
      },
    });

    // Upload images if available
    const imageFields = ["profile_image", "license_image", "fayda_image"];
    const uploadedImages = await uploadImages(req.files, imageFields);

    // Create image records for uploaded images
    const imageRecords = {};
    for (const [field, imageData] of Object.entries(uploadedImages)) {
      if (imageData?.url) {
        const imageRecord = await prisma.image.create({
          data: { image_url: imageData.url },
        });
        imageRecords[field] = imageRecord;
      }
    }

    // Create wallet for driver
    const wallet = await prisma.wallet.create({
      data: {
        user_id: newUser.id,
        balance: 0.0,
        status: 'active'
      }
    });

    // Create associated driver record with wallet
    const newDriver = await prisma.driver.create({
      data: {
        user: { connect: { id: newUser.id } },
        vehicle_info,
        current_status,
        isApproved: true, // Admin created drivers are pre-approved
        ...(imageRecords.profile_image && { profile_image: { connect: { id: imageRecords.profile_image.id } } }),
        ...(imageRecords.license_image && { license_image: { connect: { id: imageRecords.license_image.id } } }),
        ...(imageRecords.fayda_image && { fayda_image: { connect: { id: imageRecords.fayda_image.id } } }),
        wallet: { connect: { id: wallet.id } }
      },
      include: {
        profile_image: true,
        license_image: true,
        fayda_image: true,
        user: {
          select: {
            id: true,
            name: true,
            phone_number: true,
            email: true,
            type: true,
            is_verified: true,
            isotpVerified: true,
          }
        },
        wallet: {
          select: {
            id: true,
            balance: true,
            status: true,
          }
        },
      },
    });

    return res.status(201).json({
      message: "Driver created successfully by admin.",
      driver: {
        id: newDriver.id,
        vehicle_info: newDriver.vehicle_info,
        current_status: newDriver.current_status,
        isApproved: newDriver.isApproved,
        profile_image: newDriver.profile_image ? {
          id: newDriver.profile_image.id,
          url: newDriver.profile_image.image_url
        } : null,
        license_image: newDriver.license_image ? {
          id: newDriver.license_image.id,
          url: newDriver.license_image.image_url
        } : null,
        fayda_image: newDriver.fayda_image ? {
          id: newDriver.fayda_image.id,
          url: newDriver.fayda_image.image_url
        } : null,
        user: newDriver.user,
        wallet: newDriver.wallet,
      }
    });
    
  } catch (error) {
    console.error("Create driver error:", error);
    return res.status(500).json({ 
      message: "Failed to create driver", 
      error: error.message 
    });
  }
};

module.exports = {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriverByDriver,
  updateDriverProfileWithImages,
  updateDriverApproval,
  getApprovedDrivers,
  deleteDriver,
};
