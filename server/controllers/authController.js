import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";

export const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed });

    res.status(201).json({
      success: true,
      message: "Account created",
      token: generateToken(user),
      user: { id: user._id, username: user.username },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user || !(await bcrypt.compare(password || "", user.password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    res.json({
      success: true,
      message: "Logged in",
      token: generateToken(user),
      user: { id: user._id, username: user.username },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req, res) => {
  res.json({ success: true, user: { id: req.user._id, username: req.user.username } });
};
