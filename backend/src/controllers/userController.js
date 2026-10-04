const prisma = require('../config/db');

const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
    res.json({ users });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers };
