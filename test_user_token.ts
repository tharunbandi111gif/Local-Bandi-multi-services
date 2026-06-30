import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { getFirestore, collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import fs from "fs";
import path from "path";

const run = async () => {
  const userToken = "Ae0iMNfpceG82FUg8nX4cLpS8YCCu7eSUe1Re53AoU1EIeeKCI0ItQTDhZVD2s65Jmy-CRYOvZCB8jY9B9gC-Q7QZ3gTvBmyrcuxPifmBPNsU8URAYd-ShafjlnYFRPezxSDJwlClxGVAM_Zi6ztCshNFQ";

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
    console.log("Signing in with user custom token...");
    const userCredential = await signInWithCustomToken(auth, userToken);
    console.log("Signed in successfully, uid:", userCredential.user.uid);

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
    console.error("Error during custom token flow:", err);
  }
};

run();
