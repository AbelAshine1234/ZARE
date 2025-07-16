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
  // Your update logic here...
  res.status(501).json({ error: 'Update category not implemented yet.' });
};

const deleteCategory = async (req, res) => {
  // Your delete logic here...
  res.status(501).json({ error: 'Delete category not implemented yet.' });
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
