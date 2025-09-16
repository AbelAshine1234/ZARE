// src/services/user.service.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { uploadImageToCloudinary } = require('../utils/cloudinary');

require('dotenv').config();

/**
 * Find a user by phone number or email.
 * @param {string} phone_number
 * @param {string} email (optional)
 * @returns {Promise<User|null>}
 */
const findUserByPhoneOrEmailService = async (phone_number, email) => {
  return prisma.user.findFirst({
    where: {
      OR: [
        { phone_number },
        ...(email ? [{ email }] : []),
      ],
    },
  });
};

/**
 * Create a new user, optionally uploading profile image.
 * @param {object} userData - { name, phone_number, email, password, type }
 * @param {Buffer} pictureFile - Optional image buffer
 * @returns {Promise<{ newUser: User, imageRecord: Image|null }>}
 */
const createUserService = async (userData, pictureFile) => {
  const { phone_number, email, password } = userData;

  // Check if user exists
  const existingUser = await findUserByPhoneOrEmailService(phone_number, email);
  if (existingUser) {
    const error = new Error('UserExists');
    error.statusCode = 409;
    throw error;
  }

  // Upload image if exists
  let imageRecord = null;
  if (pictureFile) {
    const imageUrl = await uploadImageToCloudinary(pictureFile.buffer, `${phone_number}_profile`);
    imageRecord = await prisma.image.create({ data: { image_url: imageUrl } });
  }

  // Hash password securely
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user record
  const newUser = await prisma.user.create({
    data: {
      ...userData,
      password: hashedPassword,
    },
  });

  return { newUser, imageRecord };
};

/**
 * Register a client user along with related client entity and image.
 * @param {object} data - user data
 * @param {Buffer} pictureFile - optional image file buffer
 * @returns {Promise<{ newUser: User, newClient: Client }>}
 */
const registerClientService = async (data, pictureFile) => {
  const { newUser, imageRecord } = await createUserService({ ...data, type: 'client' }, pictureFile);

  // Create wallet for client
  const wallet = await prisma.wallet.create({
    data: {
      user_id: newUser.id,
      balance: 0.0,
      status: 'active'
    }
  });

  const newClient = await prisma.client.create({
    data: {
      user: { connect: { id: newUser.id } },
      wallet: { connect: { id: wallet.id } },
      ...(imageRecord && { image: { connect: { id: imageRecord.id } } }),
    },
    include: { user: true, image: true, wallet: true },
  });

  return { newUser, newClient };
};

/**
 * Register an admin user.
 * @param {object} data - user data
 * @param {Buffer} pictureFile - optional image file buffer
 * @returns {Promise<User>}
 */
const registerAdminService = async (data, pictureFile) => {
  const { newUser } = await createUserService({ ...data, type: 'admin' }, pictureFile);
  return newUser;
};

/**
 * Authenticate user by phone number and password, returning JWT token on success.
 * @param {string} phone_number
 * @param {string} password
 * @returns {Promise<{ user: User, token: string }>}
 */
const loginUserService = async (phone_number, password) => {
  const user = await prisma.user.findUnique({
    where: { phone_number },
    include: { client: { include: { image: true } } },
  });

  if (!user) {
    const error = new Error('InvalidCredentials');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('InvalidCredentials');
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign({ id: user.id, type: user.type }, process.env.SECRET_KEY, {
    expiresIn: '7d',
  });

  return { user, token };
};

/**
 * Get all users.
 * @returns {Promise<User[]>}
 */
const getAllUsersService = () => prisma.user.findMany();

/**
 * Get a user by ID.
 * @param {string|number} id
 * @returns {Promise<User|null>}
 */
const getUserByIdService = (id) => prisma.user.findUnique({
  where: { id: parseInt(id) },
  include: {
    wallet: true,
    paymentMethods: true,
    client: { include: { wallet: true, image: true } },
    vendor: {
      include: {
        wallet: true,
        subscription: true,
        vendorCategories: { include: { category: true } },
      }
    },
    driver: {
      include: {
        wallet: true,
        profile_image: true,
        license_image: true,
        fayda_image: true,
        deliveries: { take: 5, orderBy: { id: 'desc' } }
      }
    },
    employee: { include: { vendor: true } },
  }
});

/**
 * Update a user by ID.
 * @param {string|number} id
 * @param {object} data - fields to update
 * @returns {Promise<User>}
 */
const updateUserService = (id, data) => prisma.user.update({
  where: { id: parseInt(id) },
  data,
});

/**
 * Delete a user by ID.
 * @param {string|number} id
 * @returns {Promise<User>}
 */
const deleteUserService = async (id) => {
  const userId = parseInt(id);

  // Step 1: Delete single-dependent records first
  await prisma.client.deleteMany({ where: { user_id: userId } });
  await prisma.vendor.deleteMany({ where: { user_id: userId } });
  await prisma.driver.deleteMany({ where: { user_id: userId } });
  await prisma.employee.deleteMany({ where: { user_id: userId } });
  await prisma.wallet.deleteMany({ where: { user_id: userId } });

  // Step 2: Delete child collections
  await prisma.wishlist.deleteMany({ where: { user_id: userId } });
  await prisma.adsYouMightBeInterestedIn.deleteMany({ where: { user_id: userId } });
  await prisma.searchHistory.deleteMany({ where: { user_id: userId } });
  await prisma.notification.deleteMany({ where: { user_id: userId } });
  await prisma.chat.deleteMany({ where: { sender_id: userId } });
  await prisma.chat.deleteMany({ where: { receiver_id: userId } });
  await prisma.complaint.deleteMany({ where: { issued_by_id: userId } });
  await prisma.complaint.deleteMany({ where: { issued_to_id: userId } });
  await prisma.refund.deleteMany({ where: { processed_by_id: userId } });
  await prisma.cashOutRequest.deleteMany({ where: { user_id: userId } });
  await prisma.deliveryStatusLog.deleteMany({ where: { updated_by_id: userId } });

  // Step 3: Delete the user itself
  return prisma.user.delete({
    where: { id: userId },
  });
};

module.exports = {
  findUserByPhoneOrEmailService,
  createUserService,
  registerClientService,
  registerAdminService,
  loginUserService,
  getAllUsersService,
  getUserByIdService,
  updateUserService,
  deleteUserService,
};
