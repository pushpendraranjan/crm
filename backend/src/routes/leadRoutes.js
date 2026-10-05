const express = require('express');
const { body, query } = require('express-validator');
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

const leadQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional({ checkFalsy: true }).isIn(['New', 'Contacted', 'Followup', 'Converted', 'Lost']).withMessage('Invalid status'),
  query('location').optional().isString().trim(),
  query('propertyType').optional().isString().trim(),
  query('assignedToId').optional().isString().trim(),
  query('sortBy').optional().isIn(['createdAt', 'name', 'status', 'budget', 'followupDate']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Invalid sort order'),
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
router.get('/', protect, leadQueryValidation, validate, getLeads);
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
