export async function encryptFile(fileBuffer) {
  const key = await window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, fileBuffer);
  const raw = await window.crypto.subtle.exportKey("raw", key);
  return { encrypted, iv: arrayBufferToBase64(iv), keyBase64: arrayBufferToBase64(raw) };
}

export async function decryptFile(encryptedBuffer, keyBase64, ivBase64) {
  const raw = base64ToArrayBuffer(keyBase64);
  const key = await window.crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, true, ["decrypt"]);
  const iv = base64ToArrayBuffer(ivBase64);
  return await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encryptedBuffer);
}

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

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}
