import React, { useState, useEffect, useCallback } from "react";

export default function HospitalDashboard({ contract, account, records, addToast }) {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newHospAddr, setNewHospAddr] = useState("");
  const [newHospName, setNewHospName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadHospitals = useCallback(async () => {
    if (!contract) return;
    setLoading(true);
    try {
      // Get all HospitalRegistered events from block 0
      const filter = contract.filters.HospitalRegistered();
      const events = await contract.queryFilter(filter);

      const seen = new Set();
      const list = [];

      // Always check current account first
      if (account) {
        const isHosp = await contract.hospitals(account);
        if (isHosp) {
          const name = await contract.hospitalNames(account);
          seen.add(account.toLowerCase());
          const count = records.filter(r =>
            r.hospital?.toLowerCase() === account.toLowerCase()
          ).length;
          list.push({ address: account, name: name || "My Hospital", recordCount: count, isMe: true });
        }
      }

      // Then add from events
      for (const ev of events) {
        const addr = ev.args[0];
        const name = ev.args[1];
        if (!seen.has(addr.toLowerCase())) {
          seen.add(addr.toLowerCase());
          const count = records.filter(r =>
            r.hospital?.toLowerCase() === addr.toLowerCase()
          ).length;
          list.push({ address: addr, name, recordCount: count, isMe: addr.toLowerCase() === account?.toLowerCase() });
        }
      }

      setHospitals(list);
    } catch (err) {
      console.error(err);
      // Fallback — just check current account
      if (account) {
        try {
          const isHosp = await contract.hospitals(account);
          if (isHosp) {
            const name = await contract.hospitalNames(account);
            setHospitals([{ address: account, name: name || "My Hospital", recordCount: 0, isMe: true }]);
          }
        } catch(e) { console.error(e); }
      }
    }
    setLoading(false);
  }, [contract, account, records]);

  useEffect(() => { loadHospitals(); }, [loadHospitals]);

  async function registerHospital() {
    if (!contract) return addToast("Connect wallet first", "error");
    if (!newHospAddr || !newHospName) return addToast("Fill all fields", "error");
    setLoading(true);
    try {
      const tx = await contract.registerHospital(newHospAddr, newHospName);
      addToast("Waiting for confirmation...", "info");
      await tx.wait();
      addToast(`"${newHospName}" registered!`, "success");
      // Add immediately to UI
      const count = records.filter(r =>
        r.hospital?.toLowerCase() === newHospAddr.toLowerCase()
      ).length;
      setHospitals(prev => {
        const exists = prev.find(h => h.address.toLowerCase() === newHospAddr.toLowerCase());
        if (exists) return prev;
        return [...prev, {
          address: newHospAddr,
          name: newHospName,
          recordCount: count,
          isMe: newHospAddr.toLowerCase() === account?.toLowerCase()
        }];
      });
      setNewHospAddr("");
      setNewHospName("");
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
      {/* Stats */}
      <div className="hosp-stats-row">
        {[
          { icon:"🏥", value: hospitals.length, label:"Registered Hospitals" },
          { icon:"📋", value: totalRecords, label:"Total Records" },
          { icon:"🌐", value: "Sepolia", label:"Network", small: true },
          { icon:"🔐", value: "AES-256", label:"Encryption", small: true },
        ].map((s,i) => (
          <div key={i} className="hosp-stat-card">
            <div className="hosp-stat-icon">{s.icon}</div>
            <div className="hosp-stat-body">
              <div className="hosp-stat-value" style={s.small?{fontSize:"14px"}:{}}>{s.value}</div>
              <div className="hosp-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Register */}
      <div className="hosp-section">
        <h3 className="hosp-section-title">➕ Register New Hospital</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Hospital Wallet Address</label>
            <input
              id="hosp-addr"
              name="hosp-addr"
              className="input"
              placeholder="0x..."
              value={newHospAddr}
              onChange={e => setNewHospAddr(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Hospital Name</label>
            <input
              id="hosp-name"
              name="hosp-name"
              className="input"
              placeholder="e.g. City General Hospital"
              value={newHospName}
              onChange={e => setNewHospName(e.target.value)}
            />
          </div>
        </div>
        <div style={{display:"flex",gap:"12px",alignItems:"center"}}>
          <button
            className="btn btn-primary"
            onClick={registerHospital}
            disabled={loading || !newHospAddr || !newHospName}
          >
            {loading ? "Processing..." : "🏥 Register Hospital"}
          </button>
          <button className="btn btn-sm" onClick={() => setNewHospAddr(account || "")}>
            Use my address
          </button>
        </div>
      </div>

      {/* List */}
      <div className="hosp-section">
        <div className="hosp-section-header">
          <h3 className="hosp-section-title">🏥 Registered Hospitals ({hospitals.length})</h3>
          <div style={{display:"flex",gap:"8px"}}>
            <input
              id="hosp-search"
              name="hosp-search"
              className="input"
              style={{width:"200px",padding:"8px 12px"}}
              placeholder="🔍 Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button className="btn btn-sm" onClick={loadHospitals} disabled={loading}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><div className="empty-icon">⏳</div><p>Loading...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏥</div>
            <p>No hospitals found.</p>
            <p className="empty-sub">Register one above or click Refresh.</p>
          </div>
        ) : (
          <div className="hospital-grid">
            {filtered.map((h, i) => (
              <div key={i} className={`hospital-card ${h.isMe ? "hospital-card-active" : ""}`}>
                <div className="hospital-card-header">
                  <div className="hospital-avatar">🏥</div>
                  <div className="hospital-info">
                    <div className="hospital-name">{h.name}</div>
                    <div className="hospital-addr" title={h.address}>
                      {h.address.slice(0,10)}…{h.address.slice(-6)}
                    </div>
                  </div>
                  {h.isMe && <span className="badge badge-hospital">You</span>}
                </div>
                <div className="hospital-stats">
                  <div className="hospital-stat">
                    <span className="hospital-stat-value">{h.recordCount}</span>
                    <span className="hospital-stat-label">Records</span>
                  </div>
                  <div className="hospital-stat">
                    <span className="hospital-stat-value" style={{color:"var(--green)"}}>✓</span>
                    <span className="hospital-stat-label">Verified</span>
                  </div>
                  <div className="hospital-stat">
                    <span className="hospital-stat-value" style={{fontSize:"11px"}}>Active</span>
                    <span className="hospital-stat-label">Status</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Network Info */}
      <div className="hosp-section">
        <h3 className="hosp-section-title">⛓️ Network Info</h3>
        <div className="network-info-grid">
          {[
            { label:"Contract", value: contract?.target || "Not connected" },
            { label:"Your Address", value: account || "Not connected" },
            { label:"Your Role", value: hospitals.find(h=>h.isMe) ? "🏥 Hospital" : "👤 Patient" },
            { label:"Storage", value: "☁️ IPFS via Pinata" },
          ].map((item,i) => (
            <div key={i} className="network-info-item">
              <span className="network-info-label">{item.label}</span>
              <span className="network-info-value" style={{fontFamily:"monospace",fontSize:"12px"}}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
