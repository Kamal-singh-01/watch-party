import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Protects HTTP routes. Reads the JWT from "Authorization: Bearer <token>".
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.headers.token) {
    token = req.headers.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not Authorized, Login Again" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(401).json({ success: false, message: "User no longer exists" });
    }
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Token invalid" });
  }
};
