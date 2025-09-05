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
    let { name, description, category_ids, payment_method, subscription_id } = req.body;

    const requester = req.user; // { id, type }
    const user_id = requester?.id;

    subscription_id = Number(subscription_id);

    if (!Number.isInteger(user_id)) return res.status(403).json({ error: "Unauthorized user." });
    if (requester.type === 'admin') return res.status(403).json({ error: "Admin cannot create a vendor." });
    if (requester.type !== 'vendor_owner' && requester.type !== 'employee') {
      return res.status(403).json({ error: "Only vendor owners or employees can create vendors." });
    }

    if (isNaN(subscription_id)) return res.status(400).json({ error: "Invalid subscription ID" });

    const userExists = await prisma.user.findUnique({ where: { id: user_id } });
    if (!userExists) return res.status(404).json({ error: `User with id ${user_id} does not exist.` });

    const userType = userExists.type;
    if (userType !== "vendor_owner" && userType !== "employee") {
      return res.status(400).json({ error: "User is not a vendor owner or employee." });
    }

    // Both vendor_owner and employee can create vendors
    // Check if user already has a vendor
    const existingVendor = await prisma.vendor.findUnique({ where: { user_id } });
    if (existingVendor) {
      if (existingVendor.status === false) {
        // Revive soft-deleted vendor for this user
        const revived = await prisma.vendor.update({
          where: { id: existingVendor.id },
          data: {
            status: true,
            name,
            type,
            description,
            subscription: { connect: { id: subscription_id } },
          },
          include: {
            cover_image: true,
            fayda_image: true,
            business_license_image: true,
            vendorCategories: { include: { category: true } },
            paymentMethods: true,
            subscription: true,
            user: true,
          },
        });

        const clean = {
          id: revived.id,
          name: revived.name,
          type: revived.type,
          description: revived.description,
          isApproved: revived.is_approved === true,
          cover_image: revived.cover_image ? { image_url: revived.cover_image.image_url } : null,
          fayda_image: revived.fayda_image ? { image_url: revived.fayda_image.image_url } : null,
          business_license_image: revived.business_license_image ? { image_url: revived.business_license_image.image_url } : null,
          vendorCategories: revived.vendorCategories.map(vc => ({ id: vc.category.id, name: vc.category.name, description: vc.category.description })),
          paymentMethods: revived.paymentMethods,
          subscription: revived.subscription,
          user: revived.user ? { id: revived.user.id, name: revived.user.name, email: revived.user.email, phone_number: revived.user.phone_number } : null,
          status: revived.status,
          createdAt: revived.createdAt,
          updatedAt: revived.updatedAt,
        };

        return res.status(200).json({ message: "Vendor restored successfully", vendor: clean });
      }
      return res.status(400).json({ 
        error: userType === "vendor_owner" 
          ? "This vendor owner already has a vendor." 
          : "This employee is already associated with a vendor." 
      });
    }

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

    // Check duplicate vendor name (case-sensitive as per DB). Adjust if needed
    const existingByName = await prisma.vendor.findUnique({ where: { name } });
    if (existingByName) {
      return res.status(409).json({ error: "Vendor name already exists. Choose a different name." });
    }

    const uploadedImages = await uploadImages(req.files, imageFields);

    // Create vendor
    const vendor = await prisma.vendor.create({
      data: {
        name,
        type, // <-- ensures "business" or "individual" is set correctly
        description,
        is_approved: false,
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
      price: updatedVendor.subscription ? updatedVendor.subscription.amount : 0,
      isApproved: updatedVendor.is_approved === true
    };

    return res.status(201).json({ message: "Vendor created successfully", vendor: cleanVendor });

  } catch (error) {
    console.error("Error creating vendor:", error);
    // Prisma unique constraint
    if (error.code === 'P2002' && Array.isArray(error.meta?.target) && error.meta.target.includes('name')) {
      return res.status(409).json({ error: "Vendor name already exists. Choose a different name." });
    }
    return res.status(500).json({ message: "Failed to create vendor", error: error.message });
  }
};

// Exported controllers
const createIndividualVendor = (req, res) => createVendor(req, res, "individual", ["cover_image", "fayda_image"]);
const createBusinessVendor = (req, res) => createVendor(req, res, "business", ["cover_image", "business_license_image"]);
const getAllVendors = async (req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({
      where: { status: true },
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
      isApproved: vendor.is_approved === true,
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

// Get a single vendor by id (admin only via route middleware)
const getVendorById = async (req, res) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isInteger(idNum)) return res.status(400).json({ error: 'Invalid vendor id' });

    const vendor = await prisma.vendor.findUnique({
      where: { id: idNum },
      include: {
        cover_image: true,
        fayda_image: true,
        business_license_image: true,
        vendorCategories: { include: { category: true } },
        paymentMethods: true,
        subscription: true,
        user: true,
        wallet: true,
      },
    });

    if (!vendor || vendor.status === false) return res.status(404).json({ error: 'Vendor not found' });

    const clean = {
      id: vendor.id,
      name: vendor.name,
      type: vendor.type,
      description: vendor.description,
      isApproved: vendor.is_approved === true,
      cover_image: vendor.cover_image ? { image_url: vendor.cover_image.image_url } : null,
      fayda_image: vendor.fayda_image ? { image_url: vendor.fayda_image.image_url } : null,
      business_license_image: vendor.business_license_image ? { image_url: vendor.business_license_image.image_url } : null,
      vendorCategories: vendor.vendorCategories.map(vc => ({ id: vc.category.id, name: vc.category.name, description: vc.category.description })),
      paymentMethods: vendor.paymentMethods,
      subscription: vendor.subscription,
      user: vendor.user ? { id: vendor.user.id, name: vendor.user.name, email: vendor.user.email, phone_number: vendor.user.phone_number } : null,
      wallet: vendor.wallet ? { id: vendor.wallet.id, balance: vendor.wallet.balance, status: vendor.wallet.status } : null,
      status: vendor.status,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt,
    };

    return res.status(200).json({ vendor: clean });
  } catch (error) {
    console.error('Error fetching vendor by id:', error);
    return res.status(500).json({ error: 'Failed to fetch vendor' });
  }
};

 
const getUserVendorStatus = async (req, res) => {
  try {
    const requester = req.user; // { id, type }
    const user_id = requester?.id;

    if (!Number.isInteger(user_id)) {
      return res.status(403).json({ error: "Unauthorized user." });
    }

    // Check if user is a vendor_owner or employee
    if (requester.type !== 'vendor_owner' && requester.type !== 'employee') {
      return res.status(400).json({ error: "User is not a vendor owner or employee." });
    }

    // Find vendor for this user
    const vendor = await prisma.vendor.findUnique({
      where: { user_id },
      select: {
        id: true,
        name: true,
        type: true,
        is_approved: true,
        status: true,
      }
    });

    if (!vendor) {
      return res.status(200).json({ 
        hasVendor: false,
        message: "No vendor found for this user"
      });
    }

    return res.status(200).json({
      hasVendor: true,
      vendor: {
        id: vendor.id,
        name: vendor.name,
        type: vendor.type,
        isApproved: vendor.is_approved,
        status: vendor.status,
        createdAt: vendor.created_at,
      }
    });

  } catch (error) {
    console.error("Error getting user vendor status:", error);
    return res.status(500).json({ message: "Failed to get vendor status", error: error.message });
  }
};

module.exports = { createIndividualVendor, createBusinessVendor, getAllVendors, getUserVendorStatus, getVendorById };

// Toggle vendor active status (only vendor_owner or employee on their own vendor)
const updateVendorStatus = async (req, res) => {
  try {
    const { status } = req.body || {};
    if (status === undefined) {
      return res.status(400).json({ error: 'status is required' });
    }
    if (typeof status !== 'boolean') {
      return res.status(400).json({ error: "'status' must be boolean" });
    }

    const requester = req.user; // { id, type }

    let targetVendorId = null;

    console.log("status", status);
    if (requester.type === 'vendor_owner') {
      // Find vendor by vendor owner's user id
      const vendor = await prisma.vendor.findUnique({ where: { user_id: requester.id } });
      if (!vendor) return res.status(404).json({ error: 'Vendor not found for this user.' });
      targetVendorId = vendor.id;
    } else if (requester.type === 'employee') {
      // Find employee then vendor
      const employee = await prisma.employee.findUnique({ where: { user_id: requester.id }, include: { vendor: true } });
      if (!employee?.vendor) return res.status(404).json({ error: 'Employee is not associated with a vendor.' });
      targetVendorId = employee.vendor.id;
    } else {
      return res.status(403).json({ error: 'Only vendor owners or employees can change vendor status.' });
    }

    const updated = await prisma.vendor.update({
      where: { id: targetVendorId },
      data: { status },
      select: { id: true, status: true }
    });

    return res.status(200).json({ message: 'Vendor status updated', vendor: updated });
  } catch (error) {
    console.error('Error updating vendor status:', error);
    return res.status(500).json({ error: 'Failed to update status' });
  }
};

// Update vendor approval flag (admin only)
const updateVendorApproval = async (req, res) => {
  try {
    const { vendor_id, isApproved } = req.body;
    const idNum = Number(vendor_id);
    if (!Number.isInteger(idNum)) return res.status(400).json({ error: 'Invalid vendor_id' });
    if (typeof isApproved !== 'boolean') return res.status(400).json({ error: "'isApproved' must be boolean" });

    const updated = await prisma.vendor.update({
      where: { id: idNum },
      data: { is_approved: isApproved },
      select: { id: true, is_approved: true }
    });

    return res.status(200).json({ message: 'Vendor approval updated', vendor: { id: updated.id, isApproved: updated.is_approved === true } });
  } catch (error) {
    console.error('Error updating vendor approval:', error);
    if (error.code === 'P2025') return res.status(404).json({ error: 'Vendor not found' });
    return res.status(500).json({ error: 'Failed to update approval' });
  }
};

// Delete vendor (admin can delete any by id; vendor/employee can delete their own)
// Note: performs a soft delete by setting status=false to avoid FK constraint issues.
const deleteVendor = async (req, res) => {
  try {
    const requester = req.user; // { id, type }
    let targetVendorId = null;

    if (requester.type === 'admin') {
      const idNum = Number(req.params.id || req.body.vendor_id);
      if (!Number.isInteger(idNum)) return res.status(400).json({ error: 'Invalid vendor id' });
      targetVendorId = idNum;
    } else if (requester.type === 'vendor_owner') {
      const vendor = await prisma.vendor.findUnique({ where: { user_id: requester.id } });
      if (!vendor) return res.status(404).json({ error: 'Vendor not found for this user.' });
      targetVendorId = vendor.id;
    } else if (requester.type === 'employee') {
      const employee = await prisma.employee.findUnique({ where: { user_id: requester.id }, include: { vendor: true } });
      if (!employee?.vendor) return res.status(404).json({ error: 'Employee is not associated with a vendor.' });
      targetVendorId = employee.vendor.id;
    } else {
      return res.status(403).json({ error: 'Not authorized to delete vendor.' });
    }

    // Soft delete: set inactive
    const updated = await prisma.vendor.update({
      where: { id: targetVendorId },
      data: { status: false },
      select: { id: true, status: true }
    });

    return res.status(200).json({ message: 'Vendor deleted (soft)', vendor: updated });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    if (error.code === 'P2025') return res.status(404).json({ error: 'Vendor not found' });
    return res.status(500).json({ error: 'Failed to delete vendor' });
  }
};

module.exports.updateVendorStatus = updateVendorStatus;
module.exports.updateVendorApproval = updateVendorApproval;
module.exports.deleteVendor = deleteVendor;
// Admin recycling endpoints
module.exports.getAllVendors = getAllVendors;
module.exports.getVendorById = getVendorById;

// List soft-deleted vendors (admin)
module.exports.getDeletedVendors = async (req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({
      where: { status: false },
      include: { user: true, vendorCategories: { include: { category: true } } }
    });
    const clean = vendors.map(v => ({
      id: v.id,
      name: v.name,
      user: v.user ? { id: v.user.id, name: v.user.name, email: v.user.email } : null,
      categories: v.vendorCategories.map(vc => ({ id: vc.category.id, name: vc.category.name })),
      deletedAt: v.updatedAt,
    }));
    return res.status(200).json({ vendors: clean });
  } catch (error) {
    console.error('Error listing deleted vendors:', error);
    return res.status(500).json({ error: 'Failed to list deleted vendors' });
  }
};

// Permanently delete vendor (admin)
module.exports.permanentlyDeleteVendor = async (req, res) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isInteger(idNum)) return res.status(400).json({ error: 'Invalid vendor id' });
    // Ensure vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: idNum },
      select: {
        id: true,
        cover_image_id: true,
        fayda_image_id: true,
        business_license_image_id: true,
        _count: {
          select: {
            products: true,
            orders: true,
            employees: true,
            paymentMethods: true,
            vendorCategories: true,
          }
        }
      }
    });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    // Block if critical dependents exist
    if ((vendor._count?.products ?? 0) > 0 || (vendor._count?.orders ?? 0) > 0) {
      return res.status(409).json({
        error: 'Cannot permanently delete vendor with products or orders. Remove them first.'
      });
    }

    await prisma.$transaction(async (tx) => {
      // Detach and delete vendor images if present
      if (vendor.cover_image_id || vendor.fayda_image_id || vendor.business_license_image_id) {
        await tx.vendor.update({
          where: { id: idNum },
          data: {
            cover_image_id: null,
            fayda_image_id: null,
            business_license_image_id: null,
          }
        });
        const imageIds = [vendor.cover_image_id, vendor.fayda_image_id, vendor.business_license_image_id].filter(Boolean);
        if (imageIds.length > 0) {
          await tx.image.deleteMany({ where: { id: { in: imageIds } } });
        }
      }

      // Remove simple dependents
      await tx.vendorCategory.deleteMany({ where: { vendor_id: idNum } });
      await tx.paymentMethod.deleteMany({ where: { vendor_id: idNum } });
      await tx.employee.deleteMany({ where: { vendor_id: idNum } });

      // Finally delete the vendor
      await tx.vendor.delete({ where: { id: idNum } });
    });

    return res.status(200).json({ message: 'Vendor permanently deleted', vendor: { id: idNum } });
  } catch (error) {
    console.error('Error hard-deleting vendor:', error);
    if (error.code === 'P2025') return res.status(404).json({ error: 'Vendor not found' });
    return res.status(500).json({ error: 'Failed to permanently delete vendor' });
  }
};

// Restore a soft-deleted vendor (admin)
module.exports.restoreVendor = async (req, res) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isInteger(idNum)) return res.status(400).json({ error: 'Invalid vendor id' });
    const restored = await prisma.vendor.update({ where: { id: idNum }, data: { status: true }, select: { id: true, status: true } });
    return res.status(200).json({ message: 'Vendor restored', vendor: restored });
  } catch (error) {
    console.error('Error restoring vendor:', error);
    if (error.code === 'P2025') return res.status(404).json({ error: 'Vendor not found' });
    return res.status(500).json({ error: 'Failed to restore vendor' });
  }
};

// Add payment method to vendor (admin)
module.exports.addVendorPaymentMethod = async (req, res) => {
  try {
    const vendorId = Number(req.params.id);
    if (!Number.isInteger(vendorId)) return res.status(400).json({ error: 'Invalid vendor id' });
    const { name, account_number, account_holder, type, details } = req.body;
    // ensure vendor exists
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { id: true } });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    const pm = await prisma.paymentMethod.create({
      data: {
        name,
        account_number,
        account_holder,
        type,
        details,
        vendor: { connect: { id: vendorId } }
      }
    });
    return res.status(201).json({ payment_method: pm });
  } catch (e) {
    console.error('Add vendor payment method error:', e);
    return res.status(500).json({ error: 'Failed to add payment method' });
  }
};

// Delete a vendor payment method (admin)
module.exports.deleteVendorPaymentMethod = async (req, res) => {
  try {
    const vendorId = Number(req.params.id);
    const pmId = Number(req.params.pmId);
    if (!Number.isInteger(vendorId) || !Number.isInteger(pmId)) return res.status(400).json({ error: 'Invalid id' });
    // Optionally ensure pm belongs to vendor
    const pm = await prisma.paymentMethod.findUnique({ where: { id: pmId }, select: { id: true, vendor_id: true } });
    if (!pm || pm.vendor_id !== vendorId) return res.status(404).json({ error: 'Payment method not found' });
    await prisma.paymentMethod.delete({ where: { id: pmId } });
    return res.status(200).json({ message: 'Payment method deleted', id: pmId });
  } catch (e) {
    console.error('Delete vendor payment method error:', e);
    if (e.code === 'P2025') return res.status(404).json({ error: 'Payment method not found' });
    return res.status(500).json({ error: 'Failed to delete payment method' });
  }
};

// Vendor Notes
module.exports.listVendorNotes = async (req, res) => {
  try {
    const vendorId = Number(req.params.id);
    if (!Number.isInteger(vendorId)) return res.status(400).json({ error: 'Invalid vendor id' });
    const notes = await prisma.vendorNote.findMany({
      where: { vendor_id: vendorId },
      orderBy: { created_at: 'desc' }
    });
    return res.status(200).json({ notes });
  } catch (e) {
    console.error('List vendor notes error:', e);
    return res.status(500).json({ error: 'Failed to list notes' });
  }
};

module.exports.createVendorNote = async (req, res) => {
  try {
    const vendorId = Number(req.params.id);
    const { title, description } = req.body;
    if (!Number.isInteger(vendorId)) return res.status(400).json({ error: 'Invalid vendor id' });
    if (!title || !description) return res.status(400).json({ error: 'title and description are required' });
    const note = await prisma.vendorNote.create({ data: { vendor_id: vendorId, title, description } });
    return res.status(201).json({ note });
  } catch (e) {
    console.error('Create vendor note error:', e);
    return res.status(500).json({ error: 'Failed to create note' });
  }
};

module.exports.deleteVendorNote = async (req, res) => {
  try {
    const vendorId = Number(req.params.id);
    const noteId = Number(req.params.noteId);
    if (!Number.isInteger(vendorId) || !Number.isInteger(noteId)) return res.status(400).json({ error: 'Invalid id' });
    await prisma.vendorNote.delete({ where: { id: noteId } });
    return res.status(200).json({ message: 'Note deleted', id: noteId });
  } catch (e) {
    console.error('Delete vendor note error:', e);
    if (e.code === 'P2025') return res.status(404).json({ error: 'Note not found' });
    return res.status(500).json({ error: 'Failed to delete note' });
  }
};