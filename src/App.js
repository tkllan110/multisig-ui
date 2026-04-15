import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { Link, NavLink, Route, Routes, useParams, useLocation, useNavigate } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { isAddress } from "viem";
import { CreateSafe } from "./pages/CreateSafe";
import { Home } from "./pages/Home";
import { SafeHome } from "./pages/SafeHome";
import { SafeTransactions } from "./pages/SafeTransactions";
import { SafeSettings } from "./pages/SafeSettings";
import { clearSharedTxHash, createPending, readSharedTxFromHash, } from "./lib/storage";
function Brand() {
    return (_jsxs(Link, { to: "/", className: "brand", children: [_jsx("span", { className: "brand-mark", children: "M" }), _jsx("span", { children: "multisigEVM" })] }));
}
function Header() {
    return (_jsxs("header", { className: "header", children: [_jsx(Brand, {}), _jsx(ConnectButton, { chainStatus: "full", accountStatus: "address", showBalance: false })] }));
}
function truncate(addr) {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
function Sidebar({ safe }) {
    const base = `/safe/${safe}`;
    return (_jsxs("aside", { className: "sidebar", children: [_jsxs("div", { className: "safe-chip", children: [_jsx("div", { className: "label", children: "Active Multisig" }), _jsx("div", { className: "addr", title: safe, children: truncate(safe) })] }), _jsxs("nav", { className: "nav", children: [_jsx(NavLink, { to: `${base}/home`, end: true, children: "Home" }), _jsx(NavLink, { to: `${base}/transactions`, children: "Transactions" }), _jsx(NavLink, { to: `${base}/settings`, children: "Settings" })] })] }));
}
function SafeShell() {
    const { address } = useParams();
    if (!address || !isAddress(address)) {
        return (_jsxs("div", { className: "app no-sidebar", children: [_jsx(Header, {}), _jsx("main", { className: "main", children: _jsx("div", { className: "card", children: "Invalid multisig address." }) })] }));
    }
    const safe = address;
    return (_jsxs("div", { className: "app", children: [_jsx(Header, {}), _jsx(Sidebar, { safe: safe }), _jsx("main", { className: "main", children: _jsxs(Routes, { children: [_jsx(Route, { index: true, element: _jsx(SafeHome, { safe: safe }) }), _jsx(Route, { path: "home", element: _jsx(SafeHome, { safe: safe }) }), _jsx(Route, { path: "transactions", element: _jsx(SafeTransactions, { safe: safe }) }), _jsx(Route, { path: "settings", element: _jsx(SafeSettings, { safe: safe }) })] }) })] }));
}
function Shell({ children }) {
    return (_jsxs("div", { className: "app no-sidebar", children: [_jsx(Header, {}), _jsx("main", { className: "main", children: children })] }));
}
function useImportSharedTx() {
    const nav = useNavigate();
    useEffect(() => {
        const shared = readSharedTxFromHash();
        if (!shared)
            return;
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
        return (_jsx(Routes, { children: _jsx(Route, { path: "/safe/:address/*", element: _jsx(SafeShell, {}) }) }));
    }
    return (_jsx(Shell, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Home, {}) }), _jsx(Route, { path: "/new-safe", element: _jsx(CreateSafe, {}) })] }) }));
}
