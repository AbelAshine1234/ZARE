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

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
