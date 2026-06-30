import fs from "fs";
import path from "path";

const run = async () => {
  try {
    const tmpDir = "/tmp";
    if (fs.existsSync(tmpDir)) {
      const files = fs.readdirSync(tmpDir);
      console.log("Files in /tmp:", files);
    }
  } catch (err) {
    console.error("Error reading /tmp:", err);
  }
};

run();
