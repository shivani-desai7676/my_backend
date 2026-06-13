const mongoose = require("mongoose");

const FileShareSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "File"
  },
  token: String,
  link: String,
  expiresAt: {
    type: Date,
    expires: 0
  }
}, { timestamps: true });

module.exports = mongoose.model("FileShare", FileShareSchema);
