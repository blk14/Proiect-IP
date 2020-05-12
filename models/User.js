const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  amount: {
    type: Number,
    default: 5
  },
  history: {
    type: [String],
    default: []

  }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
