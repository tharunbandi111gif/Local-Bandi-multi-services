import fs from "fs";

console.log("Process ENV:");
const cleanEnv: Record<string, string> = {};
for (const key in process.env) {
  if (key.includes("KEY") || key.includes("SECRET") || key.includes("TOKEN") || key.includes("AUTH") || key.includes("PASSWORD")) {
    cleanEnv[key] = "REDACTED";
  } else {
    cleanEnv[key] = process.env[key] || "";
  }
}
console.log(JSON.stringify(cleanEnv, null, 2));
