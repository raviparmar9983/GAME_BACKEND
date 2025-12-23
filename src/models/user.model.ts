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
    loginStreak: { type: Number, default: 0 },
    lastLoginRewardAt: { type: Date },
    isEmailVerified: { type: Boolean, default: false },
    passwordResetToken: { type: String },
    passwordResetTokenExpires: { type: Date },
  },
  {
    timestamps: true,
  },
);

export { UserSchema };
