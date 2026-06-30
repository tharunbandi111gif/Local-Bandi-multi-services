import { GoogleAuth } from "google-auth-library";
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
    const projectId = firebaseConfig.projectId;
    const databaseId = firebaseConfig.firestoreDatabaseId;

    console.log("Getting auth token...");
    const auth = new GoogleAuth({
      scopes: "https://www.googleapis.com/auth/datastore",
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const token = tokenResponse.token;

    if (!token) {
      console.log("Failed to get token");
      return;
    }

    console.log("Token obtained successfully.");

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/audit_logs?pageSize=20`;
    console.log("Fetching REST URL:", url);

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Failed to fetch documents:", res.status, errText);
      return;
    }

    const data: any = await res.json();
    console.log("REST Data Documents Count:", data.documents?.length || 0);
    if (data.documents) {
      data.documents.forEach((doc: any, i: number) => {
        console.log(`\nDocument ${i + 1}:`, doc.name);
        console.log("Fields:", JSON.stringify(doc.fields, null, 2));
      });
    }

  } catch (err: any) {
    console.error("Error running REST test:", err);
  }
};

run();
