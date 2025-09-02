const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { uploadImageToCloudinary } = require("../utils/cloudinary");
const { driverRegistrationSchema } = require("../schemas/driver.schema");
require("dotenv").config();

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

    // Send OTP before creating any records
    try {
      const { sendOtp } = require("../utils/otp.util");
      await sendOtp(phone_number, 'sms');
    } catch (otpErr) {
      return res.status(502).json({ error: "Failed to send OTP. Please try again." });
    }

    // Upload image if available (after OTP successfully sent)
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

    // Create wallet for client
    const wallet = await prisma.wallet.create({
      data: {
        user_id: newUser.id,
        balance: 0.0,
        status: 'active'
      }
    });

    // Attach wallet to client
    await prisma.client.update({
      where: { id: newClient.id },
      data: { wallet: { connect: { id: wallet.id } } }
    });

    return res.status(201).json({
      message: "Client registered successfully. OTP has been sent.",
      user: {
        ...newUser,
        imageUrl: newClient.image?.image_url || null,
        wallet: { id: wallet.id, balance: wallet.balance },
        price: 0
      }
    });
    
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Register a new vendor owner user
const registerVendorOwner = async (req, res) => {
  try {
    const { name, phone_number, email, password, type = "vendor_owner" } = req.body;

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

    // Send OTP before creating any records
    try {
      const { sendOtp } = require("../utils/otp.util");
      await sendOtp(phone_number, 'sms');
    } catch (otpErr) {
      return res.status(502).json({ error: "Failed to send OTP. Please try again." });
    }

    // Upload image if available (after OTP successfully sent)
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

    // Create wallet for vendor owner
    const wallet = await prisma.wallet.create({
      data: {
        user_id: newUser.id,
        balance: 0.0,
        status: 'active'
      }
    });

    return res.status(201).json({
      message: "Vendor owner registered successfully. OTP has been sent.",
      user: {
        ...newUser,
        imageUrl: imageRecord?.image_url || null,
        wallet: { id: wallet.id, balance: wallet.balance },
      }
    });
    
  } catch (error) {
    console.error("Register vendor error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Register a new driver user
const registerAsDriver = async (req, res) => {
  try {
    // Validate request body
    const { error } = driverRegistrationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, phone_number, email, password, vehicle_info, type = "driver" } = req.body;

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

    // Upload images if available
    const imageFields = ["profile_image", "license_image", "fayda_image"];
    const uploadedImages = await uploadImages(req.files, imageFields);

    // Check if all required images are provided
    const requiredImages = ["profile_image", "license_image", "fayda_image"];
    const missingImages = requiredImages.filter(field => !uploadedImages[field]?.url);
    
    if (missingImages.length > 0) {
      return res.status(400).json({
        error: `Missing required images: ${missingImages.join(', ')}`,
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
        is_verified: true, // Driver registration without OTP
        isotpVerified: true, // Skip OTP verification
      },
    });

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
        isApproved: false, // Set approved to false by default
        current_status: 'offline', // Set initial status
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
      message: "Driver registered successfully. Approval pending.",
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
    console.error("Register driver error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
// Register an admin user
// We are not sending otp for admin because why?
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
      message: "Client registered successfully. OTP has been sent.",
      user: {
        ...newUser,
        imageUrl: newUser.image?.image_url || null,
      }
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Register a new employee user
const registerAsEmployee = async (req, res) => {
  try {
    const { name, phone_number, email, password, type = "employee" } = req.body;

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

    // Send OTP before creating any records
    try {
      const { sendOtp } = require("../utils/otp.util");
      await sendOtp(phone_number, 'sms');
    } catch (otpErr) {
      return res.status(502).json({ error: "Failed to send OTP. Please try again." });
    }

    // Upload image if available (after OTP successfully sent)
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

    // Create wallet for employee
    const wallet = await prisma.wallet.create({
      data: {
        user_id: newUser.id,
        balance: 0.0,
        status: 'active'
      }
    });

    return res.status(201).json({
      message: "Employee registered successfully. OTP has been sent.",
      user: {
        ...newUser,
        imageUrl: imageRecord?.image_url || null,
        wallet: { id: wallet.id, balance: wallet.balance },
      }
    });
    
  } catch (error) {
    console.error("Register employee error:", error);
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
    if (!user.isotpVerified && user.type !== 'admin') {
      return res.status(401).json({ error: "OTP not verified. Please Verify OTP" });
      // OTP verification is not required for admin users
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

// Add: verify OTP and update user status
const verifyOtp = async (req, res) => {
  try {
    const { phone_number, code } = req.body;

    // Ensure user exists
    const user = await prisma.user.findUnique({ where: { phone_number } });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Lazy-load util to avoid env errors during app boot if Twilio envs are missing
    const { verifyOtp: verifyOtpUtil } = require("../utils/otp.util");

    const approved = await verifyOtpUtil(phone_number, code);
    if (!approved) {
      return res.status(400).json({ error: "Invalid or expired OTP code." });
    }

    // Update user flags
    const updated = await prisma.user.update({
      where: { phone_number },
      data: {
        isotpVerified: true,
        is_verified: true,
      },
      select: {
        id: true,
        phone_number: true,
        isotpVerified: true,
        is_verified: true,
        type: true,
      }
    });

    return res.status(200).json({
      message: "OTP verified successfully.",
      user: updated,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Resend OTP for a given phone number
const resendOtp = async (req, res) => {
  try {
    const { phone_number, channel = 'sms' } = req.body;

    // Check user existence
    const user = await prisma.user.findUnique({ where: { phone_number } });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // If already verified, no need to resend
    if (user.isotpVerified || user.is_verified) {
      return res.status(400).json({ error: "User already verified." });
    }

    // Send OTP
    const { sendOtp } = require("../utils/otp.util");
    await sendOtp(phone_number, channel);

    return res.status(200).json({ message: "OTP resent successfully." });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {resendOtp, registerAsClient, login, registerAsAdmin, registerAsDriver, registerVendorOwner, registerAsEmployee, verifyOtp };
