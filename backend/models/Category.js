import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Category type is required'],
      enum: ['expense', 'income'],
    },
    icon: {
      type: String,
      default: '💰',
    },
    color: {
      type: String,
      default: '#6366f1',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Nullable for global categories
      default: null,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
categorySchema.index({ userId: 1, type: 1 });
categorySchema.index({ userId: null, type: 1 }); // For global categories

const Category = mongoose.model('Category', categorySchema);

export default Category;
