import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    displayName: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // only for local login, never the plain password
    passwordHash: { type: String },
    authProvider: { type: String, default: 'local' },
    role: { type: String, enum: ['user', 'editor', 'admin'], default: 'user' },
    preferences: {
      theme: { type: String, default: 'light' },
      reducedMotion: { type: Boolean, default: false }
    },
    lastActiveAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// hide the password hash when a user is turned into json
userSchema.methods.toSafeJson = function toSafeJson() {
  return {
    id: this._id,
    displayName: this.displayName,
    email: this.email,
    role: this.role,
    preferences: this.preferences,
    createdAt: this.createdAt
  };
};

const User = mongoose.model('User', userSchema);

export default User;
