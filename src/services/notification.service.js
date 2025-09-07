const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const listByUser = async ({ userId, page = 1, limit = 20, is_read }) => {
  const skip = (Number(page) - 1) * Number(limit);
  const where = {
    user_id: Number(userId),
    ...(typeof is_read === 'boolean' ? { is_read } : {}),
  };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { created_at: 'desc' },
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  };
};

const getUnreadCount = async (userId) => {
  const count = await prisma.notification.count({
    where: { user_id: Number(userId), is_read: false },
  });
  return { count };
};

const markAsRead = async (id) => {
  const updated = await prisma.notification.update({
    where: { id: Number(id) },
    data: { is_read: true },
  });
  return { notification: updated };
};

const markAsUnread = async (id) => {
  const updated = await prisma.notification.update({
    where: { id: Number(id) },
    data: { is_read: false },
  });
  return { notification: updated };
};

const markAllReadForUser = async (userId) => {
  const result = await prisma.notification.updateMany({
    where: { user_id: Number(userId), is_read: false },
    data: { is_read: true },
  });
  return { updated: result.count };
};

const createNotification = async ({ user_id, type, title, message }) => {
  if (!user_id || !title || !message) {
    const err = new Error('user_id, title and message are required');
    err.statusCode = 400;
    throw err;
  }
  const notification = await prisma.notification.create({
    data: {
      user_id: Number(user_id),
      type: type || 'general',
      title: String(title),
      message: String(message),
    },
  });
  return { notification };
};

const deleteNotification = async (id) => {
  await prisma.notification.delete({ where: { id: Number(id) } });
  return { success: true };
};

module.exports = {
  listByUser,
  getUnreadCount,
  markAsRead,
  markAsUnread,
  markAllReadForUser,
  createNotification,
  deleteNotification,
};
