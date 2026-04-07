// RSA-OAEP encryption using Web Crypto API

/**
 * Generate an RSA-OAEP keypair for a doctor
 */
export async function generateRSAKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
  return keyPair;
}

/**
 * Export public key to base64 string (share with hospital)
 */
export async function exportPublicKey(publicKey) {
  const exported = await window.crypto.subtle.exportKey("spki", publicKey);
  return arrayBufferToBase64(exported);
}

/**
 * Export private key to base64 string (store securely — never share)
 */
export async function exportPrivateKey(privateKey) {
  const exported = await window.crypto.subtle.exportKey("pkcs8", privateKey);
  return arrayBufferToBase64(exported);
}

/**
 * Import public key from base64 string
 */
export async function importPublicKey(base64Key) {
  const raw = base64ToArrayBuffer(base64Key);
  return await window.crypto.subtle.importKey(
    "spki",
    raw,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}

/**
 * Import private key from base64 string
 */
export async function importPrivateKey(base64Key) {
  const raw = base64ToArrayBuffer(base64Key);
  return await window.crypto.subtle.importKey(
    "pkcs8",
    raw,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
}

/**
 * Encrypt an AES key with a doctor's RSA public key
 * Hospital uses this before uploading a record
 */
export async function encryptAESKeyWithRSA(aesKeyBase64, doctorPublicKeyBase64) {
  const publicKey = await importPublicKey(doctorPublicKeyBase64);
  const aesKeyBytes = base64ToArrayBuffer(aesKeyBase64);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    aesKeyBytes
  );
  return arrayBufferToBase64(encrypted);
}

/**
 * Decrypt an AES key with the doctor's RSA private key
 * Doctor uses this to decrypt a record
 */
export async function decryptAESKeyWithRSA(encryptedKeyBase64, privateKeyBase64) {
  const privateKey = await importPrivateKey(privateKeyBase64);
  const encryptedBytes = base64ToArrayBuffer(encryptedKeyBase64);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedBytes
  );
  return arrayBufferToBase64(decrypted);
}

// ─── Storage helpers (localStorage) ──────────────────────────────────────────

const PRIVATE_KEY_STORAGE = "medchain_rsa_private_key";
const PUBLIC_KEY_STORAGE = "medchain_rsa_public_key";

export function saveKeysToStorage(privateKeyBase64, publicKeyBase64) {
  localStorage.setItem(PRIVATE_KEY_STORAGE, privateKeyBase64);
  localStorage.setItem(PUBLIC_KEY_STORAGE, publicKeyBase64);
}

export function loadKeysFromStorage() {
  return {
    privateKey: localStorage.getItem(PRIVATE_KEY_STORAGE),
    publicKey: localStorage.getItem(PUBLIC_KEY_STORAGE),
  };
}

export function clearKeysFromStorage() {
  localStorage.removeItem(PRIVATE_KEY_STORAGE);
  localStorage.removeItem(PUBLIC_KEY_STORAGE);
}

export function hasStoredKeys() {
  return !!localStorage.getItem(PRIVATE_KEY_STORAGE);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach(b => binary += String.fromCharCode(b));
  return window.btoa(binary);
}

export function base64ToArrayBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
