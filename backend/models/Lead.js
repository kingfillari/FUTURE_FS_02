const mongoose = require('mongoose');

/**
 * Lead Schema
 * Represents a client lead generated from a contact form or other source.
 */
const LeadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    source: {
      type: String,
      default: 'Portfolio Contact Form',
      trim: true,
      maxlength: [200, 'Source cannot exceed 200 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['new', 'contacted', 'converted'],
        message: 'Status must be either new, contacted, or converted',
      },
      default: 'new',
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
    toObject: { virtuals: true },
  }
);

// Update the updatedAt field on save
LeadSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for notes associated with this lead
LeadSchema.virtual('notes', {
  ref: 'Note',
  localField: '_id',
  foreignField: 'leadId',
  justOne: false,
});

// Static method to get lead count by status
LeadSchema.statics.getStatusCounts = async function () {
  const counts = await this.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const result = { new: 0, contacted: 0, converted: 0 };
  counts.forEach((item) => {
    if (item._id in result) result[item._id] = item.count;
  });
  return result;
};

// Instance method to change status with validation
LeadSchema.methods.changeStatus = function (newStatus) {
  const allowed = ['new', 'contacted', 'converted'];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid status. Allowed: ${allowed.join(', ')}`);
  }
  this.status = newStatus;
  return this.save();
};

// Query helper for filtering by status
LeadSchema.query.byStatus = function (status) {
  return this.where({ status });
};

// Index for efficient sorting and filtering
LeadSchema.index({ email: 1 });
LeadSchema.index({ status: 1 });
LeadSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Lead', LeadSchema);