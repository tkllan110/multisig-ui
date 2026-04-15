import { useEffect } from "react";
import { Link, NavLink, Route, Routes, useParams, useLocation, useNavigate } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { type Address, isAddress } from "viem";
import { CreateSafe } from "./pages/CreateSafe";
import { Home } from "./pages/Home";
import { SafeHome } from "./pages/SafeHome";
import { SafeTransactions } from "./pages/SafeTransactions";
import { SafeSettings } from "./pages/SafeSettings";
import {
  clearSharedTxHash,
  createPending,
  readSharedTxFromHash,
} from "./lib/storage";

function Brand() {
  return (
    <Link to="/" className="brand">
      <span className="brand-mark">M</span>
      <span>multisigEVM</span>
    </Link>
  );
}

function Header() {
  return (
    <header className="header">
      <Brand />
      <ConnectButton
        chainStatus="full"
        accountStatus="address"
        showBalance={false}
      />
    </header>
  );
}

function truncate(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function Sidebar({ safe }: { safe: Address }) {
  const base = `/safe/${safe}`;
  return (
    <aside className="sidebar">
      <div className="safe-chip">
        <div className="label">Active Multisig</div>
        <div className="addr" title={safe}>{truncate(safe)}</div>
      </div>
      <nav className="nav">
        <NavLink to={`${base}/home`} end>Home</NavLink>
        <NavLink to={`${base}/transactions`}>Transactions</NavLink>
        <NavLink to={`${base}/settings`}>Settings</NavLink>
      </nav>
    </aside>
  );
}

function SafeShell() {
  const { address } = useParams<{ address: string }>();
  if (!address || !isAddress(address)) {
    return (
      <div className="app no-sidebar">
        <Header />
        <main className="main">
          <div className="card">Invalid multisig address.</div>
        </main>
      </div>
    );
  }
  const safe = address as Address;
  return (
    <div className="app">
      <Header />
      <Sidebar safe={safe} />
      <main className="main">
        <Routes>
          <Route index element={<SafeHome safe={safe} />} />
          <Route path="home" element={<SafeHome safe={safe} />} />
          <Route path="transactions" element={<SafeTransactions safe={safe} />} />
          <Route path="settings" element={<SafeSettings safe={safe} />} />
        </Routes>
      </main>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app no-sidebar">
      <Header />
      <main className="main">{children}</main>
    </div>
  );
}

function useImportSharedTx() {
  const nav = useNavigate();
  useEffect(() => {
    const shared = readSharedTxFromHash();
    if (!shared) return;
    (async () => {
      await createPending(shared);
      clearSharedTxHash();
      nav(`/safe/${shared.safeAddress}/transactions`);
    })();
  }, [nav]);
}

export default function App() {
  const loc = useLocation();
  useImportSharedTx();
  // Route safes under /safe/:address/* to the SafeShell (sidebar layout)
  if (loc.pathname.startsWith("/safe/")) {
    return (
      <Routes>
        <Route path="/safe/:address/*" element={<SafeShell />} />
      </Routes>
    );
  }
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/new-safe" element={<CreateSafe />} />
      </Routes>
    </Shell>
  );
}
