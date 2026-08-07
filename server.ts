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
      // Update existing admin password to match requested credential
      const hashedPassword = bcrypt.hashSync(adminPass, 10);
      await pool.query("UPDATE users SET password = ? WHERE username = ?", [hashedPassword, adminUser]);
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

// 1. Submit Certificate Request (User Public API)
app.post("/api/certificates/request", async (req, res) => {
  const { name, course, email } = req.body;

  if (!name || !course || !email) {
    return res.status(400).json({ error: "Name, Course, and Email are required fields." });
  }

  try {
    if (pool) {
      const [result]: any = await pool.query(
        "INSERT INTO certificates (name, course, email, status) VALUES (?, ?, ?, 'pending')",
        [name, course, email]
      );
      return res.json({
        success: true,
        message: "Certificate request submitted successfully and pending admin approval.",
        id: result.insertId
      });
    } else {
      console.log(`[DB Offline] Certificate request received for ${name} (${email}) - ${course}`);
      return res.json({
        success: true,
        message: "Certificate request received and pending admin approval."
      });
    }
  } catch (err: any) {
    console.error("Error submitting certificate request:", err);
    res.status(500).json({ error: "Failed to submit request: " + err.message });
  }
});

// 2. Fetch All Certificate Requests (Admin Auth API)
app.get("/api/certificates", authenticateToken, async (req, res) => {
  if (!pool) return res.status(503).json([]);
  try {
    const [certs] = await pool.query("SELECT * FROM certificates ORDER BY created_at DESC");
    res.json(certs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Approve Certificate & Email PDF Attachment (Admin Auth API)
app.post("/api/certificates/approve/:id", authenticateToken, async (req, res) => {
  const certIdParam = req.params.id;

  try {
    if (!pool) return res.status(503).json({ error: "Database unavailable" });

    const [rows]: any = await pool.query("SELECT * FROM certificates WHERE id = ?", [certIdParam]);
    const certRecord = rows[0];

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

    // Color Palette
    const bgDark = rgb(0.08, 0.08, 0.09); // #141417
    const goldAccent = rgb(0.9, 0.65, 0.15); // #E6A627
    const textWhite = rgb(1, 1, 1);
    const textMuted = rgb(0.7, 0.7, 0.75);

    // Dark Background Fill
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: bgDark,
    });

    // Decorative Double Border
    page.drawRectangle({
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 40,
      borderColor: goldAccent,
      borderWidth: 2,
    });
    page.drawRectangle({
      x: 28,
      y: 28,
      width: width - 56,
      height: height - 56,
      borderColor: rgb(0.3, 0.3, 0.35),
      borderWidth: 1,
    });

    // Header Logo Text
    const headerTitle = "RAJUGARI VENTURES";
    const headerWidth = fontSansBold.widthOfTextAtSize(headerTitle, 16);
    page.drawText(headerTitle, {
      x: (width - headerWidth) / 2,
      y: height - 70,
      size: 16,
      font: fontSansBold,
      color: goldAccent,
    });

    // Subtitle
    const subTitle = "CERTIFICATE OF COMPLETION";
    const subTitleWidth = fontSerifBold.widthOfTextAtSize(subTitle, 28);
    page.drawText(subTitle, {
      x: (width - subTitleWidth) / 2,
      y: height - 120,
      size: 28,
      font: fontSerifBold,
      color: textWhite,
    });

    // Attestation line
    const textPresented = "This certificate is proudly awarded to";
    const presentedWidth = fontSerifItalic.widthOfTextAtSize(textPresented, 16);
    page.drawText(textPresented, {
      x: (width - presentedWidth) / 2,
      y: height - 175,
      size: 16,
      font: fontSerifItalic,
      color: textMuted,
    });

    // Candidate Name
    const candidateName = name.toUpperCase();
    const nameWidth = fontSerifBold.widthOfTextAtSize(candidateName, 34);
    page.drawText(candidateName, {
      x: (width - nameWidth) / 2,
      y: height - 235,
      size: 34,
      font: fontSerifBold,
      color: goldAccent,
    });

    // Underline below name
    page.drawLine({
      start: { x: (width - Math.max(nameWidth, 300)) / 2, y: height - 245 },
      end: { x: (width + Math.max(nameWidth, 300)) / 2, y: height - 245 },
      thickness: 1.5,
      color: goldAccent,
    });

    // Achievement text
    const textCourse = `for successfully completing the specialized course in`;
    const courseLabelWidth = fontSerifItalic.widthOfTextAtSize(textCourse, 15);
    page.drawText(textCourse, {
      x: (width - courseLabelWidth) / 2,
      y: height - 290,
      size: 15,
      font: fontSerifItalic,
      color: textMuted,
    });

    // Course Title
    const courseTitle = course;
    const courseWidth = fontSansBold.widthOfTextAtSize(courseTitle, 22);
    page.drawText(courseTitle, {
      x: (width - courseWidth) / 2,
      y: height - 330,
      size: 22,
      font: fontSansBold,
      color: textWhite,
    });

    // Signatures & Footer
    page.drawText("DATE OF ISSUANCE", {
      x: 70,
      y: 90,
      size: 10,
      font: fontSansBold,
      color: textMuted,
    });
    page.drawText(issueDate, {
      x: 70,
      y: 70,
      size: 12,
      font: fontSans,
      color: textWhite,
    });

    // Center: Authorizing Signatory
    const sigName = "Doraswamy Raju";
    const sigNameWidth = fontSerifItalic.widthOfTextAtSize(sigName, 18);
    page.drawText(sigName, {
      x: (width - sigNameWidth) / 2,
      y: 85,
      size: 18,
      font: fontSerifItalic,
      color: goldAccent,
    });
    page.drawLine({
      start: { x: (width - 160) / 2, y: 75 },
      end: { x: (width + 160) / 2, y: 75 },
      thickness: 1,
      color: rgb(0.4, 0.4, 0.45),
    });
    const sigTitle = "AUTHORIZED SIGNATORY";
    const sigTitleWidth = fontSans.widthOfTextAtSize(sigTitle, 9);
    page.drawText(sigTitle, {
      x: (width - sigTitleWidth) / 2,
      y: 60,
      size: 9,
      font: fontSans,
      color: textMuted,
    });

    // Right: Verification ID
    page.drawText("CERTIFICATE ID", {
      x: width - 210,
      y: 90,
      size: 10,
      font: fontSansBold,
      color: textMuted,
    });
    page.drawText(certId, {
      x: width - 210,
      y: 70,
      size: 12,
      font: fontSans,
      color: goldAccent,
    });

    // Save PDF as Buffer
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    // Update database record to approved
    await pool.query(
      "UPDATE certificates SET cert_id = ?, status = 'approved' WHERE id = ?",
      [certId, certIdParam]
    );

    // Email Dispatch via Nodemailer
    let emailSent = false;
    const nodemailer = await import('nodemailer');
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

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
      } catch (mailErr) {
        console.error("Failed to send email via SMTP:", mailErr);
      }
    } else {
      console.log(`[SMTP Not Configured] Certificate approved for ${email} (${certId}). Email dispatch simulated.`);
    }

    res.json({
      success: true,
      message: "Certificate approved and email dispatched.",
      certId,
      emailSent
    });
  } catch (err: any) {
    console.error("Error approving certificate:", err);
    res.status(500).json({ error: "Failed to approve certificate: " + err.message });
  }
});

// 4. Reject Certificate Request (Admin Auth API)
app.post("/api/certificates/reject/:id", authenticateToken, async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ error: "Database unavailable" });

    await pool.query("UPDATE certificates SET status = 'rejected' WHERE id = ?", [req.params.id]);
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
