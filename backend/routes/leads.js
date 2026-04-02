const express = require('express');
const auth = require('../middleware/auth');
const Lead = require('../models/Lead');
const Note = require('../models/Note');
const router = express.Router();

// Helper: validate lead data
const validateLead = (data) => {
  const errors = [];
  if (!data.name || data.name.trim().length === 0) errors.push('Name is required');
  if (!data.email) errors.push('Email is required');
  else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.email))
    errors.push('Invalid email format');
  if (data.source && data.source.length > 200) errors.push('Source too long');
  if (data.status && !['new', 'contacted', 'converted'].includes(data.status))
    errors.push('Invalid status');
  return errors;
};

// @route   GET /api/leads
// @desc    Get all leads with filtering, sorting, pagination
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = Lead.find();

    // Filter by status
    if (req.query.status && ['new', 'contacted', 'converted'].includes(req.query.status)) {
      query = query.where('status').equals(req.query.status);
    }

    // Filter by date range (createdAt)
    if (req.query.fromDate) {
      query = query.where('createdAt').gte(new Date(req.query.fromDate));
    }
    if (req.query.toDate) {
      query = query.where('createdAt').lte(new Date(req.query.toDate));
    }

    // Search by name or email
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query = query.or([
        { name: searchRegex },
        { email: searchRegex },
      ]);
    }

    // Sorting
    const sortField = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;
    query = query.sort({ [sortField]: sortOrder });

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);

    const leads = await query.exec();
    const total = await Lead.countDocuments(query.getFilter());

    res.json({
      success: true,
      data: leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('GET /leads error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/leads/stats
// @desc    Get lead statistics (counts by status)
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const counts = await Lead.getStatusCounts();
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    res.json({ success: true, stats: counts, totalLeads: total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/leads/:id
// @desc    Get a single lead by ID with its notes
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    const notes = await Note.find({ leadId: lead._id }).sort({ createdAt: -1 });
    res.json({ success: true, lead, notes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/leads
// @desc    Create a new lead (e.g., from contact form)
// @access  Private (could be public, but we protect for CRM)
router.post('/', auth, async (req, res) => {
  const errors = validateLead(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  try {
    // Check if lead with same email already exists
    const existing = await Lead.findOne({ email: req.body.email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Lead with this email already exists' });
    }

    const lead = new Lead({
      name: req.body.name.trim(),
      email: req.body.email.toLowerCase(),
      source: req.body.source || 'Portfolio Contact Form',
      status: req.body.status || 'new',
    });
    await lead.save();
    res.status(201).json({ success: true, data: lead });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/leads/:id
// @desc    Update lead details (name, email, source)
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const updates = {};
  if (req.body.name) updates.name = req.body.name.trim();
  if (req.body.email) updates.email = req.body.email.toLowerCase();
  if (req.body.source) updates.source = req.body.source.trim();
  if (req.body.status) updates.status = req.body.status;

  // Validate email if provided
  if (updates.email && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(updates.email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }

  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    res.json({ success: true, data: lead });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/leads/:id/status
// @desc    Update lead status (specific endpoint required by task)
// @access  Private
router.put('/:id/status', auth, async (req, res) => {
  const { status } = req.body;
  if (!status || !['new', 'contacted', 'converted'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value' });
  }

  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    lead.status = status;
    await lead.save();
    res.json({ success: true, data: lead });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/leads/:id
// @desc    Delete a lead and all associated notes
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Delete associated notes
    await Note.deleteByLeadId(lead._id);
    await lead.deleteOne();

    res.json({ success: true, message: 'Lead and associated notes deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;