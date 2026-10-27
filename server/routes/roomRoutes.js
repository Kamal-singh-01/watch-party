import express from "express";
import { createRoom, checkRoom } from "../controllers/roomController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createRoom);
router.get("/:code", protect, checkRoom);

export default router;
