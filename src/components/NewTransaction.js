import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { isAddress, parseEther } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { safeAbi } from "../abis/safe";
import { buildSafeTx, toStored } from "../lib/safe";
import { createPending } from "../lib/storage";
export function NewTransaction({ safeAddress, nonce }) {
    const { chain } = useAccount();
    const pub = usePublicClient();
    const [to, setTo] = useState("");
    const [value, setValue] = useState("0");
    const [data, setData] = useState("0x");
    const [status, setStatus] = useState("");
    async function propose() {
        if (!pub || !chain)
            return;
        if (!isAddress(to))
            return setStatus("Invalid `to` address");
        const tx = buildSafeTx({
            to: to,
            value: parseEther(value || "0"),
            data: (data || "0x"),
            nonce,
        });
        const safeTxHash = (await pub.readContract({
            address: safeAddress,
            abi: safeAbi,
            functionName: "getTransactionHash",
            args: [
                tx.to, tx.value, tx.data, tx.operation,
                tx.safeTxGas, tx.baseGas, tx.gasPrice,
                tx.gasToken, tx.refundReceiver, tx.nonce,
            ],
        }));
        await createPending(toStored(tx, { safeAddress, chainId: chain.id, safeTxHash }));
        setStatus(`Proposed: ${safeTxHash}`);
        setTo("");
        setValue("0");
        setData("0x");
    }
    return (_jsxs("div", { className: "card", children: [_jsx("h3", { children: "New Transaction" }), _jsx("label", { children: "Recipient" }), _jsx("input", { value: to, onChange: (e) => setTo(e.target.value), placeholder: "0x..." }), _jsxs("div", { className: "grid-2", children: [_jsxs("div", { children: [_jsx("label", { children: "Value (ETH)" }), _jsx("input", { value: value, onChange: (e) => setValue(e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { children: "Data (hex)" }), _jsx("input", { value: data, onChange: (e) => setData(e.target.value), placeholder: "0x" })] })] }), _jsxs("div", { className: "row", style: { marginTop: 12 }, children: [_jsx("button", { onClick: propose, children: "Propose" }), status && _jsx("p", { className: "status-text", style: { margin: 0 }, children: status })] })] }));
}
