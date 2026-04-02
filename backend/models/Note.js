const mongoose = require('mongoose');

/**
 * Note Schema
 * Stores follow‑up notes for each lead.
 */
const NoteSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Lead ID is required'],
      index: true,
    },
    noteText: {
      type: String,
      required: [true, 'Note text cannot be empty'],
      trim: true,
      maxlength: [2000, 'Note cannot exceed 2000 characters'],
    },
    followUpDate: {
      type: Date,
      default: null,
      validate: {
        validator: function (value) {
          return value === null || value instanceof Date;
        },
        message: 'Follow‑up date must be a valid date or null',
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
  }
);

// Pre‑save middleware to update timestamps
NoteSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Pre‑find middleware to automatically populate lead info if needed
NoteSchema.pre(/^find/, function (next) {
  // Optionally populate lead name and email (not required but useful)
  // this.populate({ path: 'leadId', select: 'name email' });
  next();
});

// Static method to delete all notes for a given lead
NoteSchema.statics.deleteByLeadId = async function (leadId) {
  const result = await this.deleteMany({ leadId });
  return result.deletedCount;
};

// Instance method to update note text
NoteSchema.methods.updateText = function (newText) {
  if (!newText || newText.trim().length === 0) {
    throw new Error('Note text cannot be empty');
  }
  this.noteText = newText.trim();
  this.updatedAt = Date.now();
  return this.save();
};

// Query helper for notes after a specific date
NoteSchema.query.afterDate = function (date) {
  return this.where('createdAt').gte(date);
};

// Indexes
NoteSchema.index({ leadId: 1, createdAt: -1 });
NoteSchema.index({ followUpDate: 1 });

module.exports = mongoose.model('Note', NoteSchema);