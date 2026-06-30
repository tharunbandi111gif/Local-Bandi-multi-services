import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
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
    const fAdmin = (admin as any).default || admin;
    fAdmin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
    const db = getFirestore(firebaseConfig.firestoreDatabaseId);

    console.log("Querying audit_logs...");
    const snap = await db.collection("audit_logs")
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    console.log(`Found ${snap.size} documents in audit_logs:`);
    snap.forEach((doc: any) => {
      console.log("DOC ID:", doc.id);
      console.log("DATA:", JSON.stringify(doc.data(), null, 2));
    });

  } catch (err: any) {
    console.error("Error running query:", err);
  }
};

run();
