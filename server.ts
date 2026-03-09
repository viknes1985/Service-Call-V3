import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import axios from "axios";

const db = new Database("service_call.db");

// Configuration
const IMGBB_API_KEY = "YOUR_IMGBB_API_KEY"; 

/**
 * Helper: Uploads a base64 string to ImgBB and returns the permanent URL.
 * If the string is already a URL, it simply returns it.
 */
const saveToImgBB = async (base64Str: string): Promise<string> => {
  // If it's already a URL or not a base64 image, return as is
  if (!base64Str || !base64Str.startsWith('data:image')) {
    return base64Str;
  }

  try {
    // Extract base64 data (remove the "data:image/png;base64," prefix)
    const base64Data = base64Str.split(',')[1];
    
    const formData = new URLSearchParams();
    formData.append("image", base64Data);

    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      formData
    );

    return response.data.data.url; 
  } catch (error: any) {
    console.error("ImgBB Upload Error:", error.response?.data || error.message);
    return ""; // Return empty string so we don't save broken data
  }
};

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    firstName TEXT,
    lastName TEXT,
    mobileNumber TEXT,
    email TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    state TEXT,
    town TEXT,
    category TEXT,
    providerName TEXT,
    description TEXT,
    contactNumber TEXT,
    operatingHours TEXT,
    photoUrl TEXT,
    createdBy TEXT,
    createdAt INTEGER,
    FOREIGN KEY(createdBy) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    email TEXT PRIMARY KEY,
    code TEXT,
    expiresAt INTEGER
  );

  CREATE TABLE IF NOT EXISTS ratings (
    id TEXT PRIMARY KEY,
    serviceId TEXT,
    userId TEXT,
    rating INTEGER,
    createdAt INTEGER,
    UNIQUE(serviceId, userId),
    FOREIGN KEY(serviceId) REFERENCES services(id),
    FOREIGN KEY(userId) REFERENCES users(id)
  );
`);

// Migrations
try {
  const tableInfo = db.prepare("PRAGMA table_info(services)").all() as any[];
  const hasDistrict = tableInfo.some(col => col.name === 'district');
  const hasTown = tableInfo.some(col => col.name === 'town');
  
  if (hasDistrict && !hasTown) {
    db.exec("ALTER TABLE services RENAME COLUMN district TO town");
  }

  const hasDescription = tableInfo.some(col => col.name === 'description');
  if (!hasDescription) {
    db.exec("ALTER TABLE services ADD COLUMN description TEXT");
  }
} catch (err) {
  console.error("Migration error:", err);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // --- Auth Routes ---
  app.post("/api/auth/signup", (req, res) => {
    const { firstName, lastName, mobileNumber, email, password } = req.body;
    const id = Math.random().toString(36).substring(2, 15);
    try {
      db.prepare("INSERT INTO users (id, firstName, lastName, mobileNumber, email, password) VALUES (?, ?, ?, ?, ?, ?)")
        .run(id, firstName, lastName, mobileNumber, email, password);
      res.json({ id, firstName, lastName, email, mobileNumber });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password) as any;
    if (user) {
      res.json({ id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, mobileNumber: user.mobileNumber });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // --- Service Routes ---
  app.get("/api/services", (req, res) => {
    const { state, town, category, search, createdBy, currentUserId } = req.query;
    let query = `
      SELECT s.*, u.firstName || ' ' || u.lastName as creatorName,
             (SELECT AVG(rating) FROM ratings WHERE serviceId = s.id) as avgRating,
             (SELECT COUNT(*) FROM ratings WHERE serviceId = s.id) as ratingCount
    `;

    if (currentUserId) {
      query += `, (SELECT rating FROM ratings WHERE serviceId = s.id AND userId = ?) as userRating `;
    }

    query += ` FROM services s JOIN users u ON s.createdBy = u.id WHERE 1=1 `;
    const params: any[] = [];
    if (currentUserId) params.push(currentUserId);

    if (state) { query += " AND s.state = ?"; params.push(state); }
    if (town) { query += " AND s.town = ?"; params.push(town); }
    if (category) { query += " AND s.category = ?"; params.push(category); }
    if (createdBy) { query += " AND s.createdBy = ?"; params.push(createdBy); }
    if (search) {
      query += " AND (s.providerName LIKE ? OR s.category LIKE ? OR s.description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += " ORDER BY s.createdAt DESC";
    const services = db.prepare(query).all(...params) as any[];
    res.json(services.map(s => ({
      ...s,
      photoUrls: s.photoUrl ? JSON.parse(s.photoUrl) : [],
      avgRating: s.avgRating || 0,
      ratingCount: s.ratingCount || 0
    })));
  });

  // CREATE SERVICE (Updated for ImgBB)
  app.post("/api/services", async (req, res) => {
    const { state, town, category, providerName, description, contactNumber, operatingHours, photoUrls, createdBy } = req.body;
    const id = Math.random().toString(36).substring(2, 15);
    const createdAt = Date.now();
    
    try {
      const user = db.prepare("SELECT id FROM users WHERE id = ?").get(createdBy);
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      // Upload all photos to ImgBB in parallel
      const processedUrls = await Promise.all(
        (photoUrls || []).map((url: string) => saveToImgBB(url))
      );
      
      const photoUrlJson = JSON.stringify(processedUrls.filter(u => u !== ""));

      db.prepare("INSERT INTO services (id, state, town, category, providerName, description, contactNumber, operatingHours, photoUrl, createdBy, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(id, state, town, category, providerName, description, contactNumber, operatingHours, photoUrlJson, createdBy, createdAt);
      
      res.json({ id, state, town, category, providerName, description, contactNumber, operatingHours, photoUrls: processedUrls, createdBy, createdAt });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // UPDATE SERVICE (Updated for ImgBB)
  app.put("/api/services/:id", async (req, res) => {
    const { id } = req.params;
    const { state, town, category, providerName, description, contactNumber, operatingHours, photoUrls, createdBy } = req.body;
    
    try {
      const service = db.prepare("SELECT * FROM services WHERE id = ?").get(id) as any;
      if (!service) return res.status(404).json({ error: "Service not found" });
      if (service.createdBy !== createdBy) return res.status(403).json({ error: "Unauthorized" });

      // Process photos: Upload new base64 ones, keep existing URLs
      const processedUrls = await Promise.all(
        (photoUrls || []).map((url: string) => saveToImgBB(url))
      );
      const photoUrlJson = JSON.stringify(processedUrls.filter(u => u !== ""));

      db.prepare("UPDATE services SET state = ?, town = ?, category = ?, providerName = ?, description = ?, contactNumber = ?, operatingHours = ?, photoUrl = ? WHERE id = ?")
        .run(state, town, category, providerName, description, contactNumber, operatingHours, photoUrlJson, id);
      
      res.json({ id, state, town, category, providerName, description, contactNumber, operatingHours, photoUrls: processedUrls, createdBy });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/services/:id", (req, res) => {
    const { id } = req.params;
    const { userId } = req.query;
    const service = db.prepare("SELECT * FROM services WHERE id = ?").get(id) as any;
    if (service && service.createdBy === userId) {
      db.prepare("DELETE FROM services WHERE id = ?").run(id);
      res.json({ success: true });
    } else {
      res.status(403).json({ error: "Unauthorized" });
    }
  });

  // --- Category/Rating Routes ---
  app.get("/api/categories/top", (req, res) => {
    const top = db.prepare("SELECT category, COUNT(*) as count FROM services GROUP BY category ORDER BY count DESC LIMIT 6").all() as any[];
    const result = top.map(cat => {
      const services = db.prepare("SELECT photoUrl FROM services WHERE category = ? AND photoUrl IS NOT NULL LIMIT 4").all(cat.category) as any[];
      const thumbnails = services.map(s => JSON.parse(s.photoUrl || "[]")[0]).filter(Boolean);
      return { ...cat, thumbnails };
    });
    res.json(result);
  });

  app.post("/api/services/:id/rate", (req, res) => {
    const { id } = req.params;
    const { userId, rating } = req.body;
    try {
      db.prepare("INSERT OR REPLACE INTO ratings (id, serviceId, userId, rating, createdAt) VALUES (?, ?, ?, ?, ?)")
        .run(Math.random().toString(36).substring(2, 15), id, userId, rating, Date.now());
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- Vite / Production ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();