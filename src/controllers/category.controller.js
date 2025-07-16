const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { uploadImageToCloudinary } = require('../utils/cloudinary'); // your upload helper

const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const pictures = req.files;

    // Check if category name already exists
    const existingCategory = await prisma.category.findUnique({ where: { name } });
    if (existingCategory) {
      return res.status(409).json({ error: "Category name already exists." });
    }

    // Create the category
    const category = await prisma.category.create({
      data: { name, description },
    });

    // Upload images and link to category
    let createdImages = [];
    if (pictures?.length > 0) {
      const uploadPromises = pictures.map(async (file) => {
        const url = await uploadImageToCloudinary(
          file.buffer,
          `${category.id}_category_${file.originalname}`
        );
        return prisma.image.create({
          data: {
            image_url: url,
            category: { connect: { id: category.id } },
          },
        });
      });

      createdImages = await Promise.all(uploadPromises);
    }

    // Return created category with images
    return res.status(201).json({
      message: "Category created successfully",
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
        images: createdImages.map(({ id, image_url, created_at }) => ({
          id,
          image_url,
          created_at,
        })),
      },
    });
  } catch (error) {
    console.error("Create category error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { images: true },
      orderBy: { created_at: "desc" },
    });

    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};



const getCategoryById = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid category ID' });

  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { images: true },
    });
    if (!category) return res.status(404).json({ error: 'Category not found' });

    res.json(category);
  } catch (error) {
    console.error('Get category by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, keepImages } = req.body;
    const pictures = req.files;

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid category ID" });
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

    // Fetch category + images
    const category = await prisma.category.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const existingCategory = await prisma.category.findUnique({
      where: { name },
    });
  
    if (existingCategory ) {
     return res.status(409).json({ error: "Category name already exists." });
    }

    // Update name and description
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { name, description },
    });

    // Identify images to delete (those NOT in keepImageIds)
    const imagesToDelete = category.images.filter(
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
      const uploadTasks = pictures.map(async (file) => {
        const imageUrl = await uploadImageToCloudinary(
          file.buffer,
          `${id}_category_${file.originalname}`
        );
        return prisma.image.create({
          data: {
            image_url: imageUrl,
            category: { connect: { id } },
          },
        });
      });
      newImages = await Promise.all(uploadTasks);
    }

    // Combine kept + new images for response
    const finalImages = category.images
      .filter((img) => keepImageIds.includes(img.id))
      .concat(newImages);

    return res.status(200).json({
      message: "Category updated successfully",
      category: {
        id: updatedCategory.id,
        name: updatedCategory.name,
        description: updatedCategory.description,
        images: finalImages.map(({ id, image_url, created_at }) => ({
          id,
          image_url,
          created_at,
        })),
      },
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


const deleteCategory = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    // Check if category exists with images
    const category = await prisma.category.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Delete related images first
    if (category.images.length > 0) {
      const imageIds = category.images.map(img => img.id);
      await prisma.image.deleteMany({
        where: { id: { in: imageIds } },
      });

      // Optional: delete images from Cloudinary if you have public_id stored
    }

    // Delete the category itself
    await prisma.category.delete({
      where: { id },
    });

    return res.status(200).json({ message: "Category and related images deleted successfully" });
  } catch (error) {
    console.error("Delete category error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
const getSubcategoriesByCategoryId = async (req, res) => {
  const categoryId = parseInt(req.params.id);
  if (isNaN(categoryId)) return res.status(400).json({ error: 'Invalid category ID' });

  try {
    // Fetch all subcategories where category_id = categoryId
    const subcategories = await prisma.subcategory.findMany({
      where: { category_id: categoryId },
      include: { images: true, videos: true, products: true }, // include relations as needed
      orderBy: { created_at: 'desc' },
    });

    res.status(200).json(subcategories);
  } catch (error) {
    console.error('Error fetching subcategories by category ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getSubcategoriesByCategoryId
};
