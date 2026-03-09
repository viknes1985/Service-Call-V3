import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import axios from "axios";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Configuration ---
const MONGODB_URI = process.env.MONGODB_URI || "";
const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
const resend = new Resend(process.env.RESEND_API_KEY);

// --- MongoDB Connection ---
mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- Mongoose Schemas ---
const UserSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  firstName: String,
  lastName: String,
  mobileNumber: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  resetCode: String,
  resetCodeExpires: Number
}, { _id: false });
const User = mongoose.model("User", UserSchema);

const ServiceSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  state: String,
  town: String,
  category: String,
  providerName: String,
  description: String,
  contactNumber: String,
  operatingHours: String,
  photoUrls: [String], 
  createdBy: { type: String, ref: 'User' },
  createdAt: { type: Number, default: Date.now }
}, { _id: false });
const Service = mongoose.model("Service", ServiceSchema);

const RatingSchema = new mongoose.Schema({
  serviceId: { type: String, ref: 'Service' },
  userId: { type: String, ref: 'User' },
  rating: Number,
  createdAt: { type: Number, default: Date.now }
});
RatingSchema.index({ serviceId: 1, userId: 1 }, { unique: true });
const Rating = mongoose.model("Rating", RatingSchema);

// --- Helper: ImgBB Upload ---
const saveToImgBB = async (base64Str: string): Promise<string> => {
  if (!base64Str || !base64Str.startsWith('data:image')) return base64Str;
  try {
    const base64Data = base64Str.split(',')[1];
    const formData = new URLSearchParams();
    formData.append("image", base64Data);
    const response = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, formData);
    return response.data.data.url;
  } catch (error: any) {
    console.error("ImgBB Upload Error:", error.message);
    return "";
  }
};

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  app.use(express.json({ limit: '10mb' }));

  // --- Auth Routes ---
  app.post("/api/auth/signup", async (req, res) => {
    const id = Math.random().toString(36).substring(2, 15);
    try {
      const newUser = new User({ ...req.body, _id: id });
      await newUser.save();
      res.json({ id, ...req.body });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email, password });
      if (user) {
        res.json(user);
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ error: "Email not found" });

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      user.resetCode = code;
      user.resetCodeExpires = Date.now() + 600000;
      await user.save();

      await resend.emails.send({
        from: 'Service Call <onboarding@resend.dev>',
        to: [email],
        subject: 'Password Reset Code',
        html: `<p>Your reset code is: <strong>${code}</strong></p>`
      });
      res.json({ message: "Code sent" });
    } catch (err) {
      res.status(500).json({ error: "Failed to process reset" });
    }
  });

  // --- Service Routes ---
  app.get("/api/services", async (req, res) => {
    const { state, town, category, search, createdBy } = req.query;
    let filter: any = {};
    if (state) filter.state = state;
    if (town) filter.town = town;
    if (category) filter.category = category;
    if (createdBy) filter.createdBy = createdBy;
    if (search) {
      filter.$or = [
        { providerName: new RegExp(search as string, 'i') },
        { description: new RegExp(search as string, 'i') }
      ];
    }

    try {
      const services = await Service.find(filter).sort({ createdAt: -1 });
      const enriched = await Promise.all(services.map(async (s: any) => {
        const ratings = await Rating.find({ serviceId: s._id });
        const userObj = await User.findById(s.createdBy);
        return {
          ...s.toObject(),
          id: s._id,
          creatorName: userObj ? `${userObj.firstName} ${userObj.lastName}` : "Unknown",
          avgRating: ratings.length ? ratings.reduce((a, b) => a + b.rating, 0) / ratings.length : 0,
          ratingCount: ratings.length
        };
      }));
      res.json(enriched);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/services", async (req, res) => {
    const id = Math.random().toString(36).substring(2, 15);
    try {
      const processedUrls = await Promise.all((req.body.photoUrls || []).map((url: string) => saveToImgBB(url)));
      const newService = new Service({
        ...req.body,
        _id: id,
        photoUrls: processedUrls.filter(u => u !== "")
      });
      await newService.save();
      res.json({ id, photoUrls: processedUrls });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/services/:id", async (req, res) => {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  });

  // --- Top Categories Route ---
  app.get("/api/top-categories", async (req, res) => {
    try {
      const topCategories = await Service.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            thumbnails: { $push: { $arrayElemAt: ["$photoUrls", 0] } }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 6 },
        {
          $project: {
            _id: 0,
            category: "$_id",
            count: 1,
            thumbnails: { $slice: ["$thumbnails", 4] }
          }
        }
      ]);
      res.json(topCategories);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Production Build Handling ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));
}

startServer();
