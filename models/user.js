const { string } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  firstAccess: {
    type: Boolean,
    required: true,
    default: true,
  },
});

module.exports = mongoose.model("User", UserSchema);
