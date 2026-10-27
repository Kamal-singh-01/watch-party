import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true, minlength: 2, maxlength: 24 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // bcrypt hash
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
