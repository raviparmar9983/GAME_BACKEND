import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    crazyGamesId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
    },
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },
    hash: {
      type: String,
      required: false,
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
