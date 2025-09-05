const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { uploadImageToCloudinary } = require('../utils/cloudinary');

const createSubcategory = async (req, res) => {
    try {
      const { name, category_id } = req.body;
      const pictures = req.files;
  
      const categoryIdInt = parseInt(category_id);
      if (isNaN(categoryIdInt)) {
        return res.status(400).json({ error: "Invalid category_id" });
      }
  
      // Check category exists
      const categoryExists = await prisma.category.findUnique({
        where: { id: categoryIdInt },
      });
      if (!categoryExists) {
        return res.status(404).json({ error: "Category not found" });
      }
  
      // Check if subcategory name already exists under the same category
      const existingSubcategory = await prisma.subcategory.findFirst({
        where: { name, category_id: categoryIdInt },
      });
      if (existingSubcategory) {
        if (existingSubcategory.status === false) {
          // Restore soft-deleted subcategory with same name
          const restored = await prisma.subcategory.update({
            where: { id: existingSubcategory.id },
            data: { status: true },
          });

          // Handle images upload on restore if provided
          let createdImages = [];
          if (pictures?.length > 0) {
            const uploadPromises = pictures.map(async (file) => {
              const url = await uploadImageToCloudinary(
                file.buffer,
                `${restored.id}_subcategory_${file.originalname}`
              );
              return prisma.image.create({
                data: {
                  image_url: url,
                  subcategory: { connect: { id: restored.id } },
                },
              });
            });
            createdImages = await Promise.all(uploadPromises);
          }

          return res.status(200).json({
            message: "Subcategory restored successfully",
            subcategory: {
              id: restored.id,
              name: restored.name,
              category_id: restored.category_id,
              images: createdImages.map(({ id, image_url, created_at }) => ({ id, image_url, created_at })),
            },
          });
        }
        return res.status(409).json({ error: "Subcategory name already exists under this category." });
      }
  
      // Create new subcategory
      const subcategory = await prisma.subcategory.create({
        data: { name, category_id: categoryIdInt },
      });
  
      // Upload images and link to subcategory (exactly like category)
      let createdImages = [];
      if (pictures?.length > 0) {
        const uploadPromises = pictures.map(async (file) => {
          const url = await uploadImageToCloudinary(
            file.buffer,
            `${subcategory.id}_subcategory_${file.originalname}`
          );
          return prisma.image.create({
            data: {
              image_url: url,
              subcategory: { connect: { id: subcategory.id } },
            },
          });
        });
  
        createdImages = await Promise.all(uploadPromises);
      }
  
      return res.status(201).json({
        message: "Subcategory created successfully",
        subcategory: {
          id: subcategory.id,
          name: subcategory.name,
          category_id: subcategory.category_id,
          images: createdImages.map(({ id, image_url, created_at }) => ({
            id,
            image_url,
            created_at,
          })),
        },
      });
    } catch (error) {
      console.error("Create subcategory error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
  
const getAllSubcategories = async (req, res) => {
  try {
    const subcategories = await prisma.subcategory.findMany({
      where: { status: true },
      include: { images: true },
      orderBy: { created_at: "desc" },
    });
    return res.status(200).json(subcategories);
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getSubcategoryById = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid subcategory ID" });

  try {
    const subcategory = await prisma.subcategory.findUnique({
      where: { id },
      include: { images: true },
    });
    if (!subcategory || subcategory.status === false) return res.status(404).json({ error: "Subcategory not found" });

    return res.json(subcategory);
  } catch (error) {
    console.error("Get subcategory by ID error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updateSubcategory = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, keepImages } = req.body;
    const pictures = req.files;

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid subcategory ID" });
    }

    let keepImageIds = [];
    if (keepImages) {
      try {
        keepImageIds = JSON.parse(keepImages);
        if (!Array.isArray(keepImageIds)) throw new Error();
      } catch {
        return res.status(400).json({ error: "Invalid format for keepImages" });
      }
    }

    const subcategory = await prisma.subcategory.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!subcategory) {
      return res.status(404).json({ error: "Subcategory not found" });
    }

    // Update subcategory name
    const updatedSubcategory = await prisma.subcategory.update({
      where: { id },
      data: { name },
    });

    // Delete images not in keepImages list
    const imagesToDelete = subcategory.images.filter(
      (img) => !keepImageIds.includes(img.id)
    );

    if (imagesToDelete.length > 0) {
      const deleteIds = imagesToDelete.map((img) => img.id);
      await prisma.image.deleteMany({
        where: { id: { in: deleteIds } },
      });
      // Optional: delete images from Cloudinary if you store public_id
    }

    // Upload new images
    let newImages = [];
    if (pictures?.length > 0) {
      const uploadTasks = pictures.map(async (file) => {
        const imageUrl = await uploadImageToCloudinary(
          file.buffer,
          `${id}_subcategory_${file.originalname}`
        );
        return prisma.image.create({
          data: {
            image_url: imageUrl,
            subcategory: { connect: { id } },
          },
        });
      });
      newImages = await Promise.all(uploadTasks);
    }

    const finalImages = subcategory.images
      .filter((img) => keepImageIds.includes(img.id))
      .concat(newImages);

    return res.status(200).json({
      message: "Subcategory updated successfully",
      subcategory: {
        id: updatedSubcategory.id,
        name: updatedSubcategory.name,
        images: finalImages.map(({ id, image_url, created_at }) => ({
          id,
          image_url,
          created_at,
        })),
      },
    });
  } catch (error) {
    console.error("Error updating subcategory:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const deleteSubcategory = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid subcategory ID" });
    }

    const subcategory = await prisma.subcategory.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!subcategory) {
      return res.status(404).json({ error: "Subcategory not found" });
    }

    if (subcategory.images.length > 0) {
      const imageIds = subcategory.images.map((img) => img.id);
      await prisma.image.deleteMany({
        where: { id: { in: imageIds } },
      });
      // Optional: delete images from Cloudinary if public_id stored
    }

    // Soft delete
    const updated = await prisma.subcategory.update({ where: { id }, data: { status: false }, select: { id: true, status: true } });
    return res.status(200).json({ message: "Subcategory deleted (soft)", subcategory: updated });
  } catch (error) {
    console.error("Delete subcategory error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createSubcategory,
  getAllSubcategories,
  getSubcategoryById,
  updateSubcategory,
  deleteSubcategory,
  // Recycle bin operations
  getDeletedSubcategories: async (req, res) => {
    try {
      const subs = await prisma.subcategory.findMany({ where: { status: false }, include: { images: true, category: true } });
      return res.status(200).json({ subcategories: subs });
    } catch (e) {
      console.error('List deleted subcategories error:', e);
      return res.status(500).json({ error: 'Failed to list deleted subcategories' });
    }
  },
  restoreSubcategory: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid subcategory ID' });
      const restored = await prisma.subcategory.update({ where: { id }, data: { status: true }, select: { id: true, status: true } });
      return res.status(200).json({ message: 'Subcategory restored', subcategory: restored });
    } catch (e) {
      console.error('Restore subcategory error:', e);
      if (e.code === 'P2025') return res.status(404).json({ error: 'Subcategory not found' });
      return res.status(500).json({ error: 'Failed to restore subcategory' });
    }
  },
  permanentlyDeleteSubcategory: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid subcategory ID' });
      await prisma.image.deleteMany({ where: { subcategory_id: id } });
      const deleted = await prisma.subcategory.delete({ where: { id }, select: { id: true } });
      return res.status(200).json({ message: 'Subcategory permanently deleted', subcategory: deleted });
    } catch (e) {
      console.error('Permanent delete subcategory error:', e);
      if (e.code === 'P2025') return res.status(404).json({ error: 'Subcategory not found' });
      return res.status(500).json({ error: 'Failed to permanently delete subcategory' });
    }
  },
};
