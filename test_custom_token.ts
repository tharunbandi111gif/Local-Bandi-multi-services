import * as admin from "firebase-admin";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { getFirestore, collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import fs from "fs";
import path from "path";

const run = async () => {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (!fs.existsSync(configPath)) {
      console.log("No firebase-applet-config.json found");
      return;
    }
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    
    // 1. Initialize Admin SDK to generate a custom token
    console.log("Initializing Admin SDK...");
    const fAdmin = (admin as any).default || admin;
    if (!fAdmin.apps.length) {
      fAdmin.initializeApp({
        projectId: firebaseConfig.projectId,
      });
    }

    console.log("Creating custom token...");
    // Let's use the user's actual email or a random UID
    const customToken = await fAdmin.auth().createCustomToken("test-admin-uid", {
      email: "tharunbandi111@gmail.com",
      email_verified: true,
    });
    console.log("Custom Token generated successfully!");

    // 2. Initialize Client SDK
    console.log("Initializing Client SDK...");
    const app = initializeApp({
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId,
    });

    const auth = getAuth(app);
    console.log("Signing in with custom token...");
    const userCredential = await signInWithCustomToken(auth, customToken);
    console.log("Signed in successfully as user:", userCredential.user.uid);

    // 3. Query Firestore via Client SDK (which is authenticated now!)
    console.log("Querying Firestore audit_logs via Client SDK...");
    const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    
    const q = query(
      collection(db, "audit_logs"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const snap = await getDocs(q);
    console.log(`Found ${snap.size} documents in audit_logs:`);
    snap.forEach((doc) => {
      console.log("DOC ID:", doc.id);
      console.log("DATA:", JSON.stringify(doc.data(), null, 2));
    });

  } catch (err: any) {
    console.error("Error during custom token or query flow:", err);
  }
};

run();
