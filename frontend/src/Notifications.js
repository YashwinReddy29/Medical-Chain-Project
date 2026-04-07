import React, { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "medchain_notifications";

function loadNotifications() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
}

function saveNotifications(notifs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
}

export function useNotifications(contract, account) {
  const [notifications, setNotifications] = useState(loadNotifications);
  const [unread, setUnread] = useState(0);

  const addNotification = useCallback((notif) => {
    setNotifications(prev => {
      const updated = [{ ...notif, id: Date.now(), read: false, time: new Date().toISOString() }, ...prev].slice(0, 50);
      saveNotifications(updated);
      return updated;
    });
  }, []);

  const markAllRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      saveNotifications(updated);
      return updated;
    });
  };

  const clearAll = () => {
    setNotifications([]);
    saveNotifications([]);
  };

  const deleteNotif = (id) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      saveNotifications(updated);
      return updated;
    });
  };

  useEffect(() => {
    setUnread(notifications.filter(n => !n.read).length);
  }, [notifications]);

  // Listen for blockchain events
  useEffect(() => {
    if (!contract || !account) return;

    const handleRecordUploaded = (patient, hash, fileName) => {
      if (patient.toLowerCase() === account.toLowerCase()) {
        addNotification({
          type: "upload",
          title: "New Medical Record",
          message: `A new record "${fileName}" was uploaded to your account.`,
          hash,
        });
      }
    };

    const handleDoctorGranted = (patient, doctor) => {
      if (patient.toLowerCase() === account.toLowerCase()) {
        addNotification({
          type: "access",
          title: "Doctor Access Granted",
          message: `Doctor ${doctor.slice(0,6)}…${doctor.slice(-4)} now has access to your records.`,
        });
      }
    };

    const handleDoctorRevoked = (patient, doctor) => {
      if (patient.toLowerCase() === account.toLowerCase()) {
        addNotification({
          type: "revoke",
          title: "Doctor Access Revoked",
          message: `Access revoked for ${doctor.slice(0,6)}…${doctor.slice(-4)}.`,
        });
      }
    };

    try {
      contract.on("RecordUploaded", handleRecordUploaded);
      contract.on("DoctorGranted", handleDoctorGranted);
      contract.on("DoctorRevoked", handleDoctorRevoked);
    } catch(e) { console.log("Event listener error:", e); }

    return () => {
      try {
        contract.off("RecordUploaded", handleRecordUploaded);
        contract.off("DoctorGranted", handleDoctorGranted);
        contract.off("DoctorRevoked", handleDoctorRevoked);
      } catch(e) {}
    };
  }, [contract, account, addNotification]);

  return { notifications, unread, markAllRead, clearAll, deleteNotif };
}

export default function Notifications({ notifications, unread, markAllRead, clearAll, deleteNotif }) {
  const icons = { upload: "📋", access: "👨‍⚕️", revoke: "🚫", default: "🔔" };
  const colors = { upload: "var(--teal)", access: "var(--green)", revoke: "var(--red)", default: "var(--text-2)" };

  function timeAgo(iso) {
    const diff = (Date.now() - new Date(iso)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>🔔 Notifications {unread > 0 && <span className="notif-badge">{unread}</span>}</h2>
        <div style={{display:"flex",gap:"8px"}}>
          {unread > 0 && <button className="btn btn-sm" onClick={markAllRead}>Mark all read</button>}
          {notifications.length > 0 && <button className="btn btn-sm btn-danger" onClick={clearAll}>Clear all</button>}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔔</div>
          <p>No notifications yet.</p>
          <p className="empty-sub">You'll be notified when records are uploaded or access changes.</p>
        </div>
      ) : (
        <div className="notif-list">
          {notifications.map(n => (
            <div key={n.id} className={`notif-item ${!n.read ? "notif-unread" : ""}`}>
              <div className="notif-icon" style={{color: colors[n.type]||colors.default}}>
                {icons[n.type]||icons.default}
              </div>
              <div className="notif-body">
                <div className="notif-title">{n.title}</div>
                <div className="notif-message">{n.message}</div>
                {n.hash && (
                  <div className="notif-hash">
                    IPFS: {n.hash.slice(0,20)}…
                  </div>
                )}
                <div className="notif-time">{timeAgo(n.time)}</div>
              </div>
              {!n.read && <div className="notif-dot" />}
              <button className="notif-delete" onClick={() => deleteNotif(n.id)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
