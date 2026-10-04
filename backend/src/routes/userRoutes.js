const express = require('express');
const { getUsers } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, adminOnly, getUsers);

module.exports = router;
