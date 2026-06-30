import fs from "fs";

const token = "Ae0iMNfpceG82FUg8nX4cLpS8YCCu7eSUe1Re53AoU1EIeeKCI0ItQTDhZVD2s65Jmy-CRYOvZCB8jY9B9gC-Q7QZ3gTvBmyrcuxPifmBPNsU8URAYd-ShafjlnYFRPezxSDJwlClxGVAM_Zi6ztCshNFQ";

console.log("Token length:", token.length);

try {
  const decoded = Buffer.from(token, "base64").toString("utf-8");
  console.log("Decoded utf-8 length:", decoded.length);
  console.log("Decoded string excerpt:", decoded.substring(0, 150));
  
  // Let's print hex bytes to see if it is binary or text
  const buffer = Buffer.from(token, "base64");
  console.log("First 20 bytes (hex):", buffer.subarray(0, 20).toString("hex"));
} catch (err: any) {
  console.error("Decode failed:", err.message);
}
