// const crypto = require("crypto");
// const CryptoJS = require("crypto-js");
// require("dotenv").config();
// const algorithm = "aes-256-cbc"; // Although crypto-js doesn't use this directly
// const secretKey = CryptoJS.enc.Hex.parse(process.env.ENCRYPTION_KEY); // Convert hex key to WordArray
// const iv = CryptoJS.enc.Hex.parse(process.env.IV); // Convert hex IV to WordArray

// // Function to encrypt data
// function encrypt(text, secretKey) {
//   if (typeof text !== "string") {
//     throw new TypeError("The text to be encrypted must be a string");
//   }
//   const iv = crypto.randomBytes(16); // Initialization vector
//   const cipher = crypto.createCipheriv(
//     "aes-256-cbc",
//     Buffer.from(secretKey, "hex"),
//     iv
//   );
//   let encrypted = cipher.update(text, "utf8", "hex");
//   encrypted += cipher.final("hex");
//   return iv.toString("hex") + ":" + encrypted;
// }

// // Function to decrypt data
// function decrypt(text, secretKey) {
//   const textParts = text.split(":");
//   const iv = Buffer.from(textParts.shift(), "hex");
//   const encryptedText = Buffer.from(textParts.join(":"), "hex");
//   const decipher = crypto.createDecipheriv(
//     "aes-256-cbc",
//     Buffer.from(secretKey, "hex"),
//     iv
//   );
//   let decrypted = decipher.update(encryptedText, "hex", "utf8");
//   decrypted += decipher.final("utf8");
//   return decrypted;
// }

const crypto = require("crypto");
require("dotenv").config();

const algorithm = "aes-256-cbc";
const secretKey = process.env.ENCRYPTION_KEY; // Ensure this is a 64-character hexadecimal string
const iv = process.env.IV; // Ensure this is a 32-character hexadecimal string

if (!secretKey || secretKey.length !== 64) {
  throw new Error("Invalid ENCRYPTION_KEY. Must be a 64-character hexadecimal string.");
}

if (!iv || iv.length !== 32) {
  throw new Error("Invalid IV. Must be a 32-character hexadecimal string.");
}

// Function to encrypt data
function encrypt(text) {
  if (typeof text !== "string") {
    throw new TypeError("The text to be encrypted must be a string");
  }
  const ivBuffer = Buffer.from(iv, "hex"); // Use IV from environment variable
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, "hex"), ivBuffer);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const encryptedText = ivBuffer.toString("hex") + ":" + encrypted;
  console.log("Encrypted text:", encryptedText); 
  return encryptedText;
}

// Function to decrypt data
function decrypt(text) {
  // console.log("Decrypting text:", text); 
  const textParts = text.split(":");
  if (textParts.length !== 2) {
    // console.error("Invalid encrypted text format:", text); // Error log
    throw new Error("Invalid encrypted text format");
  }
  const ivBuffer = Buffer.from(textParts[0], "hex");
  const encryptedText = Buffer.from(textParts[1], "hex");
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, "hex"), ivBuffer);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}















// module.exports = { encrypt, decrypt };

// const crypto = require("crypto");

// require("dotenv").config();

// Function to encrypt data
// function encrypt(text, secretKey) {
//   if (typeof text !== "string") {
//     throw new TypeError("The text to be encrypted must be a string");
//   }
//   const iv = crypto.randomBytes(16); // Initialization vector
//   const cipher = crypto.createCipheriv(
//     "aes-256-cbc",
//     Buffer.from(secretKey, "hex"),
//     iv
//   );
//   let encrypted = cipher.update(text, "utf8", "hex");
//   encrypted += cipher.final("hex");
//   return iv.toString("hex") + ":" + encrypted;
// }

// // Function to decrypt data
// function decrypt(text, secretKey) {
//   const textParts = text.split(":");
//   const iv = Buffer.from(textParts.shift(), "hex");
//   const encryptedText = Buffer.from(textParts.join(":"), "hex");
//   const decipher = crypto.createDecipheriv(
//     "aes-256-cbc",
//     Buffer.from(secretKey, "hex"),
//     iv
//   );
//   let decrypted = decipher.update(encryptedText, "hex", "utf8");
//   decrypted += decipher.final("utf8");
//   return decrypted;
// }




// Function to encrypt data
// function encrypt(text, secretKey) {
//   if (typeof text !== "string") {
//     throw new TypeError("The text to be encrypted must be a string");
//   }
//   const iv = crypto.randomBytes(16); // Initialization vector
//   const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(secretKey, "hex"), iv);
//   let encrypted = cipher.update(text, "utf8", "hex");
//   encrypted += cipher.final("hex");
//   return iv.toString("hex") + ":" + encrypted;
// }





module.exports = { encrypt, decrypt };
