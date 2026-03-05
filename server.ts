import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createRequire } from "module";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { GoogleGenAI } from "@google/genai";
import mysql from "mysql2/promise";

const require = createRequire(import.meta.url);
const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "rajugari-secret-key-change-in-prod";

// Initialize Gemini AI
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = GEMINI_API_KEY && GEMINI_API_KEY !== "MY_GEMINI_API_KEY" ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;
if (!ai) {
  console.warn("GEMINI_API_KEY not found or using default. AI features will be disabled.");
}

app.use(express.json());
app.use(cors());

let pool: mysql.Pool | null = null;

async function initDB() {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "rajugari_ventures",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test connection
    await pool.getConnection();

    // Initialize DB Schema
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE,
        password TEXT
      );
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title TEXT,
        slug VARCHAR(255) UNIQUE,
        description TEXT,
        content TEXT,
        icon TEXT,
        image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS portfolio (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title TEXT,
        slug VARCHAR(255) UNIQUE,
        category TEXT,
        image TEXT,
        description TEXT,
        client TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title TEXT,
        slug VARCHAR(255) UNIQUE,
        content TEXT,
        author TEXT,
        image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name TEXT,
        email TEXT,
        phone TEXT,
        service TEXT,
        message TEXT,
        status VARCHAR(50) DEFAULT 'new',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create default admin user if not exists
    const [users]: any = await pool.query("SELECT * FROM users WHERE username = ?", ["admin"]);
    if (users.length === 0) {
      const hashedPassword = bcrypt.hashSync("admin123", 10);
      await pool.query("INSERT INTO users (username, password) VALUES (?, ?)", ["admin", hashedPassword]);
      console.log("Default admin user created: admin / admin123");
    }

    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    pool = null; // Mark as null if initialization fails
  }
}

initDB();

// Middleware to verify JWT
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- API Routes ---

// Auth
app.post("/api/auth/login", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  const { username, password } = req.body;
  try {
    const [rows]: any = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
    const user = rows[0];

    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ username: user.username, id: user.id }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Services
app.get("/api/services", async (req, res) => {
  if (!pool) return res.status(503).json([]);
  try {
    const [services] = await pool.query("SELECT * FROM services ORDER BY created_at DESC");
    res.json(services);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/services", authenticateToken, async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  const { title, slug, description, content, icon, image } = req.body;
  try {
    const [result]: any = await pool.query(
      "INSERT INTO services (title, slug, description, content, icon, image) VALUES (?, ?, ?, ?, ?, ?)",
      [title, slug, description, content, icon, image]
    );
    res.json({ id: result.insertId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Portfolio
app.get("/api/portfolio", async (req, res) => {
  if (!pool) return res.status(503).json([]);
  try {
    const [items] = await pool.query("SELECT * FROM portfolio ORDER BY created_at DESC");
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/portfolio", authenticateToken, async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  const { title, slug, category, image, description, client } = req.body;
  try {
    const [result]: any = await pool.query(
      "INSERT INTO portfolio (title, slug, category, image, description, client) VALUES (?, ?, ?, ?, ?, ?)",
      [title, slug, category, image, description, client]
    );
    res.json({ id: result.insertId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Blogs
app.get("/api/blogs", async (req, res) => {
  if (!pool) return res.status(503).json([]);
  try {
    const [posts] = await pool.query("SELECT * FROM blogs ORDER BY created_at DESC");
    res.json(posts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/blogs/:slug", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const [rows]: any = await pool.query("SELECT * FROM blogs WHERE slug = ?", [req.params.slug]);
    const post = rows[0];
    if (post) res.json(post);
    else res.status(404).json({ error: "Post not found" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/blogs", authenticateToken, async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  const { title, slug, content, author, image } = req.body;
  try {
    const [result]: any = await pool.query(
      "INSERT INTO blogs (title, slug, content, author, image) VALUES (?, ?, ?, ?, ?)",
      [title, slug, content, author, image]
    );
    res.json({ id: result.insertId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Leads
app.post("/api/leads", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  const { name, email, phone, service, message } = req.body;
  try {
    const [result]: any = await pool.query(
      "INSERT INTO leads (name, email, phone, service, message) VALUES (?, ?, ?, ?, ?)",
      [name, email, phone, service, message]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/leads", authenticateToken, async (req, res) => {
  if (!pool) return res.status(503).json([]);
  try {
    const [leads] = await pool.query("SELECT * FROM leads ORDER BY created_at DESC");
    res.json(leads);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Chatbot
app.post("/api/chat", async (req, res) => {
  if (!ai) return res.status(503).json({ error: "AI features disabled" });
  const { message } = req.body;
  try {
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: "You are the AI assistant for Rajugari Ventures, a digital solutions company. Answer questions about our services: Digital Marketing, SEO, Web/App Development, AI Products. Be professional, concise, and helpful.",
      },
      history: [
        {
          role: "user",
          parts: [{ text: "Hello" }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I am ready to assist visitors with information about Rajugari Ventures services and expertise." }],
        },
      ],
    });

    const result = await chat.sendMessage({ message });
    res.json({ reply: result.text });
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ error: "Failed to process AI request" });
  }
});

// AI Content Generation (Admin)
app.post("/api/generate-content", authenticateToken, async (req, res) => {
  if (!ai) return res.status(503).json({ error: "AI features disabled" });
  const { topic, type } = req.body; // type: 'blog', 'service-desc', 'social-post'
  try {
    const prompt = `Generate a high-quality ${type} about "${topic}" for Rajugari Ventures. Keep it professional, engaging, and SEO-optimized.`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    res.json({ content: result.text });
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    res.status(500).json({ error: "Failed to generate content" });
  }
});


async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: process.cwd(),
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
