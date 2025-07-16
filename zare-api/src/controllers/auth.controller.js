const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { uploadImageToCloudinary } = require("../utils/cloudinary");
require("dotenv").config();

// Register a new client user
const registerAsClient = async (req, res) => {
  try {
    const { name, phone_number, email, password, type = "client" } = req.body;

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

    // Upload image if available
    const pictureFile = req.files?.find(file => file.fieldname === "picture");
    let imageRecord = null;

    if (pictureFile) {
      const imageUrl = await uploadImageToCloudinary(
        pictureFile.buffer,
        `${phone_number}_profile`
      );
      imageRecord = await prisma.image.create({
        data: { image_url: imageUrl },
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
        type,
      },
    });

    // Create associated client record
    const newClient = await prisma.client.create({
      data: {
        user: { connect: { id: newUser.id } },
        ...(imageRecord && { image: { connect: { id: imageRecord.id } } }),
      },
      include: {
        image: true,
        user: true,
      },
    });

    return res.status(201).json({
      message: "Client registered successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        phone_number: newUser.phone_number,
        email: newUser.email,
        isOtpVerified: newUser.isOtpVerified,
        type: newUser.type,
        imageUrl: newClient.image?.image_url || null,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Register a new client user
const registerAsAdmin = async (req, res) => {
  try {
    const { name, phone_number, email, password, type = "admin" } = req.body;

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

    // Upload image if available
    const pictureFile = req.files?.find(file => file.fieldname === "picture");
    let imageRecord = null;

    if (pictureFile) {
      const imageUrl = await uploadImageToCloudinary(
        pictureFile.buffer,
        `${phone_number}_profile`
      );
      imageRecord = await prisma.image.create({
        data: { image_url: imageUrl },
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
        type,
      },
    });

    return res.status(201).json({
      message: "Admin registered successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        phone_number: newUser.phone_number,
        email: newUser.email,
        isOtpVerified: newUser.isOtpVerified,
        type: newUser.type,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Login existing user
const login = async (req, res) => {
  try {
    const { phone_number, password } = req.body;

    // Find user by phone number
    const user = await prisma.user.findUnique({
      where: { phone_number },
      include: {
        client: {
          include: { image: true },
        },
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid phone number or password." });
    }

    const token = jwt.sign(
      { id: user.id, type: user.type },
      process.env.SECRET_KEY,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { registerAsClient, login,registerAsAdmin };
