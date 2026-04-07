import React, { createContext, useContext, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const WalletContext = createContext(null);

const CONTRACT_ADDRESS = "0x37A8398C7b63FB696Ff946b706D593cb01f6C825";
const BACKEND_URL = "https://medical-chain-project-production.up.railway.app";

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [isHospital, setIsHospital] = useState(false);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // For demo — manual address entry (WalletConnect requires native build)
  const connectWallet = useCallback(async (address) => {
    try {
      await AsyncStorage.setItem("wallet_address", address);
      setAccount(address);
      return true;
    } catch (err) {
      return false;
    }
  }, []);

  const disconnect = useCallback(async () => {
    await AsyncStorage.removeItem("wallet_address");
    setAccount(null);
    setIsHospital(false);
    setRecords([]);
  }, []);

  // Load saved wallet on app start
  React.useEffect(() => {
    AsyncStorage.getItem("wallet_address").then(addr => {
      if (addr) setAccount(addr);
    });
  }, []);

  const loadRecords = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/records/${account}`);
      const data = await res.json();
      setRecords(data.records || []);
    } catch (err) {
      console.log("Load records error:", err);
    }
    setLoading(false);
  }, [account]);

  return (
    <WalletContext.Provider value={{
      account, contract, isHospital,
      records, loading,
      connectWallet, disconnect, loadRecords,
      CONTRACT_ADDRESS, BACKEND_URL,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
