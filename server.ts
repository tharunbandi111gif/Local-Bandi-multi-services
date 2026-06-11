import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import twilio from "twilio";
import * as admin from "firebase-admin";
import fs from "fs";

let dbAdmin: admin.firestore.Firestore | null = null;

const getDbAdmin = () => {
  if (!dbAdmin) {
    try {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      if (fs.existsSync(configPath)) {
        const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
        if (!admin.apps.length) {
          admin.initializeApp({
            projectId: firebaseConfig.projectId,
          });
        }
        dbAdmin = admin.firestore(firebaseConfig.firestoreDatabaseId);
      }
    } catch (error) {
      console.error("Failed to initialize Firebase Admin:", error);
    }
  }
  return dbAdmin;
};

// Initialize Twilio lazily
let twilioClient: twilio.Twilio | null = null;

const getTwilio = () => {
  if (!twilioClient && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // SMS Service (Deactivated for now)
  app.post("/api/send-sms", async (req, res) => {
    return res.json({ success: true, message: "SMS Service is currently deactivated.", dummy: true });
  });

  app.post("/api/verify-otp", async (req, res) => {
    return res.json({ success: true, type: 'success', message: "OTP Verification is currently bypassed." });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    // URL rewrite middleware so Vite loads the correct html entries
    app.use((req, res, next) => {
      const url = req.url.split('?')[0];
      if (url === '/partner' || url === '/partner/') {
        req.url = '/partner.html';
      } else if (url === '/rider' || url === '/rider/') {
        req.url = '/partner.html';
      } else if (url === '/admin' || url === '/admin/') {
        req.url = '/admin.html';
      }
      next();
    });

    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Serve separate apps on matching routes
    app.get('/partner*', (req, res) => {
      res.sendFile(path.join(distPath, 'partner.html'));
    });
    app.get('/rider*', (req, res) => {
      res.redirect('/partner');
    });
    app.get('/admin*', (req, res) => {
      res.sendFile(path.join(distPath, 'admin.html'));
    });
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
