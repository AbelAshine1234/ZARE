const {
  listByUser,
  getUnreadCount,
  markAsRead,
  markAsUnread,
  markAllReadForUser,
  createNotification,
  deleteNotification,
} = require('../services/notification.service');

// List notifications for a user with pagination and optional read filter
const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, is_read } = req.query;
    const parsedRead = typeof is_read === 'string' ? is_read === 'true' ? true : is_read === 'false' ? false : undefined : undefined;

    if (!userId || isNaN(Number(userId))) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    const data = await listByUser({ userId: Number(userId), page, limit, is_read: parsedRead });
    return res.status(200).json(data);
  } catch (error) {
    console.error('getUserNotifications error:', error);
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
};

// Unread count for a user
const getUserUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId || isNaN(Number(userId))) {
      return res.status(400).json({ error: 'Invalid userId' });
    }
    const data = await getUnreadCount(Number(userId));
    return res.status(200).json(data);
  } catch (error) {
    console.error('getUserUnreadCount error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Mark a notification as read
const readNotification = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Invalid notification id' });
    }
    const data = await markAsRead(Number(id));
    return res.status(200).json(data);
  } catch (error) {
    console.error('readNotification error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Mark a notification as unread
const unreadNotification = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Invalid notification id' });
    }
    const data = await markAsUnread(Number(id));
    return res.status(200).json(data);
  } catch (error) {
    console.error('unreadNotification error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Mark all notifications as read for a user
const readAllNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId || isNaN(Number(userId))) {
      return res.status(400).json({ error: 'Invalid userId' });
    }
    const data = await markAllReadForUser(Number(userId));
    return res.status(200).json(data);
  } catch (error) {
    console.error('readAllNotifications error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Create a notification
const createUserNotification = async (req, res) => {
  try {
    const { user_id, type, title, message } = req.body;
    const data = await createNotification({ user_id, type, title, message });
    return res.status(201).json(data);
  } catch (error) {
    console.error('createUserNotification error:', error);
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
};

// Delete a notification
const deleteUserNotification = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Invalid notification id' });
    }
    const data = await deleteNotification(Number(id));
    return res.status(200).json(data);
  } catch (error) {
    console.error('deleteUserNotification error:', error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getUserNotifications,
  getUserUnreadCount,
  readNotification,
  unreadNotification,
  readAllNotifications,
  createUserNotification,
  deleteUserNotification,
};
