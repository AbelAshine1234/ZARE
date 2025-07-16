const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { uploadImageToCloudinary } = require("../utils/cloudinary");

// Generic image uploader
const uploadImages = async (files, fields) => {
  const uploaded = {};
  for (const field of fields) {
    if (files[field]?.[0]) {
      const file = files[field][0];
      const url = await uploadImageToCloudinary(file.buffer, `zare_uploads/${file.originalname}`);
      uploaded[field] = { url };
    }
  }
  return uploaded;
};

// Generic vendor creation
const createVendor = async (req, res, type, imageFields) => {
  try {
    let { name, user_id, description, category_ids, payment_method, subscription_id } = req.body;

    user_id = Number(user_id);
    subscription_id = Number(subscription_id);

    if (isNaN(user_id)) return res.status(400).json({ error: "Invalid user ID" });
    if (isNaN(subscription_id)) return res.status(400).json({ error: "Invalid subscription ID" });

    const userExists = await prisma.user.findUnique({ where: { id: user_id } });
    if (!userExists) return res.status(404).json({ error: `User with id ${user_id} does not exist.` });

    const existingVendor = await prisma.vendor.findUnique({ where: { user_id } });
    if (existingVendor) return res.status(400).json({ error: "This user already has a vendor." });

    const subscriptionExists = await prisma.subscription.findUnique({ where: { id: subscription_id } });
    if (!subscriptionExists) return res.status(400).json({ error: `Subscription with id ${subscription_id} does not exist.` });

    // Parse category_ids if sent as string
    if (category_ids && typeof category_ids === "string") {
      try {
        category_ids = JSON.parse(category_ids);
      } catch {
        return res.status(400).json({ error: "Invalid category_ids format" });
      }
    }

    // Validate categories exist
    if (category_ids?.length) {
      const existingCategories = await prisma.category.findMany({
        where: { id: { in: category_ids } },
      });
      if (existingCategories.length !== category_ids.length) {
        return res.status(400).json({ error: "One or more categories do not exist." });
      }
    }

    const uploadedImages = await uploadImages(req.files, imageFields);

    // Create vendor
    const vendor = await prisma.vendor.create({
      data: {
        name,
        type, // <-- ensures "business" or "individual" is set correctly
        description,
        vendorCategories: category_ids?.length
          ? { create: category_ids.map(id => ({ category: { connect: { id } } })) }
          : undefined,
        ...(uploadedImages.cover_image && { cover_image: { create: { image_url: uploadedImages.cover_image.url } } }),
        ...(uploadedImages.fayda_image && { fayda_image: { create: { image_url: uploadedImages.fayda_image?.url } } }),
        ...(uploadedImages.business_license_image && { business_license_image: { create: { image_url: uploadedImages.business_license_image.url } } }),
        paymentMethods: { create: { ...payment_method } },
        user: { connect: { id: user_id } },
        subscription: { connect: { id: subscription_id } },
      },
      include: {
        cover_image: true,
        fayda_image: true,
        business_license_image: true,
        vendorCategories: { include: { category: true } },
        paymentMethods: true,
        subscription: true,
      },
    });

    // Create wallet for vendor
    let wallet = await prisma.wallet.findUnique({
      where: { user_id: user_id }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          user_id: user_id,
          balance: 0.0,
          status: 'active'
        }
      });
    }

    // Update vendor with wallet
    const updatedVendor = await prisma.vendor.update({
      where: { id: vendor.id },
      data: {
        wallet: { connect: { id: wallet.id } }
      },
      include: {
        cover_image: true,
        fayda_image: true,
        business_license_image: true,
        vendorCategories: { include: { category: true } },
        paymentMethods: true,
        subscription: true,
        wallet: true,
      },
    });

    // Only return URLs for images
    const cleanVendor = {
      ...updatedVendor,
      cover_image: updatedVendor.cover_image ? { image_url: updatedVendor.cover_image.image_url } : null,
      fayda_image: updatedVendor.fayda_image ? { image_url: updatedVendor.fayda_image.image_url } : null,
      business_license_image: updatedVendor.business_license_image ? { image_url: updatedVendor.business_license_image.image_url } : null,
      wallet: updatedVendor.wallet ? { id: updatedVendor.wallet.id, balance: updatedVendor.wallet.balance } : { id: null, balance: 0 },
      price: updatedVendor.subscription ? updatedVendor.subscription.amount : 0
    };

    return res.status(201).json({ message: "Vendor created successfully", vendor: cleanVendor });

  } catch (error) {
    console.error("Error creating vendor:", error);
    return res.status(500).json({ message: "Failed to create vendor", error: error.message });
  }
};

// Exported controllers
const createIndividualVendor = (req, res) => createVendor(req, res, "individual", ["cover_image", "fayda_image"]);
const createBusinessVendor = (req, res) => createVendor(req, res, "business", ["cover_image", "business_license_image"]);
const getAllVendors = async (req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        cover_image: true,
        fayda_image: true,
        business_license_image: true,
        vendorCategories: { include: { category: true } },
        paymentMethods: true,
        subscription: true,
        user: true, // optional, remove if you don't want user details
      },
    });

    // Map vendors to clean structure (only expose URLs for images)
    const cleanVendors = vendors.map(vendor => ({
      id: vendor.id,
      name: vendor.name,
      type: vendor.type,
      description: vendor.description,
      cover_image: vendor.cover_image ? { image_url: vendor.cover_image.image_url } : null,
      fayda_image: vendor.fayda_image ? { image_url: vendor.fayda_image.image_url } : null,
      business_license_image: vendor.business_license_image ? { image_url: vendor.business_license_image.image_url } : null,
      vendorCategories: vendor.vendorCategories.map(vc => ({
        id: vc.category.id,
        name: vc.category.name,
        description: vc.category.description,
      })),
      paymentMethods: vendor.paymentMethods,
      subscription: vendor.subscription,
      user: { id: vendor.user.id, name: vendor.user.name, email: vendor.user.email }, // optional
      status: vendor.status,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt,
    }));

    return res.status(200).json({ vendors: cleanVendors });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return res.status(500).json({ message: "Failed to fetch vendors", error: error.message });
  }
};

 

module.exports = { createIndividualVendor, createBusinessVendor,getAllVendors };
