import React, { useState, useEffect, useCallback } from "react";

function HospitalCard({ address, name, recordCount, isCurrentUser }) {
  return (
    <div className={`hospital-card ${isCurrentUser ? "hospital-card-active" : ""}`}>
      <div className="hospital-card-header">
        <div className="hospital-avatar">🏥</div>
        <div className="hospital-info">
          <div className="hospital-name">{name || "Unnamed Hospital"}</div>
          <div className="hospital-addr">{address}</div>
        </div>
        {isCurrentUser && <span className="badge badge-hospital">You</span>}
      </div>
      <div className="hospital-stats">
        <div className="hospital-stat">
          <span className="hospital-stat-value">{recordCount}</span>
          <span className="hospital-stat-label">Records Uploaded</span>
        </div>
        <div className="hospital-stat">
          <span className="hospital-stat-value" style={{color:"var(--green)"}}>✓</span>
          <span className="hospital-stat-label">Verified</span>
        </div>
        <div className="hospital-stat">
          <span className="hospital-stat-value">Sepolia</span>
          <span className="hospital-stat-label">Network</span>
        </div>
      </div>
    </div>
  );
}

export default function HospitalDashboard({ contract, account, records, addToast }) {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newHospAddr, setNewHospAddr] = useState("");
  const [newHospName, setNewHospName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [registeredAddresses, setRegisteredAddresses] = useState([]);

  // Track registered hospitals from events
  const loadHospitals = useCallback(async () => {
    if (!contract) return;
    setLoading(true);
    try {
      // Get HospitalRegistered events
      const filter = contract.filters.HospitalRegistered();
      const events = await contract.queryFilter(filter, 0, "latest");

      const seen = new Set();
      const hospList = [];

      for (const event of events) {
        const addr = event.args[0];
        const name = event.args[1];
        if (!seen.has(addr)) {
          seen.add(addr);
          // Count records uploaded by this hospital
          const count = records.filter(
            r => r.hospital?.toLowerCase() === addr.toLowerCase()
          ).length;
          hospList.push({ address: addr, name, recordCount: count });
        }
      }

      setHospitals(hospList);
      setRegisteredAddresses(hospList.map(h => h.address.toLowerCase()));
    } catch (err) {
      console.error("Failed to load hospitals:", err);
      addToast("Failed to load hospitals", "error");
    }
    setLoading(false);
  }, [contract, records, addToast]);

  useEffect(() => { loadHospitals(); }, [loadHospitals]);

  async function registerHospital() {
    if (!contract) return addToast("Connect wallet first", "error");
    if (!newHospAddr || !newHospName) return addToast("Fill all fields", "error");
    setLoading(true);
    try {
      const tx = await contract.registerHospital(newHospAddr, newHospName);
      addToast("Waiting for confirmation...", "info");
      await tx.wait();
      addToast(`Hospital "${newHospName}" registered!`, "success");
      setNewHospAddr("");
      setNewHospName("");
      await loadHospitals();
    } catch (err) {
      addToast("Failed: " + err.message, "error");
    }
    setLoading(false);
  }

  const filtered = hospitals.filter(h =>
    h.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRecords = hospitals.reduce((s, h) => s + h.recordCount, 0);

  return (
    <div className="hospital-dashboard">
      {/* Summary Stats */}
      <div className="hosp-stats-row">
        <div className="hosp-stat-card">
          <div className="hosp-stat-icon">🏥</div>
          <div className="hosp-stat-body">
            <div className="hosp-stat-value">{hospitals.length}</div>
            <div className="hosp-stat-label">Registered Hospitals</div>
          </div>
        </div>
        <div className="hosp-stat-card">
          <div className="hosp-stat-icon">📋</div>
          <div className="hosp-stat-body">
            <div className="hosp-stat-value">{totalRecords}</div>
            <div className="hosp-stat-label">Total Records</div>
          </div>
        </div>
        <div className="hosp-stat-card">
          <div className="hosp-stat-icon">🌐</div>
          <div className="hosp-stat-body">
            <div className="hosp-stat-value">Sepolia</div>
            <div className="hosp-stat-label">Network</div>
          </div>
        </div>
        <div className="hosp-stat-card">
          <div className="hosp-stat-icon">🔐</div>
          <div className="hosp-stat-body">
            <div className="hosp-stat-value">AES-256</div>
            <div className="hosp-stat-label">Encryption</div>
          </div>
        </div>
      </div>

      {/* Register New Hospital */}
      <div className="hosp-section">
        <h3 className="hosp-section-title">➕ Register New Hospital</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Hospital Wallet Address</label>
            <input
              className="input"
              placeholder="0x..."
              value={newHospAddr}
              onChange={e => setNewHospAddr(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Hospital Name</label>
            <input
              className="input"
              placeholder="e.g. City General Hospital"
              value={newHospName}
              onChange={e => setNewHospName(e.target.value)}
            />
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={registerHospital}
          disabled={loading || !newHospAddr || !newHospName}
        >
          {loading ? "Processing..." : "🏥 Register Hospital"}
        </button>
      </div>

      {/* Hospital List */}
      <div className="hosp-section">
        <div className="hosp-section-header">
          <h3 className="hosp-section-title">🏥 Registered Hospitals ({hospitals.length})</h3>
          <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
            <input
              className="input"
              style={{width:"220px",padding:"8px 12px"}}
              placeholder="🔍 Search hospitals..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button className="btn btn-sm" onClick={loadHospitals} disabled={loading}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <p>Loading hospitals from blockchain...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏥</div>
            <p>No hospitals registered yet.</p>
            <p className="empty-sub">Register the first hospital above.</p>
          </div>
        ) : (
          <div className="hospital-grid">
            {filtered.map((h, i) => (
              <HospitalCard
                key={i}
                address={h.address}
                name={h.name}
                recordCount={h.recordCount}
                isCurrentUser={h.address.toLowerCase() === account?.toLowerCase()}
              />
            ))}
          </div>
        )}
      </div>

      {/* Network Info */}
      <div className="hosp-section">
        <h3 className="hosp-section-title">⛓️ Network Information</h3>
        <div className="network-info-grid">
          <div className="network-info-item">
            <span className="network-info-label">Contract Address</span>
            <span className="network-info-value" style={{fontFamily:"monospace",fontSize:"12px"}}>
              {contract?.target || "Not connected"}
            </span>
          </div>
          <div className="network-info-item">
            <span className="network-info-label">Your Address</span>
            <span className="network-info-value" style={{fontFamily:"monospace",fontSize:"12px"}}>
              {account || "Not connected"}
            </span>
          </div>
          <div className="network-info-item">
            <span className="network-info-label">Your Role</span>
            <span className="network-info-value">
              {registeredAddresses.includes(account?.toLowerCase()) ? "🏥 Hospital" : "👤 Patient"}
            </span>
          </div>
          <div className="network-info-item">
            <span className="network-info-label">Storage</span>
            <span className="network-info-value">☁️ IPFS via Pinata</span>
          </div>
        </div>
      </div>
    </div>
  );
}
