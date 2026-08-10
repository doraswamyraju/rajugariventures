import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { createRequire } from "module";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { GoogleGenAI } from "@google/genai";
import mysql from "mysql2/promise";
import multer from "multer";

const require = createRequire(import.meta.url);
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || "rajugari-secret-key-change-in-prod";

// Configure Multer Storage for Image and Video Uploads
const uploadsDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, "_");
    cb(null, `${name}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB max for video/image uploads
});

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(uploadsDir));

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

        sqliteDb.run(`CREATE TABLE IF NOT EXISTS masterclass_course (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,
          subtitle TEXT,
          actual_price INTEGER,
          offer_price INTEGER,
          start_date TEXT,
          timings TEXT,
          zoom_link TEXT,
          whatsapp_link TEXT,
          trainer_name TEXT,
          trainer_role TEXT,
          trainer_bio TEXT,
          trainer_image TEXT,
          trainer_reel_url TEXT,
          trainer_experience TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        sqliteDb.run(`CREATE TABLE IF NOT EXISTS masterclass_testimonials (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          role TEXT,
          rating INTEGER,
          type TEXT,
          media_url TEXT,
          review_text TEXT,
          avatar TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        sqliteDb.run(`CREATE TABLE IF NOT EXISTS masterclass_showcase (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,
          category TEXT,
          image_url TEXT,
          student_name TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        sqliteDb.run(`CREATE TABLE IF NOT EXISTS masterclass_registrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          email TEXT,
          phone TEXT,
          whatsapp TEXT,
          amount INTEGER,
          payment_id TEXT,
          order_id TEXT,
          status TEXT DEFAULT 'success',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        const adminUser = "rajugariventures@gmail.com";
        const adminPass = "BOHPM6139n@";
        const hashedPassword = bcrypt.hashSync(adminPass, 10);
        sqliteDb.run(`INSERT OR REPLACE INTO users (id, username, password) VALUES (1, ?, ?)`, [adminUser, hashedPassword]);

        // Seed default course if empty
        sqliteDb.get("SELECT COUNT(*) as count FROM masterclass_course", (err: any, row: any) => {
          if (row && row.count === 0) {
            sqliteDb.run(`INSERT INTO masterclass_course (id, title, subtitle, actual_price, offer_price, start_date, timings, zoom_link, whatsapp_link, trainer_name, trainer_role, trainer_bio, trainer_image, trainer_reel_url, trainer_experience)
              VALUES (1, 'AI PRODUCTIVITY MASTERCLASS', 'From Casual AI User to AI Power User in 5 Days', 1499, 499, '17th August 2026', '6:00 PM to 7:00 PM Daily', 'https://zoom.us/j/sample-masterclass', 'https://chat.whatsapp.com/sample-masterclass', 'Doraswamy Raju', 'Founder, Rajugari Ventures | AI & Automation Specialist', 'Empowering professionals, business owners, and job seekers with practical, real-world AI productivity workflows. Master ChatGPT, Gemini, and AI tools to save 15+ hours every week.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '5+ Years Experience | 10,000+ Students Trained')`);
          } else {
            // Update existing row with default trainer details if missing
            sqliteDb.run(`UPDATE masterclass_course SET 
              trainer_name = COALESCE(trainer_name, 'Doraswamy Raju'),
              trainer_role = COALESCE(trainer_role, 'Founder, Rajugari Ventures | AI & Automation Specialist'),
              trainer_bio = COALESCE(trainer_bio, 'Empowering professionals, business owners, and job seekers with practical, real-world AI productivity workflows. Master ChatGPT, Gemini, and AI tools to save 15+ hours every week.'),
              trainer_image = COALESCE(trainer_image, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'),
              trainer_reel_url = COALESCE(trainer_reel_url, 'https://www.youtube.com/embed/dQw4w9WgXcQ'),
              trainer_experience = COALESCE(trainer_experience, '5+ Years Experience | 10,000+ Students Trained')
              WHERE id = 1`);
          }
        });

        // Seed sample testimonials if empty
        sqliteDb.get("SELECT COUNT(*) as count FROM masterclass_testimonials", (err: any, row: any) => {
          if (row && row.count === 0) {
            sqliteDb.run(`INSERT INTO masterclass_testimonials (name, role, rating, type, media_url, review_text) VALUES 
              ('K. Sai Kumar', 'Business Owner', 5, 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'This 5-day bootcamp completely transformed how I handle daily office reports and social media marketing!'),
              ('M. Rajesh', 'Freelance Designer', 5, 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Learning prompt engineering saved me 15+ hours every week. High quality practical sessions!'),
              ('P. Anusha', 'Software Job Seeker', 5, 'text', '', 'The career day gave me resume building prompts that got me 3 interview calls within a week! Highly recommended.'),
              ('V. Naresh', 'Marketing Executive', 5, 'text', '', 'Best ₹499 invested. Automated our entire email workflow and social media scripts.')`);
          }
        });

        // Seed sample showcase if empty
        sqliteDb.get("SELECT COUNT(*) as count FROM masterclass_showcase", (err: any, row: any) => {
          if (row && row.count === 0) {
            sqliteDb.run(`INSERT INTO masterclass_showcase (title, category, image_url, student_name) VALUES
              ('AI Generated Product Banner', 'work', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80', 'M. Rajesh'),
              ('Certificate Handover Batch #1', 'certificate', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80', 'Batch #1 Graduates'),
              ('Social Media Ad Copy & Graphic', 'work', 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=600&q=80', 'K. Sai Kumar'),
              ('Masterclass Completion Ceremony', 'certificate', 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&q=80', 'Tirupati Center')`);
          }
        });
      });
      console.log("SQLite File Database initialized successfully with admin user and Masterclass tables.");
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

    // Embed exact JPG Template Image from disk/public
    const fs = await import('fs');
    const templatePath = path.join(process.cwd(), 'public', 'certificate-template.jpg');
    
    if (fs.existsSync(templatePath)) {
      const templateImageBytes = fs.readFileSync(templatePath);
      const embeddedTemplate = await pdfDoc.embedJpg(templateImageBytes);
      
      // Draw background image filling the entire page exactly
      page.drawImage(embeddedTemplate, {
        x: 0,
        y: 0,
        width,
        height,
      });
    }

    const fontSerifBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const fontSerifItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    const fontSans = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const navyDark = rgb(0.06, 0.12, 0.35); // Deep Navy Blue
    const textGray = rgb(0.35, 0.4, 0.45);

    // 1. Candidate Name (Positioned cleanly on top of the template line)
    const candidateName = name.toUpperCase();
    const nameSize = candidateName.length > 25 ? 22 : 26;
    const nameWidth = fontSerifBold.widthOfTextAtSize(candidateName, nameSize);
    page.drawText(candidateName, {
      x: (width - nameWidth) / 2,
      y: 290,
      size: nameSize,
      font: fontSerifBold,
      color: navyDark,
    });

    // 2. Course Details & Appreciation (Positioned directly below the name line)
    const appreciationText = "for successfully completing the specialized course in";
    const appreciationWidth = fontSerifItalic.widthOfTextAtSize(appreciationText, 13);
    page.drawText(appreciationText, {
      x: (width - appreciationWidth) / 2,
      y: 245,
      size: 13,
      font: fontSerifItalic,
      color: textGray,
    });

    const courseTitle = course;
    const courseSize = courseTitle.length > 30 ? 17 : 20;
    const courseTitleWidth = fontSansBold.widthOfTextAtSize(courseTitle, courseSize);
    page.drawText(courseTitle, {
      x: (width - courseTitleWidth) / 2,
      y: 218,
      size: courseSize,
      font: fontSansBold,
      color: navyDark,
    });

    // 3. Certificate Number & Issue Date (Positioned neatly in lower right section)
    page.drawText(`ID: ${certId}`, {
      x: width - 210,
      y: 65,
      size: 10,
      font: fontSansBold,
      color: navyDark,
    });
    page.drawText(`Date: ${issueDate}`, {
      x: width - 210,
      y: 50,
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

// --- MASTERCLASS API ENDPOINTS ---

// Public endpoint to get full landing page content
app.get("/api/masterclass/public", async (req, res) => {
  try {
    if (sqliteDb) {
      sqliteDb.get("SELECT * FROM masterclass_course WHERE id = 1", (err: any, course: any) => {
        sqliteDb.all("SELECT * FROM masterclass_testimonials ORDER BY id DESC", (err2: any, testimonials: any) => {
          sqliteDb.all("SELECT * FROM masterclass_showcase ORDER BY id DESC", (err3: any, showcase: any) => {
            res.json({
              course: course || {
                title: "AI PRODUCTIVITY MASTERCLASS",
                subtitle: "From Casual AI User to AI Power User in 5 Days",
                actual_price: 1499,
                offer_price: 499,
                start_date: "17th August 2026",
                timings: "6:00 PM to 7:00 PM Daily",
                zoom_link: "https://zoom.us/j/sample-masterclass",
                whatsapp_link: "https://chat.whatsapp.com/sample-masterclass"
              },
              testimonials: testimonials || [],
              showcase: showcase || []
            });
          });
        });
      });
    } else {
      res.json({
        course: {
          title: "AI PRODUCTIVITY MASTERCLASS",
          subtitle: "From Casual AI User to AI Power User in 5 Days",
          actual_price: 1499,
          offer_price: 499,
          start_date: "17th August 2026",
          timings: "6:00 PM to 7:00 PM Daily",
          zoom_link: "https://zoom.us/j/sample-masterclass",
          whatsapp_link: "https://chat.whatsapp.com/sample-masterclass"
        },
        testimonials: [],
        showcase: []
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin endpoint to update course settings
app.put("/api/masterclass/admin/course", authenticateToken, async (req, res) => {
  const { 
    title, subtitle, actual_price, offer_price, start_date, timings, zoom_link, whatsapp_link,
    trainer_name, trainer_role, trainer_bio, trainer_image, trainer_reel_url, trainer_experience 
  } = req.body;
  try {
    if (sqliteDb) {
      sqliteDb.run(
        `UPDATE masterclass_course SET 
          title = ?, subtitle = ?, actual_price = ?, offer_price = ?, start_date = ?, timings = ?, zoom_link = ?, whatsapp_link = ?,
          trainer_name = ?, trainer_role = ?, trainer_bio = ?, trainer_image = ?, trainer_reel_url = ?, trainer_experience = ?,
          updated_at = CURRENT_TIMESTAMP WHERE id = 1`,
        [
          title, subtitle, actual_price, offer_price, start_date, timings, zoom_link, whatsapp_link,
          trainer_name, trainer_role, trainer_bio, trainer_image, trainer_reel_url, trainer_experience
        ],
        function (err: any) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ success: true, message: "Course & Trainer settings updated successfully!" });
        }
      );
// File Upload Endpoint (Images & Videos)
app.post("/api/upload", authenticateToken, upload.single("file"), (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file was uploaded." });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (err: any) {
    res.status(500).json({ error: "Upload failed: " + err.message });
  }
});

// Admin endpoints for Testimonials
app.post("/api/masterclass/admin/testimonials", authenticateToken, async (req, res) => {
  const { name, role, rating, type, media_url, review_text, avatar } = req.body;
  try {
    if (sqliteDb) {
      sqliteDb.run(
        `INSERT INTO masterclass_testimonials (name, role, rating, type, media_url, review_text, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, role, rating || 5, type || 'text', media_url || '', review_text || '', avatar || ''],
        function (err: any) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ success: true, id: this.lastID });
        }
      );
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/masterclass/admin/testimonials/:id", authenticateToken, async (req, res) => {
  try {
    if (sqliteDb) {
      sqliteDb.run("DELETE FROM masterclass_testimonials WHERE id = ?", [req.params.id], (err: any) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin endpoints for Showcase Media
app.post("/api/masterclass/admin/showcase", authenticateToken, async (req, res) => {
  const { title, category, image_url, student_name } = req.body;
  try {
    if (sqliteDb) {
      sqliteDb.run(
        `INSERT INTO masterclass_showcase (title, category, image_url, student_name) VALUES (?, ?, ?, ?)`,
        [title, category || 'work', image_url, student_name || 'Student'],
        function (err: any) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ success: true, id: this.lastID });
        }
      );
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/masterclass/admin/showcase/:id", authenticateToken, async (req, res) => {
  try {
    if (sqliteDb) {
      sqliteDb.run("DELETE FROM masterclass_showcase WHERE id = ?", [req.params.id], (err: any) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Payment & Registration endpoints
app.post("/api/masterclass/create-order", async (req, res) => {
  const { amount, name, email, phone } = req.body;
  try {
    // Generate order ID
    const orderId = "order_mc_" + Date.now();
    res.json({
      orderId,
      amount: amount || 499,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder"
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/masterclass/verify-payment", async (req, res) => {
  const { name, email, phone, whatsapp, amount, payment_id, order_id } = req.body;
  try {
    if (sqliteDb) {
      sqliteDb.run(
        `INSERT INTO masterclass_registrations (name, email, phone, whatsapp, amount, payment_id, order_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'success')`,
        [name, email, phone, whatsapp || phone, amount || 499, payment_id || ('pay_' + Date.now()), order_id || 'direct'],
        function (err: any) {
          if (err) console.error("Error inserting registration:", err);
        }
      );

      sqliteDb.get("SELECT zoom_link, whatsapp_link FROM masterclass_course WHERE id = 1", (err: any, row: any) => {
        res.json({
          success: true,
          message: "Registration successful!",
          zoomLink: row?.zoom_link || "https://zoom.us/j/sample-masterclass",
          whatsappLink: row?.whatsapp_link || "https://chat.whatsapp.com/sample-masterclass"
        });
      });
    } else {
      res.json({
        success: true,
        message: "Registration successful!",
        zoomLink: "https://zoom.us/j/sample-masterclass",
        whatsappLink: "https://chat.whatsapp.com/sample-masterclass"
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin endpoint to view registrations
app.get("/api/masterclass/admin/registrations", authenticateToken, async (req, res) => {
  try {
    if (sqliteDb) {
      sqliteDb.all("SELECT * FROM masterclass_registrations ORDER BY id DESC", (err: any, rows: any) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
      });
    } else {
      res.json([]);
    }
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
