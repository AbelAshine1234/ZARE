// src/controllers/user.controller.js

const {
  getAllUsersService,
  getUserByIdService,
  updateUserService,
  deleteUserService,
} = require('../services/user.service');

// Get all users
const getUsers = async (_req, res) => {
  try {
    const users = await getAllUsersService();
    return res.status(200).json(users);
  } catch (error) {
    console.error('getUsers error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Admin: Create an employee user and employee record
const createEmployeeAdmin = async (req, res) => {
  try {
    const { name, phone_number, email, password, vendor_id, role } = req.body || {};
    if (!phone_number || !vendor_id || !role) {
      return res.status(400).json({ error: 'phone_number, vendor_id, and role are required' });
    }
    const effectivePassword = password || 'password';
    const defaultPasswordUsed = !password;
    const { createUserService } = require('../services/user.service');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const { newUser } = await createUserService({ name, phone_number, email, password: effectivePassword, type: 'employee', is_verified: true, isotpVerified: true });
    const employee = await prisma.employee.create({
      data: {
        role,
        vendor: { connect: { id: Number(vendor_id) } },
        user: { connect: { id: newUser.id } },
      },
      include: { vendor: true, user: true }
    });
    return res.status(201).json({ user: { id: newUser.id, name: newUser.name, phone_number: newUser.phone_number, email: newUser.email, type: newUser.type, is_verified: true }, employee, defaultPassword: defaultPasswordUsed ? effectivePassword : null });
  } catch (error) {
    if (error?.statusCode === 409) return res.status(409).json({ error: 'User already exists' });
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Vendor not found' });
    console.error('createEmployeeAdmin error:', error);
    return res.status(500).json({ error: 'Failed to create employee' });
  }
};

// Admin: Create a vendor owner user
const createVendorOwnerAdmin = async (req, res) => {
  try {
    const { name, phone_number, email, password } = req.body || {};
    if (!phone_number) {
      return res.status(400).json({ error: 'phone_number is required' });
    }
    const effectivePassword = password || 'password';
    const defaultPasswordUsed = !password;
    const { createUserService } = require('../services/user.service');
    const { newUser } = await createUserService({ name, phone_number, email, password: effectivePassword, type: 'vendor_owner', is_verified: true, isotpVerified: true });
    return res.status(201).json({ user: { id: newUser.id, name: newUser.name, phone_number: newUser.phone_number, email: newUser.email, type: newUser.type, is_verified: true }, defaultPassword: defaultPasswordUsed ? effectivePassword : null });
  } catch (error) {
    if (error?.statusCode === 409) return res.status(409).json({ error: 'User already exists' });
    console.error('createVendorOwnerAdmin error:', error);
    return res.status(500).json({ error: 'Failed to create vendor owner' });
  }
};

// Admin: Create a driver user and driver record (and wallet)
const createDriverAdmin = async (req, res) => {
  try {
    const { name, phone_number, email, password, current_status } = req.body || {};
    if (!phone_number) {
      return res.status(400).json({ error: 'phone_number is required' });
    }
    const effectivePassword = password || 'password';
    const defaultPasswordUsed = !password;
    const { createUserService } = require('../services/user.service');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const { newUser } = await createUserService({ name, phone_number, email, password: effectivePassword, type: 'driver', is_verified: true, isotpVerified: true });
    // create wallet for driver
    const wallet = await prisma.wallet.create({ data: { user_id: newUser.id, balance: 0.0, status: 'active' } });
    const driver = await prisma.driver.create({
      data: {
        current_status: current_status || 'available',
        user: { connect: { id: newUser.id } },
        wallet: { connect: { id: wallet.id } },
      },
      include: { user: true, wallet: true }
    });
    return res.status(201).json({ user: { id: newUser.id, name: newUser.name, phone_number: newUser.phone_number, email: newUser.email, type: newUser.type, is_verified: true }, driver, defaultPassword: defaultPasswordUsed ? effectivePassword : null });
  } catch (error) {
    if (error?.statusCode === 409) return res.status(409).json({ error: 'User already exists' });
    console.error('createDriverAdmin error:', error);
    return res.status(500).json({ error: 'Failed to create driver' });
  }
};

// Admin: Create a client user
const createClientAdmin = async (req, res) => {
  try {
    const { name, phone_number, email, password } = req.body || {};
    if (!phone_number) {
      return res.status(400).json({ error: 'phone_number is required' });
    }
    const effectivePassword = password || 'password';
    const defaultPasswordUsed = !password;
    const { registerClientService } = require('../services/user.service');
    const { newUser, newClient } = await registerClientService({ name, phone_number, email, password: effectivePassword, is_verified: true, isotpVerified: true });
    return res.status(201).json({ user: { id: newUser.id, name: newUser.name, phone_number: newUser.phone_number, email: newUser.email, type: newUser.type, is_verified: true }, client: newClient, defaultPassword: defaultPasswordUsed ? effectivePassword : null });
  } catch (error) {
    if (error?.statusCode === 409) return res.status(409).json({ error: 'User already exists' });
    console.error('createClientAdmin error:', error);
    return res.status(500).json({ error: 'Failed to create client' });
  }
};
// Update a user's payment method (admin only)
const updateUserPaymentMethod = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const pmId = parseInt(req.params.pmId);
    if (!Number.isInteger(userId) || !Number.isInteger(pmId)) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // ensure pm belongs to this user
    const exists = await prisma.paymentMethod.findFirst({
      where: { id: pmId, users: { some: { id: userId } } },
      select: { id: true }
    });
    if (!exists) return res.status(404).json({ error: 'Payment method not found for this user' });

    const { name, account_number, account_holder, type, details } = req.body || {};
    const updated = await prisma.paymentMethod.update({
      where: { id: pmId },
      data: { name, account_number, account_holder, type, details }
    });
    return res.status(200).json({ payment_method: updated });
  } catch (error) {
    console.error('updateUserPaymentMethod error:', error);
    return res.status(500).json({ error: 'Failed to update payment method', detail: error.message });
  }
};

// Delete a user's payment method (admin only)
const deleteUserPaymentMethod = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const pmId = parseInt(req.params.pmId);
    if (!Number.isInteger(userId) || !Number.isInteger(pmId)) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // ensure pm belongs to this user
    const exists = await prisma.paymentMethod.findFirst({
      where: { id: pmId, users: { some: { id: userId } } },
      select: { id: true }
    });
    if (!exists) return res.status(404).json({ error: 'Payment method not found for this user' });

    await prisma.paymentMethod.delete({ where: { id: pmId } });
    return res.status(200).json({ message: 'Payment method deleted', id: pmId });
  } catch (error) {
    console.error('deleteUserPaymentMethod error:', error);
    if (error.code === 'P2025') return res.status(404).json({ error: 'Payment method not found' });
    return res.status(500).json({ error: 'Failed to delete payment method', detail: error.message });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await getUserByIdService(id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    return res.status(200).json(user);
  } catch (error) {
    console.error('getUserById error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Update user
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  try {
    const updatedUser = await updateUserService(id, { name, email });
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('updateUser error:', error);
    if (error.code === 'P2025') {
      // Prisma record not found error
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.status(500).json({ error: error.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    await deleteUserService(id);
    return res.status(204).send();
  } catch (error) {
    console.error('deleteUser error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.status(500).json({ error: error.message });
  }
};

 

// Add a payment method to a user (admin only via route middleware)
const addUserPaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    if (!Number.isInteger(userId)) return res.status(400).json({ error: 'Invalid user id' });

    const { name, account_number, account_holder, type, details } = req.body || {};
    if (!name || !account_number || !account_holder) {
      return res.status(400).json({ error: 'name, account_number, and account_holder are required' });
    }

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // Ensure user exists
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const pm = await prisma.paymentMethod.create({
      data: {
        name,
        account_number,
        account_holder,
        type,
        details,
        users: { connect: { id: userId } },
      }
    });

    return res.status(201).json({ payment_method: pm });
  } catch (error) {
    console.error('addUserPaymentMethod error:', error);
    return res.status(500).json({ error: 'Failed to add payment method', detail: error.message });
  }
};

// List notes for a user (return empty object if none, similar to vendor notes behavior)
const listUserNotes = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (!Number.isInteger(userId)) return res.status(400).json({ error: 'Invalid user id' });

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const notes = await prisma.userNote.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });

    if (notes.length > 0) {
      return res.status(200).json({ notes });
    } else {
      return res.status(200).json({});
    }
  } catch (error) {
    console.error('listUserNotes error:', error);
    return res.status(500).json({ error: 'Failed to list notes' });
  }
};

// Create a note for a user
const createUserNote = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (!Number.isInteger(userId)) return res.status(400).json({ error: 'Invalid user id' });
    const { title, description } = req.body || {};
    if (!title || !description) return res.status(400).json({ error: 'title and description are required' });

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const note = await prisma.userNote.create({ data: { user_id: userId, title, description } });
    return res.status(201).json({ note });
  } catch (error) {
    console.error('createUserNote error:', error);
    return res.status(500).json({ error: 'Failed to create note' });
  }
};

// Delete a user note
const deleteUserNote = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const noteId = parseInt(req.params.noteId);
    if (!Number.isInteger(userId) || !Number.isInteger(noteId)) return res.status(400).json({ error: 'Invalid id' });

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    // Optionally verify note belongs to user
    const note = await prisma.userNote.findUnique({ where: { id: noteId }, select: { id: true, user_id: true } });
    if (!note || note.user_id !== userId) return res.status(404).json({ error: 'Note not found' });
    await prisma.userNote.delete({ where: { id: noteId } });
    return res.status(200).json({ message: 'Note deleted', id: noteId });
  } catch (error) {
    console.error('deleteUserNote error:', error);
    return res.status(500).json({ error: 'Failed to delete note' });
  }
};

// Export after all function declarations to ensure functions are defined
module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  addUserPaymentMethod,
  updateUserPaymentMethod,
  deleteUserPaymentMethod,
  listUserNotes,
  createUserNote,
  deleteUserNote,
  createClientAdmin,
  createEmployeeAdmin,
  createVendorOwnerAdmin,
  createDriverAdmin,
};
