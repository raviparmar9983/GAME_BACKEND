import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    hash: {
      type: String,
      required: true,
    },
    coins: {
      type: Number,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: { type: Boolean, default: false },
    passwordResetToken: { type: String },
    passwordResetTokenExpires: { type: Date },
  },
  {
    timestamps: true,
  },
);

export { UserSchema };
