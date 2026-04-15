import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { decodeEventLog, isAddress } from "viem";
import { Link, useNavigate } from "react-router-dom";
import { SAFE_CONTRACTS, ZERO_ADDRESS } from "../config";
import { safeProxyFactoryAbi } from "../abis/safe";
import { encodeSetup } from "../lib/safe";
export function CreateSafe() {
    const { chain, address: me } = useAccount();
    const publicClient = usePublicClient();
    const { data: wallet } = useWalletClient();
    const nav = useNavigate();
    const [ownerRows, setOwnerRows] = useState([me ?? ""]);
    const [threshold, setThreshold] = useState(1);
    const [status, setStatus] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const owners = ownerRows.map((o) => o.trim()).filter(Boolean);
    const ownersValid = owners.length > 0 && owners.every((o) => isAddress(o));
    const uniqueOwners = new Set(owners.map((o) => o.toLowerCase())).size === owners.length;
    const validThreshold = threshold >= 1 && threshold <= owners.length;
    const valid = ownersValid && uniqueOwners && validThreshold;
    const cfgForChain = chain ? SAFE_CONTRACTS[chain.id] : undefined;
    const chainSupported = !!cfgForChain &&
        cfgForChain.safeSingleton !== ZERO_ADDRESS &&
        cfgForChain.safeProxyFactory !== ZERO_ADDRESS;
    function setRow(i, v) {
        setOwnerRows((rows) => rows.map((r, idx) => (idx === i ? v : r)));
    }
    function addRow() {
        setOwnerRows((rows) => [...rows, ""]);
    }
    function removeRow(i) {
        setOwnerRows((rows) => (rows.length === 1 ? rows : rows.filter((_, idx) => idx !== i)));
        setThreshold((t) => Math.min(t, Math.max(1, ownerRows.length - 1)));
    }
    async function create() {
        if (!wallet || !chain || !publicClient)
            return;
        const cfg = SAFE_CONTRACTS[chain.id];
        if (!cfg)
            return setStatus("Unsupported chain");
        try {
            setSubmitting(true);
            setStatus("Submitting...");
            const initializer = encodeSetup({
                owners,
                threshold: BigInt(threshold),
                fallbackHandler: cfg.fallbackHandler,
            });
            const saltNonce = BigInt(Date.now());
            const hash = await wallet.writeContract({
                address: cfg.safeProxyFactory,
                abi: safeProxyFactoryAbi,
                functionName: "createProxyWithNonce",
                args: [cfg.safeSingleton, initializer, saltNonce],
            });
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            for (const log of receipt.logs) {
                try {
                    const parsed = decodeEventLog({
                        abi: safeProxyFactoryAbi,
                        data: log.data,
                        topics: log.topics,
                    });
                    if (parsed.eventName === "ProxyCreation") {
                        nav(`/safe/${parsed.args.proxy}/home`);
                        return;
                    }
                }
                catch {
                    // not our event
                }
            }
            setStatus("Created, but could not find ProxyCreation event");
        }
        catch (e) {
            setStatus(e?.shortMessage ?? e?.message ?? "Failed to submit");
        }
        finally {
            setSubmitting(false);
        }
    }
    return (_jsxs(_Fragment, { children: [_jsx(Link, { to: "/", className: "back-link", children: "Back to home" }), _jsx("h1", { className: "page-title", children: "Create new multisig" }), _jsx("p", { className: "page-sub", children: "Deploy a new multisig on the selected network." }), _jsxs("div", { className: "stepper", children: [_jsxs("div", { className: "step active", children: [_jsx("span", { className: "idx", children: "1" }), "Signers"] }), _jsx("div", { className: "step-sep" }), _jsxs("div", { className: "step", children: [_jsx("span", { className: "idx", children: "2" }), "Review & Deploy"] })] }), _jsxs("div", { className: "card", children: [_jsxs("div", { className: "row", style: { justifyContent: "space-between", marginBottom: 16 }, children: [_jsx("h3", { style: { margin: 0 }, children: "Signers & confirmations" }), _jsx("span", { className: `badge ${chainSupported ? "success" : "warn"}`, children: chain?.name ?? "No network" })] }), _jsx("p", { className: "status-text", style: { marginTop: 0 }, children: "Add the owners of the multisig and set how many of them need to confirm a transaction." }), _jsx("label", { children: "Owners" }), _jsx("div", { className: "owner-list", children: ownerRows.map((row, i) => (_jsxs("div", { className: "owner-row", children: [_jsx("span", { className: "owner-idx", children: i + 1 }), _jsx("input", { placeholder: "0x...", value: row, onChange: (e) => setRow(i, e.target.value) }), _jsx("button", { type: "button", className: "secondary", onClick: () => removeRow(i), disabled: ownerRows.length === 1, "aria-label": "Remove owner", children: "Remove" })] }, i))) }), _jsx("button", { type: "button", className: "secondary", onClick: addRow, style: { marginTop: 8 }, children: "+ Add another owner" }), _jsx("label", { style: { marginTop: 20 }, children: "Threshold" }), _jsxs("div", { className: "row", children: [_jsx("select", { value: threshold, onChange: (e) => setThreshold(Number(e.target.value)), style: { maxWidth: 100 }, children: Array.from({ length: Math.max(1, owners.length) }, (_, i) => i + 1).map((n) => (_jsx("option", { value: n, children: n }, n))) }), _jsxs("span", { className: "status-text", style: { margin: 0 }, children: ["out of ", owners.length || "-", " owner(s)"] })] }), !uniqueOwners && (_jsx("p", { className: "status-text error", children: "Duplicate owner addresses detected." })), !chain && (_jsx("p", { className: "status-text error", children: "Connect a wallet and switch to Sei, Injective, or Realio." })), chain && !cfgForChain && (_jsxs("p", { className: "status-text error", children: [chain.name, " is not supported. Switch to Sei, Injective, or Realio in the top-right."] })), chain && cfgForChain && !chainSupported && (_jsxs("p", { className: "status-text error", children: ["Multisig contracts are not yet deployed on ", chain.name, ". Contact support or deploy the contracts yourself using the instructions."] })), _jsxs("div", { className: "row", style: { marginTop: 20, gap: 12 }, children: [_jsx("button", { disabled: !valid || !wallet || !chainSupported || submitting, onClick: create, children: submitting ? "Deploying..." : "Create multisig" }), status && _jsx("p", { className: "status-text", style: { margin: 0 }, children: status })] })] })] }));
}
