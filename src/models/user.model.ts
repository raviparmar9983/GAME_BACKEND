import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    birthDate: {
      type: Date,
    },
    hash: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    profilePic: {
      type: String,
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
