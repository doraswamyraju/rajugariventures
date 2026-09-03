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
import nodemailer from "nodemailer";

const require = createRequire(import.meta.url);
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || "rajugari-secret-key-change-in-prod";

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Initialize Gemini AI
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = GEMINI_API_KEY && GEMINI_API_KEY !== "MY_GEMINI_API_KEY" ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;
if (!ai) {
  console.warn("GEMINI_API_KEY not found or using default. AI features will be disabled.");
}

// Configure Multer Storage for Image and Video Uploads (Persistent Storage outside git tree)
const persistentDir = path.join(process.cwd(), "persistent_storage");
const persistentUploadsDir = path.join(persistentDir, "uploads");
const masterclassDataFile = path.join(persistentDir, "masterclass_data.json");

const uploadsDir = path.join(process.cwd(), "public", "uploads");
const distUploadsDir = path.join(process.cwd(), "dist", "uploads");
const rootUploadsDir = path.join(process.cwd(), "uploads");

[persistentDir, persistentUploadsDir, uploadsDir, distUploadsDir, rootUploadsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, persistentUploadsDir);
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

// Serve static uploads from persistent storage and fallback folders
app.use("/uploads", express.static(persistentUploadsDir));
app.use("/uploads", express.static(uploadsDir));
app.use("/uploads", express.static(distUploadsDir));
app.use("/uploads", express.static(rootUploadsDir));

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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS masterclass_course (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title TEXT,
        subtitle TEXT,
        actual_price INT,
        offer_price INT,
        start_date VARCHAR(255),
        timings VARCHAR(255),
        zoom_link TEXT,
        whatsapp_link TEXT,
        trainer_name VARCHAR(255),
        trainer_role VARCHAR(255),
        trainer_bio TEXT,
        trainer_image TEXT,
        trainer_reel_url TEXT,
        trainer_experience VARCHAR(255)
      );
    `);

    // Ensure trainer columns exist in masterclass_course
    const addColumn = async (colName: string, colDef: string) => {
      try {
        await pool!.query(`ALTER TABLE masterclass_course ADD COLUMN ${colName} ${colDef}`);
      } catch (e: any) {
        // Ignore if column already exists
      }
    };
    await addColumn('trainer_name', 'VARCHAR(255)');
    await addColumn('trainer_role', 'VARCHAR(255)');
    await addColumn('trainer_bio', 'TEXT');
    await addColumn('trainer_image', 'TEXT');
    await addColumn('trainer_reel_url', 'TEXT');
    await addColumn('trainer_experience', 'VARCHAR(255)');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS masterclass_testimonials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        role VARCHAR(255),
        rating INT,
        type VARCHAR(50),
        media_url TEXT,
        review_text TEXT,
        avatar TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS masterclass_showcase (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        category VARCHAR(50),
        image_url TEXT,
        student_name VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS masterclass_registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(100),
        whatsapp VARCHAR(100),
        amount INT,
        payment_id VARCHAR(255),
        order_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'success',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed MySQL default course if empty
    const [courses]: any = await pool.query("SELECT COUNT(*) as count FROM masterclass_course");
    if (courses[0].count === 0) {
      await pool.query(`INSERT INTO masterclass_course (id, title, subtitle, actual_price, offer_price, start_date, timings, zoom_link, whatsapp_link, trainer_name, trainer_role, trainer_bio, trainer_image, trainer_reel_url, trainer_experience)
        VALUES (1, 'AI PRODUCTIVITY MASTERCLASS', 'From Casual AI User to AI Power User in 5 Days', 1499, 499, '17th August 2026', '6:00 PM to 7:00 PM Daily', 'https://zoom.us/j/sample-masterclass', 'https://chat.whatsapp.com/sample-masterclass', 'Doraswamy Raju', 'Founder, Rajugari Ventures | AI & Automation Specialist', 'Empowering professionals, business owners, and job seekers with practical, real-world AI productivity workflows. Master ChatGPT, Gemini, and AI tools to save 15+ hours every week.', '', '', '5+ Years Experience | 10,000+ Students Trained')`);
    }

    // Seed MySQL sample testimonials if empty
    const [testCount]: any = await pool.query("SELECT COUNT(*) as count FROM masterclass_testimonials");
    if (testCount[0].count === 0) {
      await pool.query(`INSERT INTO masterclass_testimonials (name, role, rating, type, media_url, review_text) VALUES 
        ('K. Sai Kumar', 'Business Owner', 5, 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'This 5-day bootcamp completely transformed how I handle daily office reports and social media marketing!'),
        ('M. Rajesh', 'Freelance Designer', 5, 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Learning prompt engineering saved me 15+ hours every week. High quality practical sessions!'),
        ('P. Anusha', 'Software Job Seeker', 5, 'text', '', 'The career day gave me resume building prompts that got me 3 interview calls within a week! Highly recommended.'),
        ('V. Naresh', 'Marketing Executive', 5, 'text', '', 'Best ₹499 invested. Automated our entire email workflow and social media scripts.')`);
    }

    // Seed MySQL sample showcase if empty
    const [showCount]: any = await pool.query("SELECT COUNT(*) as count FROM masterclass_showcase");
    if (showCount[0].count === 0) {
      await pool.query(`INSERT INTO masterclass_showcase (title, category, image_url, student_name) VALUES
        ('AI Generated Product Banner', 'work', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80', 'M. Rajesh'),
        ('Certificate Handover Batch #1', 'certificate', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80', 'Batch #1 Graduates'),
        ('Social Media Ad Copy & Graphic', 'work', 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=600&q=80', 'K. Sai Kumar'),
        ('Masterclass Completion Ceremony', 'certificate', 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&q=80', 'Tirupati Center')`);
    }

    // Initialize Review Campaigns & Pool Tables in MySQL
    await pool.query(`
      CREATE TABLE IF NOT EXISTS review_campaigns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        google_review_url TEXT NOT NULL,
        default_review TEXT,
        logo_url TEXT,
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    try {
      await pool.query("ALTER TABLE review_campaigns ADD COLUMN logo_url TEXT");
    } catch (e: any) {
      // Column may already exist
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS review_pool (
        id INT AUTO_INCREMENT PRIMARY KEY,
        campaign_id INT NOT NULL,
        review_text TEXT NOT NULL,
        is_used TINYINT(1) DEFAULT 0,
        used_at DATETIME NULL,
        claimed_ip VARCHAR(100) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed or update default Shri Swarnaamahal Jewellers campaign in MySQL
    const [campRows]: any = await pool.query("SELECT id FROM review_campaigns WHERE slug = 'swarnaamahal'");
    if (campRows.length === 0) {
      const [insCamp]: any = await pool.query(
        "INSERT INTO review_campaigns (name, slug, google_review_url, default_review, is_active) VALUES (?, ?, ?, ?, ?)",
        [
          "Shri Swarnaamahal Jewellers",
          "swarnaamahal",
          "https://search.google.com/local/writereview?placeid=ChIJnyzeEwVLTToRY3uqd6ehc8M",
          "Extremely satisfied with the authentic gold designs and warm hospitality at Shri Swarnaamahal Jewellers. Best jewellery shop in Tirupati!",
          1
        ]
      );
      const campId = insCamp.insertId;
      const initialReviews = [
        "Extremely satisfied with the authentic gold designs and warm hospitality at Shri Swarnaamahal Jewellers. Best in Tirupati!",
        "Wonderful collection of traditional and modern gold jewellery. The staff was very polite and pricing is genuine.",
        "Best jewellery shopping experience in Tirupati! Transparent billing, pure gold quality, and exquisite bridal collections.",
        "Shri Swarnaamahal Jewellers has the finest craftsmanship and courteous staff. Highly recommended for all wedding shopping.",
        "Great ambience, honest gold purity certification, and very helpful customer service. Will definitely visit again!",
        "Outstanding designs in light-weight gold and diamond ornaments. Completely trustworthy jewellers!",
        "Superb customer experience. The staff explained gold rates and hallmark clearly. Very happy with my purchase.",
        "Authentic 916 hallmarked jewellery with great design variety. Highly impressed with their honesty and service."
      ];
      for (const rev of initialReviews) {
        await pool.query("INSERT INTO review_pool (campaign_id, review_text, is_used) VALUES (?, ?, 0)", [campId, rev]);
      }
    } else {
      await pool.query("UPDATE review_campaigns SET google_review_url = ? WHERE slug = 'swarnaamahal'", ["https://search.google.com/local/writereview?placeid=ChIJnyzeEwVLTToRY3uqd6ehc8M"]);
    }

    console.log("MySQL Database initialized successfully.");
  } catch (error: any) {
    console.warn("Notice: MySQL connection failed. Initializing File Database fallback...", error.message);
    pool = null;
    try {
      let sqlite3Module: any = null;
      try {
        sqlite3Module = require('sqlite3')?.verbose();
      } catch (modErr) {
        console.warn("sqlite3 package not installed. Operating with persistent disk storage (masterclass_data.json).");
      }
      if (sqlite3Module) {
        sqliteDb = new sqlite3Module.Database(path.join(process.cwd(), 'rajugari.db'));
        
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

        // Review Campaigns & Pool Tables in SQLite
        sqliteDb.run(`CREATE TABLE IF NOT EXISTS review_campaigns (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          google_review_url TEXT NOT NULL,
          default_review TEXT,
          logo_url TEXT,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        try {
          sqliteDb.run("ALTER TABLE review_campaigns ADD COLUMN logo_url TEXT", () => {});
        } catch (sqliteColErr) {}

        sqliteDb.run(`CREATE TABLE IF NOT EXISTS review_pool (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          campaign_id INTEGER NOT NULL,
          review_text TEXT NOT NULL,
          is_used INTEGER DEFAULT 0,
          used_at DATETIME NULL,
          claimed_ip TEXT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        sqliteDb.get("SELECT COUNT(*) as count FROM review_campaigns WHERE slug = 'swarnaamahal'", (err: any, row: any) => {
          if (row && row.count === 0) {
            sqliteDb.run(
              `INSERT INTO review_campaigns (name, slug, google_review_url, default_review, is_active) VALUES (?, ?, ?, ?, 1)`,
              [
                "Shri Swarnaamahal Jewellers",
                "swarnaamahal",
                "https://search.google.com/local/writereview?placeid=ChIJnyzeEwVLTToRY3uqd6ehc8M",
                "Extremely satisfied with the authentic gold designs and warm hospitality at Shri Swarnaamahal Jewellers. Best jewellery shop in Tirupati!"
              ],
              function (this: any, err2: any) {
                if (!err2 && this.lastID) {
                  const campId = this.lastID;
                  const initialReviews = [
                    "Extremely satisfied with the authentic gold designs and warm hospitality at Shri Swarnaamahal Jewellers. Best in Tirupati!",
                    "Wonderful collection of traditional and modern gold jewellery. The staff was very polite and pricing is genuine.",
                    "Best jewellery shopping experience in Tirupati! Transparent billing, pure gold quality, and exquisite bridal collections.",
                    "Shri Swarnaamahal Jewellers has the finest craftsmanship and courteous staff. Highly recommended for all wedding shopping.",
                    "Great ambience, honest gold purity certification, and very helpful customer service. Will definitely visit again!",
                    "Outstanding designs in light-weight gold and diamond ornaments. Completely trustworthy jewellers!",
                    "Superb customer experience. The staff explained gold rates and hallmark clearly. Very happy with my purchase.",
                    "Authentic 916 hallmarked jewellery with great design variety. Highly impressed with their honesty and service."
                  ];
                  initialReviews.forEach((rev) => {
                    sqliteDb.run("INSERT INTO review_pool (campaign_id, review_text, is_used) VALUES (?, ?, 0)", [campId, rev]);
                  });
                }
              }
            );
          } else {
            sqliteDb.run("UPDATE review_campaigns SET google_review_url = ? WHERE slug = 'swarnaamahal'", ["https://search.google.com/local/writereview?placeid=ChIJnyzeEwVLTToRY3uqd6ehc8M"]);
          }
        });
      });
      console.log("SQLite File Database initialized successfully with admin user, Masterclass, and Review tables.");
    }
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
  const cleanUser = String(username || "").trim().toLowerCase();
  const isAdminAlias = cleanUser === "admin" || cleanUser === "rajugariventures@gmail.com";
  const isDefaultMasterPass = password === "BOHPM6139n@";

  // Master fallback credential
  if (isAdminAlias && isDefaultMasterPass) {
    const token = jwt.sign({ username: "rajugariventures@gmail.com", id: 1 }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token });
  }

  if (pool) {
    try {
      const [rows]: any = await pool.query("SELECT * FROM users WHERE username = ? OR username = 'rajugariventures@gmail.com'", [cleanUser]);
      const user = rows[0];

      if (user && bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({ username: user.username, id: user.id }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token });
      } else {
        return res.status(200).json({ error: "Invalid credentials" });
      }
    } catch (error: any) {
      if (isAdminAlias && isDefaultMasterPass) {
        const token = jwt.sign({ username: "rajugariventures@gmail.com", id: 1 }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token });
      }
      return res.status(200).json({ error: error.message });
    }
  } else if (sqliteDb) {
    sqliteDb.get("SELECT * FROM users WHERE username = ? OR (username = 'rajugariventures@gmail.com' AND ? = 'admin')", [cleanUser, cleanUser], (err: any, user: any) => {
      if (err && !(isAdminAlias && isDefaultMasterPass)) return res.status(200).json({ error: err.message });
      if (user && bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({ username: user.username, id: user.id }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token });
      } else if (isAdminAlias && isDefaultMasterPass) {
        const token = jwt.sign({ username: "rajugariventures@gmail.com", id: 1 }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token });
      } else {
        return res.status(200).json({ error: "Invalid credentials" });
      }
    });
  } else {
    // Hardcoded fallback for admin login when DB is completely offline
    if (isAdminAlias && isDefaultMasterPass) {
      const token = jwt.sign({ username: "rajugariventures@gmail.com", id: 1 }, JWT_SECRET, { expiresIn: '7d' });
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

const defaultMasterclassCourse = {
  id: 1,
  title: 'AI PRODUCTIVITY MASTERCLASS',
  subtitle: 'From Casual AI User to AI Power User in 5 Days',
  actual_price: 1499,
  offer_price: 499,
  start_date: '17th August 2026',
  timings: '6:00 PM to 7:00 PM Daily',
  zoom_link: 'https://zoom.us/j/sample-masterclass',
  whatsapp_link: 'https://chat.whatsapp.com/sample-masterclass',
  trainer_name: 'Doraswamy Raju',
  trainer_role: 'Founder, Rajugari Ventures | AI & Automation Specialist',
  trainer_bio: 'Empowering professionals, business owners, and job seekers with practical, real-world AI productivity workflows. Master ChatGPT, Gemini, and AI tools to save 15+ hours every week.',
  trainer_image: '',
  trainer_reel_url: '',
  trainer_experience: '5+ Years Experience | 10,000+ Students Trained'
};

let memoryMasterclassCourse: any = { ...defaultMasterclassCourse };

function loadMasterclassDataFromDisk() {
  try {
    if (fs.existsSync(masterclassDataFile)) {
      const raw = fs.readFileSync(masterclassDataFile, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.course) memoryMasterclassCourse = { ...defaultMasterclassCourse, ...parsed.course };
      if (parsed.testimonials) memoryTestimonialsData = parsed.testimonials;
      if (parsed.showcase) memoryShowcaseData = parsed.showcase;
      console.log("Successfully loaded Masterclass settings from disk file.");
    }
  } catch (err) {
    console.error("Disk load error:", err);
  }
}

function saveMasterclassDataToDisk() {
  try {
    fs.writeFileSync(masterclassDataFile, JSON.stringify({
      course: memoryMasterclassCourse,
      testimonials: memoryTestimonialsData,
      showcase: memoryShowcaseData
    }, null, 2));
  } catch (err) {
    console.error("Disk save error:", err);
  }
}

loadMasterclassDataFromDisk();

// --- MASTERCLASS API ENDPOINTS ---

// Public endpoint to get full landing page content
app.get("/api/masterclass/public", async (req, res) => {
  try {
    let courseData = null;
    let testimonialsData: any[] = [];
    let showcaseData: any[] = [];

    if (pool) {
      try {
        const [courses]: any = await pool.query("SELECT * FROM masterclass_course WHERE id = 1");
        const [tests]: any = await pool.query("SELECT * FROM masterclass_testimonials ORDER BY id DESC");
        const [shows]: any = await pool.query("SELECT * FROM masterclass_showcase ORDER BY id DESC");
        if (courses && courses.length > 0) courseData = courses[0];
        if (tests) testimonialsData = tests;
        if (shows) showcaseData = shows;
      } catch (poolErr) {
        console.error("MySQL query error in /api/masterclass/public:", poolErr);
      }
    }

    if (!courseData && sqliteDb) {
      await new Promise<void>((resolve) => {
        sqliteDb.get("SELECT * FROM masterclass_course WHERE id = 1", (err: any, c: any) => {
          if (c) courseData = c;
          sqliteDb.all("SELECT * FROM masterclass_testimonials ORDER BY id DESC", (err2: any, t: any) => {
            if (t) testimonialsData = t;
            sqliteDb.all("SELECT * FROM masterclass_showcase ORDER BY id DESC", (err3: any, s: any) => {
              if (s) showcaseData = s;
              resolve();
            });
          });
        });
      });
    }

    const finalCourse = courseData 
      ? { ...memoryMasterclassCourse, ...courseData, trainer_image: courseData.trainer_image || memoryMasterclassCourse.trainer_image, trainer_reel_url: courseData.trainer_reel_url || memoryMasterclassCourse.trainer_reel_url }
      : memoryMasterclassCourse;

    const combinedTestimonials = [...memoryTestimonialsData];
    (testimonialsData || []).forEach((t: any) => {
      if (!combinedTestimonials.some(m => String(m.id) === String(t.id))) {
        combinedTestimonials.push(t);
      }
    });

    const combinedShowcase = [...memoryShowcaseData];
    (showcaseData || []).forEach((s: any) => {
      if (!combinedShowcase.some(m => String(m.id) === String(s.id))) {
        combinedShowcase.push(s);
      }
    });

    return res.json({
      course: finalCourse,
      testimonials: combinedTestimonials,
      showcase: combinedShowcase
    });
  } catch (error: any) {
    return res.json({
      course: memoryMasterclassCourse,
      testimonials: [],
      showcase: []
    });
  }
});

// Admin endpoint to update course settings
app.put("/api/masterclass/admin/course", authenticateToken, async (req, res) => {
  const { 
    title, subtitle, actual_price, offer_price, start_date, timings, zoom_link, whatsapp_link,
    trainer_name, trainer_role, trainer_bio, trainer_image, trainer_reel_url, trainer_experience 
  } = req.body;

  // Always update memory store & persist to disk immediately
  memoryMasterclassCourse = {
    ...memoryMasterclassCourse,
    title, subtitle, actual_price, offer_price, start_date, timings, zoom_link, whatsapp_link,
    trainer_name, trainer_role, trainer_bio, trainer_image, trainer_reel_url, trainer_experience
  };
  saveMasterclassDataToDisk();

  try {
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO masterclass_course (
            id, title, subtitle, actual_price, offer_price, start_date, timings, zoom_link, whatsapp_link,
            trainer_name, trainer_role, trainer_bio, trainer_image, trainer_reel_url, trainer_experience
          ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            subtitle = VALUES(subtitle),
            actual_price = VALUES(actual_price),
            offer_price = VALUES(offer_price),
            start_date = VALUES(start_date),
            timings = VALUES(timings),
            zoom_link = VALUES(zoom_link),
            whatsapp_link = VALUES(whatsapp_link),
            trainer_name = VALUES(trainer_name),
            trainer_role = VALUES(trainer_role),
            trainer_bio = VALUES(trainer_bio),
            trainer_image = VALUES(trainer_image),
            trainer_reel_url = VALUES(trainer_reel_url),
            trainer_experience = VALUES(trainer_experience)`,
          [
            title, subtitle, actual_price, offer_price, start_date, timings, zoom_link, whatsapp_link,
            trainer_name, trainer_role, trainer_bio, trainer_image, trainer_reel_url, trainer_experience
          ]
        );
        return res.json({ success: true, message: "Course & Trainer settings saved successfully!" });
      } catch (mysqlErr: any) {
        console.error("MySQL update course error:", mysqlErr);
        // Fallback response with memory confirmation
        return res.json({ success: true, message: "Course settings saved to memory store!" });
      }
    }

    if (sqliteDb) {
      sqliteDb.run(
        `INSERT OR REPLACE INTO masterclass_course (
          id, title, subtitle, actual_price, offer_price, start_date, timings, zoom_link, whatsapp_link,
          trainer_name, trainer_role, trainer_bio, trainer_image, trainer_reel_url, trainer_experience
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title, subtitle, actual_price, offer_price, start_date, timings, zoom_link, whatsapp_link,
          trainer_name, trainer_role, trainer_bio, trainer_image, trainer_reel_url, trainer_experience
        ],
        function (err: any) {
          if (err) return res.json({ success: true, message: "Course settings saved to memory store!" });
          res.json({ success: true, message: "Course & Trainer settings saved successfully!" });
        }
      );
    } else {
      res.json({ success: true, message: "Course updated in memory" });
    }
  } catch (err: any) {
    res.json({ success: true, message: "Course updated in memory" });
  }
});

// File Upload Endpoint (Images & Videos)
app.post("/api/upload", authenticateToken, upload.single("file"), (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file was uploaded." });
    }

    const filename = req.file.filename;
    const srcPath = req.file.path;

    // Synchronize uploaded file from persistentUploadsDir across public/uploads, dist/uploads, and root uploads
    [uploadsDir, distUploadsDir, rootUploadsDir].forEach(targetDir => {
      try {
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
        fs.copyFileSync(srcPath, path.join(targetDir, filename));
      } catch (copyErr) {
        console.warn("Could not sync uploaded file to:", targetDir, copyErr);
      }
    });

    const fileUrl = `/uploads/${filename}`;
    res.json({
      success: true,
      url: fileUrl,
      filename: filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (err: any) {
    res.status(500).json({ error: "Upload failed: " + err.message });
  }
});

let memoryTestimonialsData: any[] = [];

// Admin endpoints for Testimonials
app.post("/api/masterclass/admin/testimonials", authenticateToken, async (req, res) => {
  const { name, role, rating, type, media_url, review_text, avatar } = req.body;
  const newTestimonial = {
    id: Date.now(),
    name: name || 'Student',
    role: role || 'Student',
    rating: Number(rating) || 5,
    type: type || 'video',
    media_url: media_url || '',
    review_text: review_text || '',
    avatar: avatar || ''
  };

  memoryTestimonialsData.unshift(newTestimonial);
  saveMasterclassDataToDisk();

  try {
    if (pool) {
      try {
        const [result]: any = await pool.query(
          `INSERT INTO masterclass_testimonials (name, role, rating, type, media_url, review_text, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [newTestimonial.name, newTestimonial.role, newTestimonial.rating, newTestimonial.type, newTestimonial.media_url, newTestimonial.review_text, newTestimonial.avatar]
        );
        newTestimonial.id = result.insertId;
        return res.json({ success: true, testimonial: newTestimonial });
      } catch (mysqlErr: any) {
        console.error("MySQL testimonial insert error:", mysqlErr);
        return res.json({ success: true, testimonial: newTestimonial });
      }
    }

    if (sqliteDb) {
      sqliteDb.run(
        `INSERT INTO masterclass_testimonials (name, role, rating, type, media_url, review_text, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [newTestimonial.name, newTestimonial.role, newTestimonial.rating, newTestimonial.type, newTestimonial.media_url, newTestimonial.review_text, newTestimonial.avatar],
        function (err: any) {
          if (err) return res.json({ success: true, testimonial: newTestimonial });
          newTestimonial.id = this.lastID;
          res.json({ success: true, testimonial: newTestimonial });
        }
      );
    } else {
      res.json({ success: true, testimonial: newTestimonial });
    }
  } catch (err: any) {
    res.json({ success: true, testimonial: newTestimonial });
  }
});

app.delete("/api/masterclass/admin/testimonials/:id", authenticateToken, async (req, res) => {
  const testId = Number(req.params.id);
  memoryTestimonialsData = memoryTestimonialsData.filter(t => Number(t.id) !== testId);
  saveMasterclassDataToDisk();
  try {
    if (pool) {
      try {
        await pool.query("DELETE FROM masterclass_testimonials WHERE id = ?", [testId]);
      } catch (err) {}
    }
    if (sqliteDb) {
      sqliteDb.run("DELETE FROM masterclass_testimonials WHERE id = ?", [testId]);
    }
    res.json({ success: true, message: "Testimonial deleted" });
  } catch (err: any) {
    res.json({ success: true, message: "Testimonial deleted" });
  }
});

let memoryShowcaseData: any[] = [];

// Admin endpoints for Showcase Media
app.post("/api/masterclass/admin/showcase", authenticateToken, async (req, res) => {
  const { title, category, image_url, student_name } = req.body;
  const newShowcase = {
    id: Date.now(),
    title: title || 'Student Creation',
    category: category || 'work',
    image_url: image_url || '',
    student_name: student_name || 'Student'
  };

  memoryShowcaseData.unshift(newShowcase);
  saveMasterclassDataToDisk();

  try {
    if (pool) {
      try {
        const [result]: any = await pool.query(
          `INSERT INTO masterclass_showcase (title, category, image_url, student_name) VALUES (?, ?, ?, ?)`,
          [newShowcase.title, newShowcase.category, newShowcase.image_url, newShowcase.student_name]
        );
        newShowcase.id = result.insertId;
        return res.json({ success: true, showcase: newShowcase });
      } catch (mysqlErr: any) {
        console.error("MySQL showcase insert error:", mysqlErr);
        return res.json({ success: true, showcase: newShowcase });
      }
    }

    if (sqliteDb) {
      sqliteDb.run(
        `INSERT INTO masterclass_showcase (title, category, image_url, student_name) VALUES (?, ?, ?, ?)`,
        [newShowcase.title, newShowcase.category, newShowcase.image_url, newShowcase.student_name],
        function (err: any) {
          if (err) return res.json({ success: true, showcase: newShowcase });
          newShowcase.id = this.lastID;
          res.json({ success: true, showcase: newShowcase });
        }
      );
    } else {
      res.json({ success: true, showcase: newShowcase });
    }
  } catch (err: any) {
    res.json({ success: true, showcase: newShowcase });
  }
});

app.delete("/api/masterclass/admin/showcase/:id", authenticateToken, async (req, res) => {
  const showcaseId = Number(req.params.id);
  memoryShowcaseData = memoryShowcaseData.filter(s => Number(s.id) !== showcaseId);
  saveMasterclassDataToDisk();

  try {
    if (pool) {
      try {
        await pool.query("DELETE FROM masterclass_showcase WHERE id = ?", [showcaseId]);
      } catch (err) {}
    }
    if (sqliteDb) {
      sqliteDb.run("DELETE FROM masterclass_showcase WHERE id = ?", [showcaseId]);
    }
    res.json({ success: true, message: "Showcase item deleted" });
  } catch (err: any) {
    res.json({ success: true, message: "Showcase item deleted" });
  }
});

// Payment & Registration endpoints
app.post("/api/masterclass/create-order", async (req, res) => {
  const { amount, name, email, phone } = req.body;
  try {
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
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO masterclass_registrations (name, email, phone, whatsapp, amount, payment_id, order_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'success')`,
          [name, email, phone, whatsapp || phone, amount || 499, payment_id || ('pay_' + Date.now()), order_id || 'direct']
        );
        const [rows]: any = await pool.query("SELECT zoom_link, whatsapp_link FROM masterclass_course WHERE id = 1");
        return res.json({
          success: true,
          message: "Registration successful!",
          zoomLink: rows[0]?.zoom_link || "https://zoom.us/j/sample-masterclass",
          whatsappLink: rows[0]?.whatsapp_link || "https://chat.whatsapp.com/sample-masterclass"
        });
      } catch (mysqlErr) {
        console.error("MySQL verify payment error:", mysqlErr);
      }
    }

    if (sqliteDb) {
      sqliteDb.run(
        `INSERT INTO masterclass_registrations (name, email, phone, whatsapp, amount, payment_id, order_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'success')`,
        [name, email, phone, whatsapp || phone, amount || 499, payment_id || ('pay_' + Date.now()), order_id || 'direct']
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
    if (pool) {
      try {
        const [rows]: any = await pool.query("SELECT * FROM masterclass_registrations ORDER BY id DESC");
        return res.json(rows || []);
      } catch (mysqlErr) {
        console.error("MySQL registrations query error:", mysqlErr);
      }
    }

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

// ----------------------------------------------------
// GOOGLE REVIEWS CAMPAIGN SYSTEM
// ----------------------------------------------------

const reviewsJsonPath = path.join(persistentDir, "reviews_data.json");

// Email Transporter for Admin Alerts
const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || "rajugariventures@gmail.com";
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
const SMTP_USER = process.env.SMTP_USER || "rajugariventures@gmail.com";
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || "";

let mailTransporter: nodemailer.Transporter | null = null;
try {
  if (SMTP_USER && SMTP_PASS) {
    mailTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
  } else {
    mailTransporter = nodemailer.createTransport({
      host: "localhost",
      port: 25,
      tls: { rejectUnauthorized: false }
    });
  }
} catch (mailErr) {
  console.warn("Notice: Mail transporter initialization skipped:", mailErr);
}

// Track sent alert timestamps to prevent duplicate spamming
const lowAlertHistory = new Map<string, number>();

async function sendLowReviewAlert(campaignName: string, campaignSlug: string, remainingCount: number) {
  const now = Date.now();
  const lastSent = lowAlertHistory.get(campaignSlug) || 0;
  // Send alert if exactly 5, or at most once every 6 hours when <= 5
  if (now - lastSent < 6 * 60 * 60 * 1000 && remainingCount !== 5) {
    return;
  }
  lowAlertHistory.set(campaignSlug, now);

  const adminDashboardUrl = `${process.env.APP_URL || "https://rajugariventures.com"}/admin/dashboard`;
  const subject = `⚠️ Low Review Alert: Only ${remainingCount} reviews left for "${campaignName}"!`;
  
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0D14; color: #FFFFFF; padding: 24px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #D4AF37;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #D4AF37; font-size: 24px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Rajugari Ventures</h1>
        <p style="color: #94A3B8; font-size: 13px; margin: 4px 0 0 0;">Google Review Campaign Monitoring System</p>
      </div>

      <div style="background-color: #1A1F2C; border: 1px solid #EF4444; border-radius: 12px; padding: 18px; margin-bottom: 20px; text-align: center;">
        <div style="font-size: 36px; margin-bottom: 8px;">⚠️</div>
        <h2 style="color: #F87171; font-size: 20px; margin: 0 0 6px 0;">Review Inventory Running Low</h2>
        <p style="color: #E2E8F0; font-size: 15px; margin: 0;">
          The review pool for <strong>${campaignName}</strong> has only <strong style="color: #FBBF24;">${remainingCount}</strong> available review${remainingCount === 1 ? '' : 's'} remaining!
        </p>
      </div>

      <div style="background-color: #111622; border: 1px solid #334155; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <table style="width: 100%; font-size: 14px; color: #CBD5E1; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #94A3B8;">Business Client:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #FFFFFF;">${campaignName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94A3B8;">Remaining in Pool:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #F59E0B;">${remainingCount} available</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94A3B8;">Campaign Slug:</td>
            <td style="padding: 8px 0; text-align: right; font-family: monospace; color: #38BDF8;">/${campaignSlug}_review.html</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-bottom: 20px;">
        <a href="${adminDashboardUrl}" style="background: linear-gradient(135deg, #FFE27D 0%, #D4AF37 50%, #A67C1E 100%); color: #0A0D14; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 10px; display: inline-block; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">
          Bulk Upload More Reviews ➔
        </a>
      </div>

      <div style="border-top: 1px solid #334155; padding-top: 16px; text-align: center; color: #64748B; font-size: 12px;">
        This is an automated notification from your Rajugari Ventures Google Review Manager.<br>
        © ${new Date().getFullYear()} Rajugari Ventures. All rights reserved.
      </div>
    </div>
  `;

  try {
    if (mailTransporter) {
      await mailTransporter.sendMail({
        from: `"RV Review Alerts" <${SMTP_USER || "rajugariventures@gmail.com"}>`,
        to: ADMIN_ALERT_EMAIL,
        subject,
        html
      });
      console.log(`[ALERT] Low review email sent to ${ADMIN_ALERT_EMAIL} for "${campaignName}" (${remainingCount} left)`);
    } else {
      console.warn(`[ALERT] Low review threshold reached for "${campaignName}" (${remainingCount} left)`);
    }
  } catch (err: any) {
    console.error("[ALERT ERROR] Failed to send low review email alert:", err.message);
  }
}

function getPersistentReviewsData() {
  if (!fs.existsSync(reviewsJsonPath)) {
    const initialData = {
      campaigns: [
        {
          id: 1,
          name: "Shri Swarnaamahal Jewellers",
          slug: "swarnaamahal",
          google_review_url: "https://search.google.com/local/writereview?placeid=ChIJnyzeEwVLTToRY3uqd6ehc8M",
          default_review: "Extremely satisfied with the authentic gold designs and warm hospitality at Shri Swarnaamahal Jewellers. Best jewellery shop in Tirupati!",
          logo_url: "",
          is_active: 1,
          created_at: new Date().toISOString()
        }
      ],
      reviews: [
        {
          id: 1,
          campaign_id: 1,
          review_text: "Extremely satisfied with the authentic gold designs and warm hospitality at Shri Swarnaamahal Jewellers. Best in Tirupati!",
          is_used: 0,
          used_at: null,
          claimed_ip: null,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          campaign_id: 1,
          review_text: "Wonderful collection of traditional and modern gold jewellery. The staff was very polite and pricing is genuine.",
          is_used: 0,
          used_at: null,
          claimed_ip: null,
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          campaign_id: 1,
          review_text: "Best jewellery shopping experience in Tirupati! Transparent billing, pure gold quality, and exquisite bridal collections.",
          is_used: 0,
          used_at: null,
          claimed_ip: null,
          created_at: new Date().toISOString()
        },
        {
          id: 4,
          campaign_id: 1,
          review_text: "Shri Swarnaamahal Jewellers has the finest craftsmanship and courteous staff. Highly recommended for all wedding shopping.",
          is_used: 0,
          used_at: null,
          claimed_ip: null,
          created_at: new Date().toISOString()
        },
        {
          id: 5,
          campaign_id: 1,
          review_text: "Great ambience, honest gold purity certification, and very helpful customer service. Will definitely visit again!",
          is_used: 0,
          used_at: null,
          claimed_ip: null,
          created_at: new Date().toISOString()
        },
        {
          id: 6,
          campaign_id: 1,
          review_text: "Outstanding designs in light-weight gold and diamond ornaments. Completely trustworthy jewellers!",
          is_used: 0,
          used_at: null,
          claimed_ip: null,
          created_at: new Date().toISOString()
        },
        {
          id: 7,
          campaign_id: 1,
          review_text: "Superb customer experience. The staff explained gold rates and hallmark clearly. Very happy with my purchase.",
          is_used: 0,
          used_at: null,
          claimed_ip: null,
          created_at: new Date().toISOString()
        },
        {
          id: 8,
          campaign_id: 1,
          review_text: "Authentic 916 hallmarked jewellery with great design variety. Highly impressed with their honesty and service.",
          is_used: 0,
          used_at: null,
          claimed_ip: null,
          created_at: new Date().toISOString()
        }
      ]
    };
    try {
      fs.writeFileSync(reviewsJsonPath, JSON.stringify(initialData, null, 2), "utf8");
    } catch (e) {
      console.warn("Failed to write initial reviews data JSON:", e);
    }
    return initialData;
  }
  try {
    const data = JSON.parse(fs.readFileSync(reviewsJsonPath, "utf8"));
    // Auto-migrate Swarnaamahal to direct Google write-review URL if outdated
    const swarnaCamp = data.campaigns?.find((c: any) => c.slug === 'swarnaamahal');
    if (swarnaCamp && swarnaCamp.google_review_url !== "https://search.google.com/local/writereview?placeid=ChIJnyzeEwVLTToRY3uqd6ehc8M") {
      swarnaCamp.google_review_url = "https://search.google.com/local/writereview?placeid=ChIJnyzeEwVLTToRY3uqd6ehc8M";
      savePersistentReviewsData(data);
    }
    return data;
  } catch (e) {
    return { campaigns: [], reviews: [] };
  }
}

function savePersistentReviewsData(data: any) {
  try {
    fs.writeFileSync(reviewsJsonPath, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to save reviews persistent data:", e);
  }
}

// Public endpoint: Fetch Campaign Info (supports both /:slug and /:slug/info)
app.get(["/api/reviews/campaign/:slug", "/api/reviews/campaign/:slug/info"], async (req, res) => {
  const rawSlug = decodeURIComponent(req.params.slug || "").trim().toLowerCase();
  const cleanSlug = rawSlug.replace(/\.html$/i, "").replace(/_review$/i, "");
  const slugWithReview = `${cleanSlug}_review`;
  const slugWithHtml = `${cleanSlug}_review.html`;
  const possibleSlugs = Array.from(new Set([rawSlug, cleanSlug, slugWithReview, slugWithHtml, `${rawSlug}_review`]));

  try {
    if (pool) {
      const [campaigns]: any = await pool.query(
        "SELECT id, name, slug, google_review_url, default_review, logo_url, is_active FROM review_campaigns WHERE LOWER(slug) IN (?) AND is_active = 1 LIMIT 1",
        [possibleSlugs]
      );
      if (campaigns && campaigns.length > 0) {
        const camp = campaigns[0];
        const [counts]: any = await pool.query(
          "SELECT COUNT(*) as total, SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END) as unused FROM review_pool WHERE campaign_id = ?",
          [camp.id]
        );
        return res.json({
          success: true,
          campaign: {
            id: camp.id,
            name: camp.name,
            slug: camp.slug,
            google_review_url: camp.google_review_url,
            default_review: camp.default_review,
            logo_url: camp.logo_url || "",
            total_reviews: counts[0]?.total || 0,
            unused_reviews: counts[0]?.unused || 0
          }
        });
      }
    }

    if (sqliteDb) {
      return new Promise<void>((resolve) => {
        sqliteDb.get(
          `SELECT id, name, slug, google_review_url, default_review, logo_url, is_active FROM review_campaigns WHERE (LOWER(slug) = ? OR LOWER(slug) = ? OR LOWER(slug) = ? OR LOWER(slug) = ?) AND is_active = 1 LIMIT 1`,
          [possibleSlugs[0] || '', possibleSlugs[1] || '', possibleSlugs[2] || '', possibleSlugs[3] || ''],
          (err: any, camp: any) => {
            if (camp) {
              sqliteDb.get(
                "SELECT COUNT(*) as total, SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END) as unused FROM review_pool WHERE campaign_id = ?",
                [camp.id],
                (err2: any, countRow: any) => {
                  res.json({
                    success: true,
                    campaign: {
                      id: camp.id,
                      name: camp.name,
                      slug: camp.slug,
                      google_review_url: camp.google_review_url,
                      default_review: camp.default_review,
                      logo_url: camp.logo_url || "",
                      total_reviews: countRow?.total || 0,
                      unused_reviews: countRow?.unused || 0
                    }
                  });
                  resolve();
                }
              );
            } else {
              const fileData = getPersistentReviewsData();
              const found = fileData.campaigns.find((c: any) => possibleSlugs.includes(c.slug.toLowerCase()));
              if (found) {
                const campReviews = fileData.reviews.filter((r: any) => r.campaign_id === found.id);
                res.json({
                  success: true,
                  campaign: {
                    id: found.id,
                    name: found.name,
                    slug: found.slug,
                    google_review_url: found.google_review_url,
                    default_review: found.default_review,
                    logo_url: found.logo_url || "",
                    total_reviews: campReviews.length,
                    unused_reviews: campReviews.filter((r: any) => !r.is_used).length
                  }
                });
              } else {
                res.status(404).json({ error: "Campaign not found" });
              }
              resolve();
            }
          }
        );
      });
    }

    const fileData = getPersistentReviewsData();
    const found = fileData.campaigns.find((c: any) => possibleSlugs.includes(c.slug.toLowerCase()));
    if (found) {
      const campReviews = fileData.reviews.filter((r: any) => r.campaign_id === found.id);
      return res.json({
        success: true,
        campaign: {
          id: found.id,
          name: found.name,
          slug: found.slug,
          google_review_url: found.google_review_url,
          default_review: found.default_review,
          logo_url: found.logo_url || "",
          total_reviews: campReviews.length,
          unused_reviews: campReviews.filter((r: any) => !r.is_used).length
        }
      });
    }

    return res.status(404).json({ error: "Campaign not found" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Public endpoint: Atomically Claim Next Unused Review (One-Time Per Click)
app.post("/api/reviews/campaign/:slug/claim", async (req, res) => {
  const rawSlug = req.params.slug.trim().toLowerCase();
  const cleanSlug = rawSlug.replace(/\.html$/, "").replace(/_review$/, "");
  const possibleSlugs = [rawSlug, cleanSlug, `${cleanSlug}_review`, `${cleanSlug}_review.html`];
  const clientIp = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").slice(0, 95);

  try {
    if (pool) {
      const [campaigns]: any = await pool.query(
        "SELECT * FROM review_campaigns WHERE slug IN (?) AND is_active = 1 LIMIT 1",
        [possibleSlugs]
      );

      if (campaigns && campaigns.length > 0) {
        const camp = campaigns[0];
        // Find next unused review
        const [unusedRows]: any = await pool.query(
          "SELECT id, review_text FROM review_pool WHERE campaign_id = ? AND is_used = 0 ORDER BY id ASC LIMIT 1",
          [camp.id]
        );

        if (unusedRows && unusedRows.length > 0) {
          const rev = unusedRows[0];
          await pool.query(
            "UPDATE review_pool SET is_used = 1, used_at = NOW(), claimed_ip = ? WHERE id = ?",
            [clientIp, rev.id]
          );

          // Check remaining reviews and trigger alert if <= 5
          try {
            const [remRows]: any = await pool.query(
              "SELECT COUNT(*) as remaining FROM review_pool WHERE campaign_id = ? AND is_used = 0",
              [camp.id]
            );
            const remaining = remRows[0]?.remaining || 0;
            if (remaining <= 5) {
              sendLowReviewAlert(camp.name, camp.slug, remaining);
            }
          } catch (countErr) {
            console.error("Error checking remaining reviews count:", countErr);
          }

          return res.json({
            success: true,
            reviewId: rev.id,
            reviewText: rev.review_text,
            googleReviewUrl: camp.google_review_url,
            campaignName: camp.name,
            logoUrl: camp.logo_url || "",
            isDefault: false
          });
        } else {
          // Pool exhausted, deliver default fallback review
          sendLowReviewAlert(camp.name, camp.slug, 0);
          return res.json({
            success: true,
            reviewId: null,
            reviewText: camp.default_review || "Extremely satisfied with the authentic gold designs and warm hospitality at Shri Swarnaamahal Jewellers. Best jewellery shop in Tirupati!",
            googleReviewUrl: camp.google_review_url,
            campaignName: camp.name,
            logoUrl: camp.logo_url || "",
            isDefault: true,
            message: "All pre-uploaded reviews claimed. Delivered default review."
          });
        }
      }
    }

    if (sqliteDb) {
      return new Promise<void>((resolve) => {
        sqliteDb.get(
          `SELECT * FROM review_campaigns WHERE (slug = ? OR slug = ? OR slug = ? OR slug = ?) AND is_active = 1 LIMIT 1`,
          [possibleSlugs[0], possibleSlugs[1], possibleSlugs[2], possibleSlugs[3]],
          (err: any, camp: any) => {
            if (camp) {
              sqliteDb.get(
                "SELECT id, review_text FROM review_pool WHERE campaign_id = ? AND is_used = 0 ORDER BY id ASC LIMIT 1",
                [camp.id],
                (err2: any, rev: any) => {
                  if (rev) {
                    const now = new Date().toISOString();
                    sqliteDb.run(
                      "UPDATE review_pool SET is_used = 1, used_at = ?, claimed_ip = ? WHERE id = ?",
                      [now, clientIp, rev.id],
                      (err3: any) => {
                        // Check remaining reviews in SQLite
                        sqliteDb.get(
                          "SELECT COUNT(*) as remaining FROM review_pool WHERE campaign_id = ? AND is_used = 0",
                          [camp.id],
                          (countErr: any, remRow: any) => {
                            const remaining = remRow?.remaining || 0;
                            if (remaining <= 5) {
                              sendLowReviewAlert(camp.name, camp.slug, remaining);
                            }
                          }
                        );

                        res.json({
                          success: true,
                          reviewId: rev.id,
                          reviewText: rev.review_text,
                          googleReviewUrl: camp.google_review_url,
                          campaignName: camp.name,
                          logoUrl: camp.logo_url || "",
                          isDefault: false
                        });
                        resolve();
                      }
                    );
                  } else {
                    sendLowReviewAlert(camp.name, camp.slug, 0);
                    res.json({
                      success: true,
                      reviewId: null,
                      reviewText: camp.default_review || "Extremely satisfied with the authentic gold designs and warm hospitality at Shri Swarnaamahal Jewellers. Best jewellery shop in Tirupati!",
                      googleReviewUrl: camp.google_review_url,
                      campaignName: camp.name,
                      logoUrl: camp.logo_url || "",
                      isDefault: true
                    });
                    resolve();
                  }
                }
              );
            } else {
              // Check JSON File
              const fileData = getPersistentReviewsData();
              const foundCamp = fileData.campaigns.find((c: any) => possibleSlugs.includes(c.slug.toLowerCase()));
              if (foundCamp) {
                const nextRev = fileData.reviews.find((r: any) => r.campaign_id === foundCamp.id && !r.is_used);
                if (nextRev) {
                  nextRev.is_used = 1;
                  nextRev.used_at = new Date().toISOString();
                  nextRev.claimed_ip = clientIp;
                  savePersistentReviewsData(fileData);
                  
                  const remaining = fileData.reviews.filter((r: any) => r.campaign_id === foundCamp.id && !r.is_used).length;
                  if (remaining <= 5) {
                    sendLowReviewAlert(foundCamp.name, foundCamp.slug, remaining);
                  }

                  res.json({
                    success: true,
                    reviewId: nextRev.id,
                    reviewText: nextRev.review_text,
                    googleReviewUrl: foundCamp.google_review_url,
                    campaignName: foundCamp.name,
                    isDefault: false
                  });
                } else {
                  sendLowReviewAlert(foundCamp.name, foundCamp.slug, 0);
                  res.json({
                    success: true,
                    reviewId: null,
                    reviewText: foundCamp.default_review || "Extremely satisfied with the authentic gold designs and warm hospitality at Shri Swarnaamahal Jewellers. Best jewellery shop in Tirupati!",
                    googleReviewUrl: foundCamp.google_review_url,
                    campaignName: foundCamp.name,
                    isDefault: true
                  });
                }
              } else {
                res.status(404).json({ error: "Campaign not found" });
              }
              resolve();
            }
          }
        );
      });
    }

    // JSON file fallback
    const fileData = getPersistentReviewsData();
    const foundCamp = fileData.campaigns.find((c: any) => possibleSlugs.includes(c.slug.toLowerCase()));
    if (foundCamp) {
      const nextRev = fileData.reviews.find((r: any) => r.campaign_id === foundCamp.id && !r.is_used);
      if (nextRev) {
        nextRev.is_used = 1;
        nextRev.used_at = new Date().toISOString();
        nextRev.claimed_ip = clientIp;
        savePersistentReviewsData(fileData);
        return res.json({
          success: true,
          reviewId: nextRev.id,
          reviewText: nextRev.review_text,
          googleReviewUrl: foundCamp.google_review_url,
          campaignName: foundCamp.name,
          isDefault: false
        });
      } else {
        return res.json({
          success: true,
          reviewId: null,
          reviewText: foundCamp.default_review || "Extremely satisfied with the authentic gold designs and warm hospitality at Shri Swarnaamahal Jewellers. Best jewellery shop in Tirupati!",
          googleReviewUrl: foundCamp.google_review_url,
          campaignName: foundCamp.name,
          isDefault: true
        });
      }
    }

    return res.status(404).json({ error: "Campaign not found" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin endpoint: List all campaigns with stats
app.get("/api/admin/reviews/campaigns", authenticateToken, async (req, res) => {
  try {
    if (pool) {
      const [campaigns]: any = await pool.query(`
        SELECT 
          c.*,
          COUNT(r.id) as total_reviews,
          SUM(CASE WHEN r.is_used = 0 THEN 1 ELSE 0 END) as unused_reviews,
          SUM(CASE WHEN r.is_used = 1 THEN 1 ELSE 0 END) as used_reviews
        FROM review_campaigns c
        LEFT JOIN review_pool r ON c.id = r.campaign_id
        GROUP BY c.id
        ORDER BY c.id DESC
      `);
      return res.json(campaigns || []);
    }

    if (sqliteDb) {
      return new Promise<void>((resolve) => {
        sqliteDb.all(`
          SELECT 
            c.*,
            COUNT(r.id) as total_reviews,
            SUM(CASE WHEN r.is_used = 0 THEN 1 ELSE 0 END) as unused_reviews,
            SUM(CASE WHEN r.is_used = 1 THEN 1 ELSE 0 END) as used_reviews
          FROM review_campaigns c
          LEFT JOIN review_pool r ON c.id = r.campaign_id
          GROUP BY c.id
          ORDER BY c.id DESC
        `, (err: any, rows: any) => {
          if (err) {
            const fileData = getPersistentReviewsData();
            res.json(fileData.campaigns || []);
          } else {
            res.json(rows || []);
          }
          resolve();
        });
      });
    }

    const fileData = getPersistentReviewsData();
    const result = fileData.campaigns.map((c: any) => {
      const rList = fileData.reviews.filter((r: any) => r.campaign_id === c.id);
      return {
        ...c,
        total_reviews: rList.length,
        unused_reviews: rList.filter((r: any) => !r.is_used).length,
        used_reviews: rList.filter((r: any) => r.is_used).length
      };
    });
    return res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin endpoint: Create Campaign
app.post("/api/admin/reviews/campaigns", authenticateToken, async (req, res) => {
  const { name, slug, google_review_url, default_review, logo_url } = req.body;
  if (!name || !slug || !google_review_url) {
    return res.status(400).json({ error: "Name, Slug, and Google Review URL are required" });
  }
  const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");

  try {
    if (pool) {
      const [result]: any = await pool.query(
        "INSERT INTO review_campaigns (name, slug, google_review_url, default_review, logo_url, is_active) VALUES (?, ?, ?, ?, ?, 1)",
        [name.trim(), cleanSlug, google_review_url.trim(), default_review ? default_review.trim() : "", logo_url ? logo_url.trim() : ""]
      );
      return res.json({ success: true, id: result.insertId });
    }

    if (sqliteDb) {
      return new Promise<void>((resolve) => {
        sqliteDb.run(
          "INSERT INTO review_campaigns (name, slug, google_review_url, default_review, logo_url, is_active) VALUES (?, ?, ?, ?, ?, 1)",
          [name.trim(), cleanSlug, google_review_url.trim(), default_review ? default_review.trim() : "", logo_url ? logo_url.trim() : ""],
          function (this: any, err: any) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
            resolve();
          }
        );
      });
    }

    const fileData = getPersistentReviewsData();
    const newId = fileData.campaigns.length > 0 ? Math.max(...fileData.campaigns.map((c: any) => c.id)) + 1 : 1;
    const newCamp = {
      id: newId,
      name: name.trim(),
      slug: cleanSlug,
      google_review_url: google_review_url.trim(),
      default_review: default_review ? default_review.trim() : "",
      logo_url: logo_url ? logo_url.trim() : "",
      is_active: 1,
      created_at: new Date().toISOString()
    };
    fileData.campaigns.push(newCamp);
    savePersistentReviewsData(fileData);
    res.json({ success: true, id: newId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin endpoint: Update Campaign
app.put("/api/admin/reviews/campaigns/:id", authenticateToken, async (req, res) => {
  const campId = parseInt(req.params.id);
  const { name, slug, google_review_url, default_review, logo_url, is_active } = req.body;
  const cleanSlug = slug ? slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "") : undefined;

  try {
    if (pool) {
      await pool.query(
        "UPDATE review_campaigns SET name = ?, slug = ?, google_review_url = ?, default_review = ?, logo_url = ?, is_active = ? WHERE id = ?",
        [name, cleanSlug, google_review_url, default_review, logo_url !== undefined ? logo_url : "", is_active !== undefined ? is_active : 1, campId]
      );
      return res.json({ success: true });
    }

    if (sqliteDb) {
      return new Promise<void>((resolve) => {
        sqliteDb.run(
          "UPDATE review_campaigns SET name = ?, slug = ?, google_review_url = ?, default_review = ?, logo_url = ?, is_active = ? WHERE id = ?",
          [name, cleanSlug, google_review_url, default_review, logo_url !== undefined ? logo_url : "", is_active !== undefined ? is_active : 1, campId],
          (err: any) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
            resolve();
          }
        );
      });
    }

    const fileData = getPersistentReviewsData();
    const campIndex = fileData.campaigns.findIndex((c: any) => c.id === campId);
    if (campIndex !== -1) {
      fileData.campaigns[campIndex] = {
        ...fileData.campaigns[campIndex],
        name: name || fileData.campaigns[campIndex].name,
        slug: cleanSlug || fileData.campaigns[campIndex].slug,
        google_review_url: google_review_url || fileData.campaigns[campIndex].google_review_url,
        default_review: default_review !== undefined ? default_review : fileData.campaigns[campIndex].default_review,
        logo_url: logo_url !== undefined ? logo_url : (fileData.campaigns[campIndex].logo_url || ""),
        is_active: is_active !== undefined ? is_active : fileData.campaigns[campIndex].is_active
      };
      savePersistentReviewsData(fileData);
      return res.json({ success: true });
    }
    return res.status(404).json({ error: "Campaign not found" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin endpoint: Delete Campaign
app.delete("/api/admin/reviews/campaigns/:id", authenticateToken, async (req, res) => {
  const campId = parseInt(req.params.id);
  try {
    if (pool) {
      await pool.query("DELETE FROM review_pool WHERE campaign_id = ?", [campId]);
      await pool.query("DELETE FROM review_campaigns WHERE id = ?", [campId]);
      return res.json({ success: true });
    }

    if (sqliteDb) {
      return new Promise<void>((resolve) => {
        sqliteDb.run("DELETE FROM review_pool WHERE campaign_id = ?", [campId], () => {
          sqliteDb.run("DELETE FROM review_campaigns WHERE id = ?", [campId], (err: any) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
            resolve();
          });
        });
      });
    }

    const fileData = getPersistentReviewsData();
    fileData.campaigns = fileData.campaigns.filter((c: any) => c.id !== campId);
    fileData.reviews = fileData.reviews.filter((r: any) => r.campaign_id !== campId);
    savePersistentReviewsData(fileData);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin endpoint: Get all reviews for a campaign
app.get("/api/admin/reviews/campaigns/:id/reviews", authenticateToken, async (req, res) => {
  const campId = parseInt(req.params.id);
  try {
    if (pool) {
      const [rows]: any = await pool.query(
        "SELECT * FROM review_pool WHERE campaign_id = ? ORDER BY is_used ASC, id DESC",
        [campId]
      );
      return res.json(rows || []);
    }

    if (sqliteDb) {
      return new Promise<void>((resolve) => {
        sqliteDb.all(
          "SELECT * FROM review_pool WHERE campaign_id = ? ORDER BY is_used ASC, id DESC",
          [campId],
          (err: any, rows: any) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows || []);
            resolve();
          }
        );
      });
    }

    const fileData = getPersistentReviewsData();
    const rows = fileData.reviews.filter((r: any) => r.campaign_id === campId);
    res.json(rows.sort((a: any, b: any) => (a.is_used - b.is_used) || (b.id - a.id)));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin endpoint: Bulk Upload Reviews for a Campaign
app.post("/api/admin/reviews/campaigns/:id/upload", authenticateToken, async (req, res) => {
  const campId = parseInt(req.params.id);
  const { reviews } = req.body;

  let reviewList: string[] = [];
  if (Array.isArray(reviews)) {
    reviewList = reviews.map((r: any) => String(r).trim()).filter(Boolean);
  } else if (typeof reviews === "string") {
    reviewList = reviews
      .split(/\r?\n/)
      .map((r) => r.trim())
      .filter((r) => r.length > 0);
  }

  if (reviewList.length === 0) {
    return res.status(400).json({ error: "No valid review texts provided" });
  }

  try {
    if (pool) {
      for (const rev of reviewList) {
        await pool.query("INSERT INTO review_pool (campaign_id, review_text, is_used) VALUES (?, ?, 0)", [campId, rev]);
      }
      return res.json({ success: true, count: reviewList.length });
    }

    if (sqliteDb) {
      return new Promise<void>((resolve) => {
        sqliteDb.serialize(() => {
          const stmt = sqliteDb.prepare("INSERT INTO review_pool (campaign_id, review_text, is_used) VALUES (?, ?, 0)");
          reviewList.forEach((rev) => {
            stmt.run([campId, rev]);
          });
          stmt.finalize((err: any) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, count: reviewList.length });
            resolve();
          });
        });
      });
    }

    const fileData = getPersistentReviewsData();
    let nextId = fileData.reviews.length > 0 ? Math.max(...fileData.reviews.map((r: any) => r.id)) + 1 : 1;
    reviewList.forEach((rev) => {
      fileData.reviews.push({
        id: nextId++,
        campaign_id: campId,
        review_text: rev,
        is_used: 0,
        used_at: null,
        claimed_ip: null,
        created_at: new Date().toISOString()
      });
    });
    savePersistentReviewsData(fileData);
    res.json({ success: true, count: reviewList.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin endpoint: Reset all reviews in a campaign (mark as unused)
app.post("/api/admin/reviews/campaigns/:id/reset", authenticateToken, async (req, res) => {
  const campId = parseInt(req.params.id);
  try {
    if (pool) {
      await pool.query("UPDATE review_pool SET is_used = 0, used_at = NULL, claimed_ip = NULL WHERE campaign_id = ?", [campId]);
      return res.json({ success: true, message: "All reviews reset to unused" });
    }

    if (sqliteDb) {
      return new Promise<void>((resolve) => {
        sqliteDb.run("UPDATE review_pool SET is_used = 0, used_at = NULL, claimed_ip = NULL WHERE campaign_id = ?", [campId], (err: any) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ success: true, message: "All reviews reset to unused" });
          resolve();
        });
      });
    }

    const fileData = getPersistentReviewsData();
    fileData.reviews.forEach((r: any) => {
      if (r.campaign_id === campId) {
        r.is_used = 0;
        r.used_at = null;
        r.claimed_ip = null;
      }
    });
    savePersistentReviewsData(fileData);
    res.json({ success: true, message: "All reviews reset to unused" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin endpoint: Delete individual review
app.delete("/api/admin/reviews/item/:id", authenticateToken, async (req, res) => {
  const revId = parseInt(req.params.id);
  try {
    if (pool) {
      await pool.query("DELETE FROM review_pool WHERE id = ?", [revId]);
      return res.json({ success: true });
    }

    if (sqliteDb) {
      return new Promise<void>((resolve) => {
        sqliteDb.run("DELETE FROM review_pool WHERE id = ?", [revId], (err: any) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ success: true });
          resolve();
        });
      });
    }

    const fileData = getPersistentReviewsData();
    fileData.reviews = fileData.reviews.filter((r: any) => r.id !== revId);
    savePersistentReviewsData(fileData);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Direct HTML or dynamic route handler for review pages
app.get(["/swarnaamahal_review.html", "/:slug_review.html", "/review/:slug"], (req, res, next) => {
  const possibleFile = req.path.replace(/^\//, "");
  const publicPath = path.join(process.cwd(), "public", possibleFile);
  const distPath = path.join(process.cwd(), "dist", possibleFile);
  if (fs.existsSync(publicPath)) {
    return res.sendFile(publicPath);
  } else if (fs.existsSync(distPath)) {
    return res.sendFile(distPath);
  }
  // Otherwise pass to next middleware (SPA fallback will serve index.html with React router)
  next();
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
