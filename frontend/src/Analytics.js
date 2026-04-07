import { useState } from "react";
import { ethers } from "ethers";

export default function Analytics({ contract }) {
  const [stats, setStats] = useState({
    uploads: 0,
    hospitals: 0
  });

  async function load() {
    try {
      const uploadEvents = await contract.queryFilter("RecordUploaded");
      const hospitalEvents = await contract.queryFilter("HospitalRegistered");

      setStats({
        uploads: uploadEvents.length,
        hospitals: hospitalEvents.length
      });
    } catch (err) {
      console.error("Analytics error:", err);
    }
  }

  return (
    <div style={{
      marginTop: 30,
      padding: 20,
      background: "#fff",
      borderRadius: 10,
      border: "1px solid #ddd"
    }}>
      <h2>📊 Analytics Dashboard</h2>

      <button onClick={load}>Load Stats</button>

      <div style={{ marginTop: 10 }}>
        <p>📁 Total Records: {stats.uploads}</p>
        <p>🏥 Hospitals Registered: {stats.hospitals}</p>
      </div>
    </div>
  );
}
