import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { safeAbi } from "../abis/safe";
import { EIP712_SAFE_TX_TYPES, fromStored, packSignatures, } from "../lib/safe";
import { addSignature, buildShareUrl, deletePending, listPending, } from "../lib/storage";
export function PendingTxList({ safeAddress, threshold, owners }) {
    const { chain, address: me } = useAccount();
    const { data: wallet } = useWalletClient();
    const [txs, setTxs] = useState([]);
    async function refresh() {
        if (!chain)
            return;
        setTxs(await listPending(safeAddress, chain.id));
    }
    useEffect(() => {
        refresh();
        const id = setInterval(refresh, 5000);
        return () => clearInterval(id);
    }, [safeAddress, chain?.id]);
    async function sign(tx) {
        if (!wallet || !chain || !me)
            return;
        const core = fromStored(tx);
        const signature = await wallet.signTypedData({
            domain: { chainId: chain.id, verifyingContract: safeAddress },
            types: EIP712_SAFE_TX_TYPES,
            primaryType: "SafeTx",
            message: {
                to: core.to,
                value: core.value,
                data: core.data,
                operation: core.operation,
                safeTxGas: core.safeTxGas,
                baseGas: core.baseGas,
                gasPrice: core.gasPrice,
                gasToken: core.gasToken,
                refundReceiver: core.refundReceiver,
                nonce: core.nonce,
            },
        });
        await addSignature(tx, me, signature);
        refresh();
    }
    async function execute(tx) {
        if (!wallet)
            return;
        const core = fromStored(tx);
        const packed = packSignatures(tx.signatures);
        const hash = await wallet.writeContract({
            address: safeAddress,
            abi: safeAbi,
            functionName: "execTransaction",
            args: [
                core.to, core.value, core.data, core.operation,
                core.safeTxGas, core.baseGas, core.gasPrice,
                core.gasToken, core.refundReceiver, packed,
            ],
        });
        alert(`Submitted: ${hash}`);
        await deletePending(tx);
        refresh();
    }
    return (_jsxs("div", { className: "card", children: [_jsx("h3", { style: { marginBottom: 16 }, children: "Queue" }), txs.length === 0 && _jsx("p", { className: "status-text", children: "No pending transactions." }), txs.map((tx) => {
                const count = Object.keys(tx.signatures).length;
                const ready = threshold !== undefined && BigInt(count) >= threshold;
                const signedByMe = me && tx.signatures[me.toLowerCase()];
                const canSign = owners?.some((o) => o.toLowerCase() === me?.toLowerCase());
                return (_jsxs("div", { className: "card inner", children: [_jsxs("div", { className: "row", style: { justifyContent: "space-between", marginBottom: 8 }, children: [_jsxs("span", { className: "badge", children: ["Nonce ", tx.nonce] }), _jsxs("span", { className: `badge ${ready ? "success" : ""}`, children: [count, " / ", threshold?.toString() ?? "?", " signatures"] })] }), _jsxs("div", { className: "stat", style: { marginBottom: 8 }, children: [_jsx("span", { className: "k", children: "To" }), _jsx("code", { children: tx.to })] }), _jsxs("div", { className: "stat", style: { marginBottom: 8 }, children: [_jsx("span", { className: "k", children: "Value" }), _jsxs("span", { children: [tx.value, " wei"] })] }), _jsxs("div", { className: "stat", style: { marginBottom: 12 }, children: [_jsx("span", { className: "k", children: "Transaction Hash" }), _jsx("code", { children: tx.safeTxHash })] }), _jsxs("div", { className: "row", children: [_jsx("button", { onClick: () => sign(tx), disabled: !!signedByMe || !canSign, children: signedByMe ? "Signed" : "Sign" }), _jsx("button", { className: "secondary", onClick: () => execute(tx), disabled: !ready, children: "Execute" }), _jsx("button", { className: "secondary", onClick: async () => {
                                        const url = buildShareUrl(tx);
                                        try {
                                            await navigator.clipboard.writeText(url);
                                            alert("Share link copied to clipboard");
                                        }
                                        catch {
                                            prompt("Copy this share link:", url);
                                        }
                                    }, children: "Share link" }), _jsx("button", { className: "danger", onClick: async () => { await deletePending(tx); refresh(); }, children: "Delete" })] })] }, tx.safeTxHash));
            })] }));
}
