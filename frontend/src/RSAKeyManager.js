import React, { useState, useEffect } from "react";
import {
  generateRSAKeyPair,
  exportPublicKey,
  exportPrivateKey,
  saveKeysToStorage,
  loadKeysFromStorage,
  clearKeysFromStorage,
  hasStoredKeys,
  encryptAESKeyWithRSA,
  decryptAESKeyWithRSA,
} from "./rsa";

export default function RSAKeyManager({ addToast }) {
  const [hasKeys, setHasKeys] = useState(false);
  const [publicKey, setPublicKey] = useState("");
  const [generating, setGenerating] = useState(false);
  const [showPrivate, setShowPrivate] = useState(false);
  const [privateKeyDisplay, setPrivateKeyDisplay] = useState("");
  const [testPublicKey, setTestPublicKey] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [testEncrypted, setTestEncrypted] = useState("");
  const [testDecrypted, setTestDecrypted] = useState("");

  useEffect(() => {
    const stored = hasStoredKeys();
    setHasKeys(stored);
    if (stored) {
      const { publicKey: pk } = loadKeysFromStorage();
      setPublicKey(pk || "");
    }
  }, []);

  async function generateKeys() {
    setGenerating(true);
    try {
      const keyPair = await generateRSAKeyPair();
      const pubKey = await exportPublicKey(keyPair.publicKey);
      const privKey = await exportPrivateKey(keyPair.privateKey);
      saveKeysToStorage(privKey, pubKey);
      setPublicKey(pubKey);
      setHasKeys(true);
      addToast("RSA keypair generated and saved!", "success");
    } catch (err) {
      addToast("Failed to generate keys: " + err.message, "error");
    }
    setGenerating(false);
  }

  function showPrivateKey() {
    const { privateKey } = loadKeysFromStorage();
    setPrivateKeyDisplay(privateKey || "");
    setShowPrivate(true);
  }

  function clearKeys() {
    if (!window.confirm("Delete your RSA keys? You won't be able to decrypt records encrypted for you!")) return;
    clearKeysFromStorage();
    setHasKeys(false);
    setPublicKey("");
    setPrivateKeyDisplay("");
    setShowPrivate(false);
    addToast("Keys deleted", "success");
  }

  function copyPublicKey() {
    navigator.clipboard.writeText(publicKey);
    addToast("Public key copied!", "success");
  }

  async function testEncrypt() {
    if (!testPublicKey || !testMessage) return addToast("Fill in public key and message", "error");
    try {
      const encrypted = await encryptAESKeyWithRSA(
        window.btoa(testMessage),
        testPublicKey
      );
      setTestEncrypted(encrypted);
      addToast("Encrypted successfully!", "success");
    } catch (err) {
      addToast("Encryption failed: " + err.message, "error");
    }
  }

  async function testDecrypt() {
    if (!testEncrypted) return addToast("Nothing to decrypt", "error");
    try {
      const { privateKey } = loadKeysFromStorage();
      if (!privateKey) return addToast("No private key found", "error");
      const decrypted = await decryptAESKeyWithRSA(testEncrypted, privateKey);
      setTestDecrypted(window.atob(decrypted));
      addToast("Decrypted successfully!", "success");
    } catch (err) {
      addToast("Decryption failed: " + err.message, "error");
    }
  }

  return (
    <div className="rsa-manager">
      {/* Status Banner */}
      <div className={`rsa-status ${hasKeys ? "rsa-status-ok" : "rsa-status-warn"}`}>
        <span className="rsa-status-icon">{hasKeys ? "🔐" : "⚠️"}</span>
        <div className="rsa-status-body">
          <div className="rsa-status-title">
            {hasKeys ? "RSA Keypair Active" : "No RSA Keys Found"}
          </div>
          <div className="rsa-status-sub">
            {hasKeys
              ? "Your private key is stored locally. Share your public key with hospitals to receive encrypted records."
              : "Generate your RSA keypair to enable per-doctor encryption."}
          </div>
        </div>
      </div>

      {/* Generate / Actions */}
      <div className="hosp-section">
        <h3 className="hosp-section-title">🔑 Your RSA Keypair</h3>
        {!hasKeys ? (
          <div>
            <p className="panel-desc">
              Generate a 2048-bit RSA-OAEP keypair. Your private key stays in your browser.
              Share your public key with hospitals so they can encrypt records specifically for you.
            </p>
            <button className="btn btn-primary" onClick={generateKeys} disabled={generating}>
              {generating ? "Generating..." : "⚡ Generate RSA Keypair"}
            </button>
          </div>
        ) : (
          <div style={{display:"flex",flex-direction:"column",gap:"16px"}}>
            <div className="form-group">
              <label>Your Public Key (share this with hospitals)</label>
              <div className="key-display">
                <code className="key-code">{publicKey.slice(0, 80)}...</code>
                <button className="btn btn-sm btn-download" onClick={copyPublicKey}>
                  📋 Copy
                </button>
              </div>
            </div>
            <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
              <button className="btn btn-sm" onClick={() => { generateKeys(); }}>
                🔄 Regenerate Keys
              </button>
              <button className="btn btn-sm" onClick={showPrivateKey}>
                👁 Show Private Key
              </button>
              <button className="btn btn-sm btn-danger" onClick={clearKeys}>
                🗑 Delete Keys
              </button>
            </div>
            {showPrivate && (
              <div className="key-warning">
                <div className="key-warning-title">⚠️ Private Key — Never share this!</div>
                <code className="key-code" style={{fontSize:"10px",wordBreak:"break-all"}}>
                  {privateKeyDisplay}
                </code>
                <button className="btn btn-sm" onClick={() => setShowPrivate(false)} style={{marginTop:"8px"}}>
                  Hide
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="hosp-section">
        <h3 className="hosp-section-title">❓ How RSA Encryption Works</h3>
        <div className="rsa-flow">
          {[
            { step:"1", icon:"🔑", title:"Doctor generates keypair", desc:"RSA-2048 public + private key generated in browser" },
            { step:"2", icon:"📤", title:"Doctor shares public key", desc:"Public key given to hospital (safe to share)" },
            { step:"3", icon:"🏥", title:"Hospital uploads record", desc:"Hospital encrypts AES key with doctor's RSA public key" },
            { step:"4", icon:"🔐", title:"Doctor decrypts", desc:"Only the doctor's private key can decrypt the AES key and read the file" },
          ].map((s,i) => (
            <div key={i} className="rsa-step">
              <div className="rsa-step-num">{s.step}</div>
              <div className="rsa-step-icon">{s.icon}</div>
              <div className="rsa-step-body">
                <div className="rsa-step-title">{s.title}</div>
                <div className="rsa-step-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Test Encryption */}
      {hasKeys && (
        <div className="hosp-section">
          <h3 className="hosp-section-title">🧪 Test RSA Encryption</h3>
          <p className="panel-desc">Test encrypting and decrypting a message with your keys.</p>
          <div className="form-group" style={{marginBottom:"12px"}}>
            <label>Recipient Public Key (paste any public key)</label>
            <textarea
              className="input"
              rows="3"
              style={{fontFamily:"monospace",fontSize:"11px",resize:"vertical"}}
              placeholder="Paste a public key here..."
              value={testPublicKey}
              onChange={e => setTestPublicKey(e.target.value)}
            />
            <button className="btn btn-sm" style={{marginTop:"6px"}} onClick={() => setTestPublicKey(publicKey)}>
              Use my public key
            </button>
          </div>
          <div className="form-group" style={{marginBottom:"12px"}}>
            <label>Message to encrypt</label>
            <input
              className="input"
              placeholder="e.g. Hello Doctor"
              value={testMessage}
              onChange={e => setTestMessage(e.target.value)}
            />
          </div>
          <div style={{display:"flex",gap:"10px",marginBottom:"16px"}}>
            <button className="btn btn-primary" onClick={testEncrypt} style={{padding:"10px 20px"}}>
              🔒 Encrypt
            </button>
            <button className="btn btn-sm btn-download" onClick={testDecrypt} disabled={!testEncrypted}>
              🔓 Decrypt with my private key
            </button>
          </div>
          {testEncrypted && (
            <div className="form-group" style={{marginBottom:"12px"}}>
              <label>Encrypted Output</label>
              <code className="key-code" style={{fontSize:"10px",wordBreak:"break-all",display:"block",padding:"12px",background:"var(--bg-2)",borderRadius:"8px",border:"1px solid var(--border)"}}>
                {testEncrypted.slice(0,120)}...
              </code>
            </div>
          )}
          {testDecrypted && (
            <div className="info-box" style={{borderColor:"var(--green)"}}>
              ✅ Decrypted: <strong>{testDecrypted}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
