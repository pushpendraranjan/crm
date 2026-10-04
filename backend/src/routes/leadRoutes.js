const express = require('express');
const { body } = require('express-validator');
const {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  getDashboardStats,
} = require('../controllers/leadController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const leadValidation = [
  body('name').trim().notEmpty().withMessage('Lead name is required'),
  body('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('Valid email required'),
  body('phone').optional(),
  body('budget').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
  body('dealType').optional().isIn(['Buy', 'Rent', 'Sell']).withMessage('Invalid deal type'),
  body('status').optional().isIn(['New', 'Contacted', 'Followup', 'Converted', 'Lost']).withMessage('Invalid status'),
];

const leadUpdateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Lead name cannot be empty'),
  body('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('Valid email required'),
  body('phone').optional(),
  body('budget').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
  body('dealType').optional().isIn(['Buy', 'Rent', 'Sell']).withMessage('Invalid deal type'),
  body('status').optional().isIn(['New', 'Contacted', 'Followup', 'Converted', 'Lost']).withMessage('Invalid status'),
];

const {
  createFollowUp,
  getFollowUpsByLead,
  updateFollowUp,
  deleteFollowUp,
} = require('../controllers/followUpController');

const followUpValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('status').optional().isIn(['Pending', 'Done', 'Cancelled']).withMessage('Invalid status'),
];

router.get('/dashboard', protect, getDashboardStats);
router.get('/', protect, getLeads);
router.get('/:id', protect, getLeadById);
router.post('/', protect, leadValidation, validate, createLead);
router.put('/:id', protect, leadUpdateValidation, validate, updateLead);
router.delete('/:id', protect, deleteLead);

// Nested follow-up endpoints (/api/leads/:leadId/followups)
router.get('/:leadId/followups', protect, getFollowUpsByLead);
router.post('/:leadId/followups', protect, followUpValidation, validate, createFollowUp);
router.put('/:leadId/followups/:id', protect, followUpValidation, validate, updateFollowUp);
router.delete('/:leadId/followups/:id', protect, deleteFollowUp);

module.exports = router;
