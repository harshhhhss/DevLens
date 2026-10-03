const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    // GitHub OAuth token, encrypted at rest by services/tokenCrypto.js.
    // select:false so it is never returned by an ordinary query, and never
    // serialised into an API response by accident.
    githubToken: {
      type: String,
      select: false,
      default: null,
    },
    // Safe for the frontend to read: says whether a token exists without
    // exposing it.
    githubConnected: {
      type: Boolean,
      default: false,
    },
    githubLogin: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Reuse an already-compiled model so re-evaluating this module (test runners,
// hot reload) does not throw OverwriteModelError.
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
