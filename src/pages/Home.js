import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAddress } from "viem";
import { SUPPORTED_CHAINS } from "../config";
export function Home() {
    const nav = useNavigate();
    const [addr, setAddr] = useState("");
    return (_jsxs("div", { className: "welcome", children: [_jsxs("div", { className: "hero", children: [_jsx("span", { className: "eyebrow", children: "multisigEVM" }), _jsx("h1", { children: "Secure your assets with a multisig." }), _jsx("p", { children: "Create a multisig wallet and manage it from a clean, familiar dashboard. Works across multiple EVM networks." })] }), _jsxs("div", { className: "grid-2", children: [_jsxs("div", { className: "card cta-card", children: [_jsx("div", { className: "cta-icon", children: "NEW" }), _jsx("h3", { children: "Create a new multisig" }), _jsx("p", { className: "page-sub", children: "Deploy a new multisig. Add owners and set a signing threshold." }), _jsx(Link, { to: "/new-safe", children: _jsx("button", { children: "Create multisig" }) })] }), _jsxs("div", { className: "card cta-card", children: [_jsx("div", { className: "cta-icon", children: "OPEN" }), _jsx("h3", { children: "Open an existing multisig" }), _jsx("p", { className: "page-sub", children: "Load a multisig by its address on the connected chain." }), _jsx("input", { placeholder: "0x...", value: addr, onChange: (e) => setAddr(e.target.value) }), _jsx("button", { disabled: !isAddress(addr), onClick: () => nav(`/safe/${addr}/home`), children: "Open multisig" })] })] }), _jsxs("div", { className: "networks", children: [_jsx("div", { className: "networks-label", children: "Supported networks" }), _jsx("div", { className: "networks-list", children: SUPPORTED_CHAINS.map((c) => (_jsx("span", { className: "badge", children: c.name }, c.id))) })] })] }));
}
