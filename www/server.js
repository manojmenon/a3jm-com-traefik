const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://a3jm:a3jm_secret@www-db:5432/a3jm",
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new pgSession({ pool, tableName: "session" }),
    secret: process.env.SESSION_SECRET || "a3jm-session-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 60 * 60 * 1000, // 1 hour, then re-login required
    },
  })
);

function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    if (req.xhr || req.headers.accept?.includes("application/json")) {
      return res.status(401).json({ success: false, message: "Please log in." });
    }
    return res.redirect("/login?next=" + encodeURIComponent(req.originalUrl));
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session?.userId || req.session.role !== "admin") {
    if (req.xhr || req.headers.accept?.includes("application/json")) {
      return res.status(403).json({ success: false, message: "Admin only." });
    }
    return res.redirect("/login");
  }
  next();
}

app.use(express.static(path.join(__dirname, "public")));

// —— Auth API ——
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password required." });
  }
  try {
    const r = await pool.query(
      "SELECT id, email, password_hash, role, full_name FROM users WHERE email = $1",
      [email.trim().toLowerCase()]
    );
    if (r.rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }
    const user = r.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }
    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.email = user.email;
    req.session.fullName = user.full_name || user.email;
    return res.json({
      success: true,
      role: user.role,
      redirect: user.role === "admin" ? "/admin/dashboard" : "/student",
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Login failed." });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (req.xhr || req.headers.accept?.includes("application/json")) {
      return res.json({ success: true });
    }
    res.redirect("/");
  });
});

app.post("/api/register-account", async (req, res) => {
  const { email, password, fullName } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password required." });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
  }
  const hash = await bcrypt.hash(password, 10);
  try {
    await pool.query(
      "INSERT INTO users (email, password_hash, role, full_name) VALUES ($1, $2, 'student', $3)",
      [email.trim().toLowerCase(), hash, (fullName || "").trim() || null]
    );
    return res.json({ success: true, message: "Account created. You can log in now." });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ success: false, message: "This email is already registered." });
    }
    console.error("Register error:", err);
    return res.status(500).json({ success: false, message: "Registration failed." });
  }
});

app.get("/api/me", (req, res) => {
  if (!req.session?.userId) {
    return res.json({ user: null });
  }
  res.json({
    user: {
      id: req.session.userId,
      email: req.session.email,
      role: req.session.role,
      fullName: req.session.fullName,
    },
  });
});

// —— Public API ——
app.get("/api/health", (req, res) => {
  pool.query("SELECT 1")
    .then(() => res.json({ ok: true, db: "connected" }))
    .catch((err) => res.status(500).json({ ok: false, db: "error", error: err.message }));
});

app.post("/api/register", async (req, res) => {
  const { studentName, guardianName, email, phone, grade, subject, slot } = req.body;
  if (!studentName || !guardianName || !email || !phone || !grade || !subject || !slot) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }
  const userId = req.session?.userId || null;
  try {
    await pool.query(
      `INSERT INTO registrations (user_id, student_name, guardian_name, email, phone, grade, subject, slot, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        userId,
        studentName.trim(),
        guardianName.trim(),
        email.trim(),
        phone.trim(),
        grade.trim(),
        subject.trim(),
        slot.trim(),
      ]
    );
    res.status(201).json({ success: true, message: "Registration submitted successfully. We will contact you shortly." });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ success: false, message: "Unable to save registration. Please try again." });
  }
});

// —— Protected pages (serve HTML) ——
app.get("/login", (req, res) => {
  if (req.session?.userId) {
    return res.redirect(req.session.role === "admin" ? "/admin/dashboard" : "/student");
  }
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/register", (req, res) => {
  if (req.session?.userId) {
    return res.redirect("/student");
  }
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/student", requireAuth, (req, res) => {
  if (req.session.role === "admin") return res.redirect("/admin/dashboard");
  res.sendFile(path.join(__dirname, "public", "student.html"));
});

app.get("/admin/dashboard", requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Redirect /admin to /admin/dashboard for our app (but Pi-hole will catch /admin first via Traefik)
app.get("/admin", requireAdmin, (req, res) => {
  res.redirect("/admin/dashboard");
});

// —— Admin: list registrations (optional) ——
app.get("/api/admin/registrations", requireAdmin, async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT id, student_name, guardian_name, email, phone, grade, subject, slot, created_at FROM registrations ORDER BY created_at DESC LIMIT 500"
    );
    res.json({ registrations: r.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load registrations." });
  }
});

// —— SPA fallback: serve index for root and other non-file routes ——
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/about", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/schedule", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Zeal www listening on port ${PORT}`);
});
