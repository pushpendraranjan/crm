const express = require('express');
const { body } = require('express-validator');
const {
  createFollowUp,
  getFollowUpsByLead,
  getAllFollowUps,
  updateFollowUp,
  deleteFollowUp,
} = require('../controllers/followUpController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const followUpValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('status').optional().isIn(['Pending', 'Done', 'Cancelled']).withMessage('Invalid status'),
];

router.get('/', protect, getAllFollowUps);
router.get('/lead/:leadId', protect, getFollowUpsByLead);
router.post('/lead/:leadId', protect, followUpValidation, validate, createFollowUp);
router.put('/:id', protect, followUpValidation, validate, updateFollowUp);
router.delete('/:id', protect, deleteFollowUp);

module.exports = router;
