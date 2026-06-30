import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
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

    // Initialize Client SDK
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
    console.log("Signing in anonymously...");
    const userCredential = await signInAnonymously(auth);
    console.log("Signed in successfully anonymously, uid:", userCredential.user.uid);

    // Query Firestore via Client SDK
    console.log("Querying Firestore audit_logs...");
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
    console.error("Error during anonymous auth flow:", err);
  }
};

run();
