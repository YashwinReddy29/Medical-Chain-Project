import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import axios from "axios";
import MedChainABI from "./MedicalRecords.json";
import { encryptFile, decryptFile, downloadBlob } from "./crypto";
import "./App.css";
import Analytics from "./Analytics";
import Analytics from "./Analytics";

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

const RECORD_TYPES = [
  { value: "lab", label: "Lab Results", icon: "🧪" },
  { value: "imaging", label: "Imaging / X-Ray", icon: "🩻" },
  { value: "prescription", label: "Prescription", icon: "💊" },
  { value: "report", label: "Medical Report", icon: "📋" },
  { value: "vaccine", label: "Vaccination", icon: "💉" },
  { value: "other", label: "Other", icon: "📄" },
];

function getRecordTypeInfo(value) {
  return RECORD_TYPES.find((r) => r.value === value) || RECORD_TYPES[5];
}

function shortenAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatDate(timestamp) {
  if (!timestamp) return "—";
  return new Date(Number(timestamp) * 1000).toLocaleString();
}

function Toast({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => removeToast(t.id)}>
          <span className="toast-icon">{t.type === "success" ? "✓" : t.type === "error" ? "✕" : "…"}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [isHospital, setIsHospital] = useState(false);
  const [records, setRecords] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [activeTab, setActiveTab] = useState("records");
  const [loading, setLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPatient, setUploadPatient] = useState("");
  const [uploadType, setUploadType] = useState("lab");
  const [uploadDoctor, setUploadDoctor] = useState("");
  const [uploadProgress, setUploadProgress] = useState(null);
  const [doctorAddress, setDoctorAddress] = useState("");
  const [authorizedDoctors, setAuthorizedDoctors] = useState([]);
  const [hospitalAddr, setHospitalAddr] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [storedKeys, setStoredKeys] = useState({});

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  async function connectWallet() {
    if (!window.ethereum) return addToast("MetaMask not found!", "error");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      const c = new ethers.Contract(CONTRACT_ADDRESS, MedChainABI.abi, signer);
      setAccount(addr);
      setContract(c);
      const hosp = await c.hospitals(addr);
      setIsHospital(hosp);
      addToast(`Connected: ${shortenAddress(addr)}`, "success");
    } catch (err) {
      addToast("Failed to connect: " + err.message, "error");
    }
  }

  const loadRecords = useCallback(async () => {
    if (!contract || !account) return;
    try {
      const raw = await contract.getRecords(account);
      setRecords(raw.filter((r) => r.active));
    } catch (err) {
      addToast("Failed to load records", "error");
    }
  }, [contract, account, addToast]);

  const loadDoctors = useCallback(async () => {
    if (!contract || !account) return;
    try {
      const docs = await contract.getAuthorizedDoctors(account);
      setAuthorizedDoctors(docs);
    } catch (err) {}
  }, [contract, account]);

  useEffect(() => {
    if (contract && account) { loadRecords(); loadDoctors(); }
  }, [contract, account, loadRecords, loadDoctors]);

  async function registerHospital() {
    if (!contract) return addToast("Connect wallet first", "error");
    if (!hospitalAddr || !hospitalName) return addToast("Fill all fields", "error");
    setLoading(true);
    try {
      const tx = await contract.registerHospital(hospitalAddr, hospitalName);
      addToast("Transaction submitted, waiting for confirmation...", "info");
      await tx.wait();
      addToast(`Hospital "${hospitalName}" registered!`, "success");
      setHospitalAddr(""); setHospitalName("");
      // Re-check hospital status from blockchain
      const hosp = await contract.hospitals(account);
      setIsHospital(hosp);
      // Force reload records and doctors
      await loadRecords();
      await loadDoctors();
    } catch (err) { addToast("Failed: " + err.message, "error"); }
    setLoading(false);
  }

  async function handleUpload() {
    if (!contract || !isHospital) return addToast("Only hospitals can upload", "error");
    if (!uploadFile) return addToast("Select a file first", "error");
    if (!uploadPatient) return addToast("Enter patient address", "error");
    setLoading(true);
    setUploadProgress("🔐 Encrypting file...");
    try {
      const buffer = await uploadFile.arrayBuffer();
      const { encrypted, iv, keyBase64 } = await encryptFile(buffer);
      setUploadProgress("☁️ Uploading to IPFS...");
      const blob = new Blob([encrypted], { type: "application/octet-stream" });
      const form = new FormData();
      form.append("file", blob, uploadFile.name + ".enc");
      const { data } = await axios.post(`${BACKEND_URL}/upload`, form);
      const ipfsHash = data.hash;
      setStoredKeys((prev) => ({ ...prev, [ipfsHash]: { key: keyBase64, iv } }));
      setUploadProgress("⛓️ Writing to blockchain...");
      const accessList = [{ user: uploadDoctor || uploadPatient, encryptedKey: keyBase64 }];
      const tx = await contract.uploadRecord(uploadPatient, ipfsHash, uploadFile.name, iv, uploadType, accessList);
      await tx.wait();
      addToast("Record uploaded successfully!", "success");
      setUploadFile(null); setUploadPatient(""); setUploadDoctor(""); setUploadProgress(null);
      await loadRecords();
    } catch (err) { addToast("Upload failed: " + err.message, "error"); setUploadProgress(null); }
    setLoading(false);
  }

  async function handleDownload(record) {
    const ipfsHash = record.ipfsHash;
    const keyData = storedKeys[ipfsHash];
    if (!keyData) return addToast("No decryption key found (only available in the same session)", "error");
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/download/${ipfsHash}`, { responseType: "arraybuffer" });
      const decrypted = await decryptFile(response.data, keyData.key, keyData.iv);
      const blob = new Blob([decrypted]);
      downloadBlob(blob, record.fileName);
      addToast("File downloaded!", "success");
    } catch (err) { addToast("Download failed: " + err.message, "error"); }
    setLoading(false);
  }

  async function handleDelete(index) {
    if (!window.confirm("Delete this record?")) return;
    setLoading(true);
    try {
      const tx = await contract.deleteRecord(index);
      await tx.wait();
      addToast("Record deleted", "success");
      await loadRecords();
    } catch (err) { addToast("Delete failed: " + err.message, "error"); }
    setLoading(false);
  }

  async function grantDoctor() {
    if (!doctorAddress) return addToast("Enter doctor address", "error");
    setLoading(true);
    try {
      const tx = await contract.grantDoctorAccess(doctorAddress);
      await tx.wait();
      addToast("Doctor access granted!", "success");
      setDoctorAddress(""); await loadDoctors();
    } catch (err) { addToast("Failed: " + err.message, "error"); }
    setLoading(false);
  }

  async function revokeDoctor(addr) {
    setLoading(true);
    try {
      const tx = await contract.revokeDoctorAccess(addr);
      await tx.wait();
      addToast("Access revoked", "success");
      await loadDoctors();
    } catch (err) { addToast("Failed: " + err.message, "error"); }
    setLoading(false);
  }

  return (
    <div className="app">
      <Toast toasts={toasts} removeToast={removeToast} />
      <header className="header">
        <div className="header-left">
          <div className="logo"><span className="logo-cross">✚</span><span className="logo-text">MedChain</span></div>
          <span className="logo-sub">Decentralized Medical Records</span>
        </div>
        <div className="header-right">
          {account ? (
            <div className="wallet-info">
              {isHospital && <span className="badge badge-hospital">🏥 Hospital</span>}
              <span className="wallet-addr">{shortenAddress(account)}</span>
              <div className="wallet-dot" />
            </div>
          ) : (
            <button className="btn btn-connect" onClick={connectWallet}>Connect Wallet</button>
          )}
        </div>
      </header>

      {!account && (
        <section className="hero">
          <div className="hero-content">
            <h1 className="hero-title">Your Medical Records,<br /><span className="hero-accent">Secured on Chain</span></h1>
            <p className="hero-desc">AES-256 encrypted. IPFS distributed. Blockchain verified. Full control over who sees your health data.</p>
            <button className="btn btn-hero" onClick={connectWallet}>Connect MetaMask →</button>
            <div className="hero-features">
              <div className="hero-feature"><span>🔐</span> End-to-end encrypted</div>
              <div className="hero-feature"><span>⛓️</span> Immutable audit trail</div>
              <div className="hero-feature"><span>☁️</span> Decentralized storage</div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hex-grid">
              {["🧬","💊","🩺","🩻","🧪","💉"].map((icon, i) => (
                <div key={i} className={`hex hex-${i}`}>{icon}</div>
              ))}
            </div>
          </div>
        </section>
      )}

      {account && (
        <main className="dashboard">
          <nav className="tabs">
            {[
              { id: "records", label: "My Records", icon: "📋" },
              { id: "upload", label: "Upload", icon: "📤", hidden: !isHospital },
              { id: "access", label: "Access Control", icon: "🔑" },
              { id: "admin", label: "Admin", icon: "⚙️" },
              { id: "analytics", label: "Analytics", icon: "📊" },
              { id: "analytics", label: "Analytics", icon: "📊" },
            ].filter((t) => !t.hidden).map((tab) => (
              <button key={tab.id} className={`tab ${activeTab === tab.id ? "tab-active" : ""}`} onClick={() => setActiveTab(tab.id)}>
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </nav>

          {activeTab === "records" && (
            <div className="panel">
              <div className="panel-header">
                <h2>Medical Records</h2>
                <button className="btn btn-sm" onClick={loadRecords} disabled={loading}>↻ Refresh</button>
              </div>
              {records.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📂</div>
                  <p>No records found for your address.</p>
                  <p className="empty-sub">Records uploaded by hospitals will appear here.</p>
                </div>
              ) : (
                <div className="records-grid">
                  {records.map((record, i) => {
                    const typeInfo = getRecordTypeInfo(record.recordType);
                    return (
                      <div className="record-card" key={i}>
                        <div className="record-icon">{typeInfo.icon}</div>
                        <div className="record-body">
                          <div className="record-name">{record.fileName}</div>
                          <div className="record-type">{typeInfo.label}</div>
                          <div className="record-meta">
                            <span>🏥 {shortenAddress(record.hospital)}</span>
                            <span>🕐 {formatDate(record.timestamp)}</span>
                          </div>
                          <div className="record-hash">IPFS: {record.ipfsHash.slice(0, 20)}…</div>
                        </div>
                        <div className="record-actions">
                          <button className="btn btn-sm btn-download" onClick={() => handleDownload(record)} disabled={loading}>↓ Download</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(i)} disabled={loading}>🗑</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "upload" && isHospital && (
            <div className="panel">
              <div className="panel-header"><h2>Upload Medical Record</h2></div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Patient Wallet Address</label>
                  <input className="input" placeholder="0x..." value={uploadPatient} onChange={(e) => setUploadPatient(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Record Type</label>
                  <select className="input" value={uploadType} onChange={(e) => setUploadType(e.target.value)}>
                    {RECORD_TYPES.map((r) => <option key={r.value} value={r.value}>{r.icon} {r.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Doctor Wallet (optional)</label>
                  <input className="input" placeholder="0x..." value={uploadDoctor} onChange={(e) => setUploadDoctor(e.target.value)} />
                </div>
                <div className="form-group form-group-full">
                  <label>File</label>
                  <div className="dropzone" onClick={() => document.getElementById("fileInput").click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setUploadFile(f); }}>
                    {uploadFile ? (
                      <div className="dropzone-file">
                        <span>📄 {uploadFile.name}</span>
                        <span className="dropzone-size">{(uploadFile.size / 1024).toFixed(1)} KB</span>
                      </div>
                    ) : (
                      <><div className="dropzone-icon">☁️</div><p>Drag & drop or click to select</p><p className="dropzone-sub">PDF, images — up to 50MB</p></>
                    )}
                    <input id="fileInput" type="file" hidden onChange={(e) => setUploadFile(e.target.files[0])} />
                  </div>
                </div>
              </div>
              {uploadProgress && <div className="progress-bar"><span>{uploadProgress}</span></div>}
              <button className="btn btn-primary" onClick={handleUpload} disabled={loading || !uploadFile || !uploadPatient}>
                {loading ? "Processing…" : "🔐 Encrypt & Upload to Chain"}
              </button>
            </div>
          )}

          {activeTab === "access" && (
            <div className="panel">
              <div className="panel-header"><h2>Access Control</h2></div>
              <p className="panel-desc">Grant doctors or specialists access to view your medical records.</p>
              <div className="form-row">
                <input className="input" placeholder="Doctor's wallet address (0x...)" value={doctorAddress} onChange={(e) => setDoctorAddress(e.target.value)} />
                <button className="btn btn-primary" onClick={grantDoctor} disabled={loading}>Grant Access</button>
              </div>
              <div className="doctors-list">
                <h3>Authorized Doctors ({authorizedDoctors.length})</h3>
                {authorizedDoctors.length === 0 ? <p className="empty-sub">No doctors authorized yet.</p> : (
                  authorizedDoctors.map((doc, i) => (
                    <div className="doctor-row" key={i}>
                      <span className="doctor-icon">👨‍⚕️</span>
                      <span className="doctor-addr">{doc}</span>
                      <button className="btn btn-sm btn-danger" onClick={() => revokeDoctor(doc)} disabled={loading}>Revoke</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "admin" && (
            <div className="panel">
              <div className="panel-header"><h2>Hospital Registration</h2></div>
              <p className="panel-desc">Register a hospital address so it can upload records.</p>
              <div className="form-grid">
                <div className="form-group">
                  <label>Hospital Wallet Address</label>
                  <input className="input" placeholder="0x..." value={hospitalAddr} onChange={(e) => setHospitalAddr(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Hospital Name</label>
                  <input className="input" placeholder="General Hospital" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} />
                </div>
              </div>
              <button className="btn btn-primary" onClick={registerHospital} disabled={loading}>Register Hospital</button>
              <div className="info-box">
                <strong>Your status:</strong> {isHospital ? "✅ Registered hospital" : "⛔ Not a registered hospital"}
              </div>
            </div>
          )}
          {activeTab === "analytics" && (
            <div className="panel">
              <div className="panel-header"><h2>Analytics Dashboard</h2></div>
              <Analytics records={records} authorizedDoctors={authorizedDoctors} account={account} />
            </div>
          )}
          {activeTab === "analytics" && (
            <div className="panel">
              <div className="panel-header"><h2>📊 Analytics Dashboard</h2></div>
              <Analytics records={records} authorizedDoctors={authorizedDoctors} account={account} />
            </div>
          )}
        </main>
      )}

      <footer className="footer">
        <span>MedChain — Decentralized Medical Records</span>
        <span>Contract: {shortenAddress(CONTRACT_ADDRESS)}</span>
      </footer>
    </div>
  );
}
