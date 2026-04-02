const express = require('express');
const auth = require('../middleware/auth');
const Note = require('../models/Note');
const Lead = require('../models/Lead');
const router = express.Router();

// Validation helper
const validateNote = (text, followUpDate) => {
  const errors = [];
  if (!text || text.trim().length === 0) errors.push('Note text cannot be empty');
  if (text && text.length > 2000) errors.push('Note text exceeds 2000 characters');
  if (followUpDate && isNaN(new Date(followUpDate).getTime())) {
    errors.push('Invalid follow-up date');
  }
  return errors;
};

// @route   GET /api/leads/:id/notes
// @desc    Get all notes for a specific lead
// @access  Private
router.get('/leads/:id/notes', auth, async (req, res) => {
  try {
    // Verify lead exists
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const notes = await Note.find({ leadId: req.params.id })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'email'); // optional

    res.json({ success: true, data: notes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/leads/:id/notes
// @desc    Add a new note to a lead
// @access  Private
router.post('/leads/:id/notes', auth, async (req, res) => {
  const { noteText, followUpDate } = req.body;
  const errors = validateNote(noteText, followUpDate);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const note = new Note({
      leadId: lead._id,
      noteText: noteText.trim(),
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      createdBy: req.user.id,
    });
    await note.save();

    res.status(201).json({ success: true, data: note });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/notes/:id
// @desc    Edit an existing note (only noteText and followUpDate)
// @access  Private
router.put('/notes/:id', auth, async (req, res) => {
  const { noteText, followUpDate } = req.body;
  const errors = validateNote(noteText, followUpDate);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    // Optional: check if user owns the note (if createdBy is used)
    // if (note.createdBy && note.createdBy.toString() !== req.user.id) {
    //   return res.status(403).json({ success: false, message: 'Not authorized' });
    // }

    note.noteText = noteText.trim();
    if (followUpDate) note.followUpDate = new Date(followUpDate);
    else if (followUpDate === null) note.followUpDate = null;
    await note.save();

    res.json({ success: true, data: note });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/notes/:id
// @desc    Delete a note
// @access  Private
router.delete('/notes/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    // Optional ownership check
    // if (note.createdBy && note.createdBy.toString() !== req.user.id) {
    //   return res.status(403).json({ success: false, message: 'Not authorized' });
    // }

    await note.deleteOne();
    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/notes/upcoming
// @desc    Get all notes with follow-up date in the future (global)
// @access  Private
router.get('/notes/upcoming', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const notes = await Note.find({
      followUpDate: { $gte: today },
    })
      .sort({ followUpDate: 1 })
      .populate('leadId', 'name email');
    res.json({ success: true, data: notes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;