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
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
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
let sqliteDb: any = null;
const memoryCertificates: any[] = [
  {
    id: 1,
    name: "Doraswamy Raju",
    course: "Full Stack Web Development Masterclass",
    email: "doraswamyraju.ca@gmail.com",
    status: "pending",
    created_at: new Date().toISOString()
  }
];

async function initDB() {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "BOHPM6139n@",
      database: process.env.DB_NAME || "skillsak_rajugariventures",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test connection
    const conn = await pool.getConnection();
    conn.release();

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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cert_id VARCHAR(100) UNIQUE,
        name VARCHAR(255),
        course VARCHAR(255),
        email VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create default admin user if not exists
    const adminUser = "rajugariventures@gmail.com";
    const adminPass = "BOHPM6139n@";
    const [users]: any = await pool.query("SELECT * FROM users WHERE username = ?", [adminUser]);
    if (users.length === 0) {
      const hashedPassword = bcrypt.hashSync(adminPass, 10);
      await pool.query("INSERT INTO users (username, password) VALUES (?, ?)", [adminUser, hashedPassword]);
      console.log(`Default admin user created: ${adminUser}`);
    } else {
      const hashedPassword = bcrypt.hashSync(adminPass, 10);
      await pool.query("UPDATE users SET password = ? WHERE username = ?", [hashedPassword, adminUser]);
    }

    console.log("MySQL Database initialized successfully.");
  } catch (error: any) {
    console.warn("Notice: MySQL connection failed. Initializing File Database (SQLite) fallback...");
    pool = null;
    try {
      const sqlite3 = require('sqlite3').verbose();
      sqliteDb = new sqlite3.Database(path.join(process.cwd(), 'rajugari.db'));
      
      sqliteDb.serialize(() => {
        sqliteDb.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)`);
        sqliteDb.run(`CREATE TABLE IF NOT EXISTS certificates (id INTEGER PRIMARY KEY AUTOINCREMENT, cert_id TEXT UNIQUE, name TEXT, course TEXT, email TEXT, status TEXT DEFAULT 'pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        sqliteDb.run(`CREATE TABLE IF NOT EXISTS leads (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, phone TEXT, service TEXT, message TEXT, status TEXT DEFAULT 'new', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

        const adminUser = "rajugariventures@gmail.com";
        const adminPass = "BOHPM6139n@";
        const hashedPassword = bcrypt.hashSync(adminPass, 10);
        sqliteDb.run(`INSERT OR REPLACE INTO users (id, username, password) VALUES (1, ?, ?)`, [adminUser, hashedPassword]);
      });
      console.log("SQLite File Database initialized successfully with admin user: rajugariventures@gmail.com");
    } catch (sqliteErr) {
      console.error("SQLite initialization failed:", sqliteErr);
    }
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
  const { username, password } = req.body;

  if (pool) {
    try {
      const [rows]: any = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
      const user = rows[0];

      if (user && bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({ username: user.username, id: user.id }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token });
      } else {
        return res.status(200).json({ error: "Invalid credentials" });
      }
    } catch (error: any) {
      return res.status(200).json({ error: error.message });
    }
  } else if (sqliteDb) {
    sqliteDb.get("SELECT * FROM users WHERE username = ?", [username], (err: any, user: any) => {
      if (err) return res.status(200).json({ error: err.message });
      if (user && bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({ username: user.username, id: user.id }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token });
      } else if (username === "rajugariventures@gmail.com" && password === "BOHPM6139n@") {
        const token = jwt.sign({ username: "rajugariventures@gmail.com", id: 1 }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token });
      } else {
        return res.status(200).json({ error: "Invalid credentials" });
      }
    });
  } else {
    // Hardcoded fallback for admin login when DB is completely offline
    if (username === "rajugariventures@gmail.com" && password === "BOHPM6139n@") {
      const token = jwt.sign({ username: "rajugariventures@gmail.com", id: 1 }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ token });
    }
    return res.status(200).json({ error: "Database offline and credentials invalid." });
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

// 1. Submit Certificate Request (User Public API)
app.post("/api/certificates/request", async (req, res) => {
  const { name, course, email } = req.body;

  if (!name || !course || !email) {
    return res.status(400).json({ error: "Name, Course, and Email are required fields." });
  }

  const newCert = {
    id: memoryCertificates.length + 1,
    name,
    course,
    email,
    status: 'pending',
    created_at: new Date().toISOString()
  };
  memoryCertificates.unshift(newCert);

  if (pool) {
    try {
      await pool.query(
        "INSERT INTO certificates (name, course, email, status) VALUES (?, ?, ?, 'pending')",
        [name, course, email]
      );
    } catch (err: any) {
      console.error("MySQL insert failed:", err.message);
    }
  }

  if (sqliteDb) {
    try {
      sqliteDb.run(
        "INSERT INTO certificates (name, course, email, status) VALUES (?, ?, ?, 'pending')",
        [name, course, email]
      );
    } catch (err: any) {
      console.error("SQLite insert failed:", err.message);
    }
  }

  return res.json({
    success: true,
    message: "Certificate request submitted successfully and pending admin approval.",
    id: newCert.id
  });
});

// 2. Fetch All Certificate Requests (Admin Auth API)
app.get("/api/certificates", authenticateToken, async (req, res) => {
  if (pool) {
    try {
      const [certs]: any = await pool.query("SELECT * FROM certificates ORDER BY created_at DESC");
      if (certs && certs.length > 0) return res.json(certs);
    } catch (error: any) {
      console.error("MySQL query failed in /api/certificates:", error.message);
    }
  }

  if (sqliteDb) {
    try {
      const rows: any = await new Promise((resolve) => {
        sqliteDb.all("SELECT * FROM certificates ORDER BY created_at DESC", [], (err: any, rows: any) => {
          resolve(rows || []);
        });
      });
      if (rows && rows.length > 0) return res.json(rows);
    } catch (err: any) {
      console.error("SQLite query error:", err);
    }
  }

  // Guaranteed fallback to memory store
  return res.json(memoryCertificates);
});

// 3. Approve Certificate & Email PDF Attachment (Admin Auth API)
app.post("/api/certificates/approve/:id", authenticateToken, async (req, res) => {
  const certIdParam = req.params.id;

  try {
    let certRecord: any = null;

    if (pool) {
      const [rows]: any = await pool.query("SELECT * FROM certificates WHERE id = ?", [certIdParam]);
      certRecord = rows[0];
    } else if (sqliteDb) {
      certRecord = await new Promise((resolve) => {
        sqliteDb.get("SELECT * FROM certificates WHERE id = ?", [certIdParam], (err: any, row: any) => {
          resolve(row || null);
        });
      });
    }

    if (!certRecord) {
      certRecord = memoryCertificates.find((c: any) => c.id === parseInt(certIdParam));
    }

    if (!certRecord) {
      return res.status(404).json({ error: "Certificate request not found." });
    }

    const certId = certRecord.cert_id || `RJV-CERT-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
    const issueDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const { name, course, email } = certRecord;

    // Generate PDF using pdf-lib
    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();
    
    // Landscape A4 Page (841.89 x 595.28 points)
    const page = pdfDoc.addPage([841.89, 595.28]);
    const { width, height } = page.getSize();

    const fontSerifBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const fontSerifItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    const fontSans = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Color Palette matching Vidyalai layout
    const navyDark = rgb(0.06, 0.12, 0.35); // Deep Navy Blue
    const goldAccent = rgb(0.85, 0.65, 0.2); // Warm Gold
    const textDark = rgb(0.12, 0.18, 0.28);
    const textGray = rgb(0.35, 0.4, 0.45);

    // Clean white background
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(0.99, 0.99, 0.99),
    });

    // Top-Right Curved Navy Decorative Accent Shapes
    page.drawCircle({
      x: width + 40,
      y: height + 40,
      size: 180,
      color: navyDark,
    });
    page.drawCircle({
      x: width + 20,
      y: height + 20,
      size: 170,
      color: goldAccent,
    });
    page.drawCircle({
      x: width + 35,
      y: height + 35,
      size: 165,
      color: navyDark,
    });

    // Bottom-Left Curved Navy Decorative Accent Shapes
    page.drawCircle({
      x: -40,
      y: -40,
      size: 180,
      color: navyDark,
    });
    page.drawCircle({
      x: -20,
      y: -20,
      size: 170,
      color: goldAccent,
    });
    page.drawCircle({
      x: -35,
      y: -35,
      size: 165,
      color: navyDark,
    });

    // Top Institution Header (VIDYALAI IT & NON-IT TRAINING INSTITUTE)
    const instName = "VIDYALAI";
    const instNameWidth = fontSansBold.widthOfTextAtSize(instName, 26);
    page.drawText(instName, {
      x: (width - instNameWidth) / 2,
      y: height - 85,
      size: 26,
      font: fontSansBold,
      color: navyDark,
    });

    const instTagline = "IT & NON-IT TRAINING INSTITUTE";
    const instTaglineWidth = fontSansBold.widthOfTextAtSize(instTagline, 12);
    page.drawText(instTagline, {
      x: (width - instTaglineWidth) / 2,
      y: height - 105,
      size: 12,
      font: fontSansBold,
      color: rgb(0.7, 0.15, 0.15), // Red highlight accent
    });

    const instSub = "LEARN TODAY. LEAD TOMORROW";
    const instSubWidth = fontSans.widthOfTextAtSize(instSub, 8);
    page.drawText(instSub, {
      x: (width - instSubWidth) / 2,
      y: height - 118,
      size: 8,
      font: fontSans,
      color: textGray,
    });

    // Main Certificate Header
    const certHeader = "CERTIFICATE";
    const certHeaderWidth = fontSerifBold.widthOfTextAtSize(certHeader, 38);
    page.drawText(certHeader, {
      x: (width - certHeaderWidth) / 2,
      y: height - 165,
      size: 38,
      font: fontSerifBold,
      color: navyDark,
    });

    const certSubHeader = "OF GRADUATION";
    const certSubHeaderWidth = fontSansBold.widthOfTextAtSize(certSubHeader, 16);
    page.drawText(certSubHeader, {
      x: (width - certSubHeaderWidth) / 2,
      y: height - 190,
      size: 16,
      font: fontSansBold,
      color: navyDark,
    });

    // Presentation text line
    const textPresented = "THIS CERTIFICATE IS PROUDLY PRESENTED TO";
    const presentedWidth = fontSansBold.widthOfTextAtSize(textPresented, 13);
    page.drawText(textPresented, {
      x: (width - presentedWidth) / 2,
      y: height - 235,
      size: 13,
      font: fontSansBold,
      color: textDark,
    });

    // Candidate Name
    const candidateName = name.toUpperCase();
    const nameWidth = fontSerifBold.widthOfTextAtSize(candidateName, 26);
    page.drawText(candidateName, {
      x: (width - nameWidth) / 2,
      y: height - 295,
      size: 26,
      font: fontSerifBold,
      color: navyDark,
    });

    // Clean Underline under Candidate Name
    page.drawLine({
      start: { x: (width - 450) / 2, y: height - 310 },
      end: { x: (width + 450) / 2, y: height - 310 },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.75),
    });

    // Course Completion Text
    const courseText = `for successfully completing the specialized course in`;
    const courseTextWidth = fontSerifItalic.widthOfTextAtSize(courseText, 14);
    page.drawText(courseText, {
      x: (width - courseTextWidth) / 2,
      y: height - 345,
      size: 14,
      font: fontSerifItalic,
      color: textGray,
    });

    const courseTitle = course;
    const courseTitleWidth = fontSansBold.widthOfTextAtSize(courseTitle, 20);
    page.drawText(courseTitle, {
      x: (width - courseTitleWidth) / 2,
      y: height - 375,
      size: 20,
      font: fontSansBold,
      color: navyDark,
    });

    // Bottom Left Footer Logo Text (RAJUGARI VENTURES)
    page.drawText("RAJUGARI VENTURES", {
      x: 60,
      y: 75,
      size: 14,
      font: fontSansBold,
      color: textDark,
    });
    page.drawText("A Digital Marketing Agency", {
      x: 60,
      y: 62,
      size: 9,
      font: fontSans,
      color: textGray,
    });
    page.drawText("We Create Your Digital Identity", {
      x: 60,
      y: 50,
      size: 8,
      font: fontSansBold,
      color: rgb(0.85, 0.45, 0.1),
    });

    // Bottom Center Signatory Block (DORASWAMY RAJU M)
    const sigNameStyle = "M.D.S.Raju";
    const sigNameStyleWidth = fontSerifItalic.widthOfTextAtSize(sigNameStyle, 18);
    page.drawText(sigNameStyle, {
      x: (width - sigNameStyleWidth) / 2,
      y: 110,
      size: 18,
      font: fontSerifItalic,
      color: navyDark,
    });

    const sigOfficialName = "DORASWAMY RAJU M";
    const sigOfficialNameWidth = fontSansBold.widthOfTextAtSize(sigOfficialName, 12);
    page.drawText(sigOfficialName, {
      x: (width - sigOfficialNameWidth) / 2,
      y: 85,
      size: 12,
      font: fontSansBold,
      color: textDark,
    });

    const sigTitle1 = "Director";
    const sigTitle1Width = fontSans.widthOfTextAtSize(sigTitle1, 11);
    page.drawText(sigTitle1, {
      x: (width - sigTitle1Width) / 2,
      y: 68,
      size: 11,
      font: fontSans,
      color: textGray,
    });

    const sigTitle2 = "Rocksvel Pvt. Ltd.";
    const sigTitle2Width = fontSans.widthOfTextAtSize(sigTitle2, 11);
    page.drawText(sigTitle2, {
      x: (width - sigTitle2Width) / 2,
      y: 52,
      size: 11,
      font: fontSans,
      color: textGray,
    });

    // Bottom Right Metadata (Certificate ID & Date)
    page.drawText(`ID: ${certId}`, {
      x: width - 200,
      y: 70,
      size: 10,
      font: fontSansBold,
      color: navyDark,
    });
    page.drawText(`Date: ${issueDate}`, {
      x: width - 200,
      y: 55,
      size: 9,
      font: fontSans,
      color: textGray,
    });

    // Save PDF as Buffer
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    // Update database record to approved
    if (pool) {
      await pool.query(
        "UPDATE certificates SET cert_id = ?, status = 'approved' WHERE id = ?",
        [certId, certIdParam]
      );
    }
    if (sqliteDb) {
      sqliteDb.run(
        "UPDATE certificates SET cert_id = ?, status = 'approved' WHERE id = ?",
        [certId, certIdParam]
      );
    }
    const memItem = memoryCertificates.find((c: any) => c.id === parseInt(certIdParam));
    if (memItem) {
      memItem.status = 'approved';
      memItem.cert_id = certId;
    }

    // Email Dispatch via Nodemailer
    let emailSent = false;
    let emailError: string | null = null;
    const nodemailer = await import('nodemailer');
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpUser = process.env.SMTP_USER || 'rajugariventures@gmail.com';
    const smtpPass = process.env.SMTP_PASS || 'crwd xezi sezl vbbu';

    if (smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"Rajugari Ventures" <${smtpUser}>`,
          to: email,
          subject: `Your Approved Certificate of Completion - ${course}`,
          text: `Dear ${name},\n\nCongratulations! Your certificate for "${course}" has been approved. Please find your official digital certificate attached to this email.\n\nCertificate ID: ${certId}\n\nBest regards,\nRajugari Ventures Team`,
          html: `
            <div style="font-family: Arial, sans-serif; background-color: #141417; color: #ffffff; padding: 30px; border-radius: 12px;">
              <h2 style="color: #E6A627;">Congratulations, ${name}!</h2>
              <p>Your request for the <strong>Certificate of Completion</strong> for <strong>${course}</strong> has been officially approved by our team.</p>
              <div style="background-color: #202025; padding: 15px; border-left: 4px solid #E6A627; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0;"><strong>Certificate ID:</strong> ${certId}</p>
                <p style="margin: 5px 0 0 0;"><strong>Date of Issue:</strong> ${issueDate}</p>
              </div>
              <p>Your official PDF certificate is attached to this email.</p>
              <br/>
              <p style="color: #a0a0a0;">Warm regards,<br/><strong>Rajugari Ventures Team</strong></p>
            </div>
          `,
          attachments: [
            {
              filename: `Certificate_${name.replace(/\s+/g, '_')}_${certId}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf',
            },
          ],
        });
        emailSent = true;
        console.log(`Certificate PDF successfully emailed to ${email}`);
      } catch (mailErr: any) {
        emailError = mailErr.message || String(mailErr);
        console.error("Failed to send email via SMTP:", mailErr);
      }
    }

    res.json({
      success: true,
      message: emailSent ? "Certificate approved and email dispatched." : `Certificate approved, but email failed: ${emailError}`,
      certId,
      emailSent,
      emailError
    });
  } catch (err: any) {
    console.error("Error approving certificate:", err);
    res.status(500).json({ error: "Failed to approve certificate: " + err.message });
  }
});

// 4. Reject Certificate Request (Admin Auth API)
app.post("/api/certificates/reject/:id", authenticateToken, async (req, res) => {
  try {
    if (pool) {
      await pool.query("UPDATE certificates SET status = 'rejected' WHERE id = ?", [req.params.id]);
    } else if (sqliteDb) {
      sqliteDb.run("UPDATE certificates SET status = 'rejected' WHERE id = ?", [req.params.id]);
    }
    res.json({ success: true, message: "Certificate request rejected." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
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

  const net = await import("net");
  const isPortAvailable = (port: number) => {
    return new Promise((resolve) => {
      const tester = net.createServer()
        .once('error', () => resolve(false))
        .once('listening', () => tester.once('close', () => resolve(true)).close())
        .listen(port, '0.0.0.0');
    });
  };

  let targetPort = PORT;
  if (process.env.PORT) {
    targetPort = parseInt(process.env.PORT);
  } else {
    while (!(await isPortAvailable(targetPort))) {
      console.log(`Port ${targetPort} is in use, trying port ${targetPort + 1}...`);
      targetPort++;
    }
  }

  app.listen(targetPort, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${targetPort}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
