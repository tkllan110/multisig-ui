const KEY = (safe, chainId) => `multisigEVM:txs:${chainId}:${safe.toLowerCase()}`;
function readAll(safe, chainId) {
    try {
        return JSON.parse(localStorage.getItem(KEY(safe, chainId)) ?? "[]");
    }
    catch {
        return [];
    }
}
function writeAll(safe, chainId, txs) {
    localStorage.setItem(KEY(safe, chainId), JSON.stringify(txs));
}
export async function listPending(safe, chainId) {
    return readAll(safe, chainId).sort((a, b) => b.createdAt - a.createdAt);
}
export async function createPending(tx) {
    const txs = readAll(tx.safeAddress, tx.chainId);
    const idx = txs.findIndex((t) => t.safeTxHash === tx.safeTxHash);
    if (idx >= 0) {
        // Merge signatures — don't overwrite existing
        txs[idx] = {
            ...tx,
            signatures: { ...tx.signatures, ...txs[idx].signatures },
        };
    }
    else {
        txs.push({ ...tx, signatures: tx.signatures ?? {} });
    }
    writeAll(tx.safeAddress, tx.chainId, txs);
    return txs[idx >= 0 ? idx : txs.length - 1];
}
export async function addSignature(tx, signer, signature) {
    const txs = readAll(tx.safeAddress, tx.chainId);
    let idx = txs.findIndex((t) => t.safeTxHash === tx.safeTxHash);
    if (idx === -1) {
        txs.push({ ...tx, signatures: {} });
        idx = txs.length - 1;
    }
    txs[idx] = {
        ...txs[idx],
        signatures: {
            ...txs[idx].signatures,
            [signer.toLowerCase()]: signature,
        },
    };
    writeAll(tx.safeAddress, tx.chainId, txs);
    return txs[idx];
}
export async function deletePending(tx) {
    const txs = readAll(tx.safeAddress, tx.chainId).filter((t) => t.safeTxHash !== tx.safeTxHash);
    writeAll(tx.safeAddress, tx.chainId, txs);
}
// --- URL-sharing helpers ------------------------------------------------
function b64urlEncode(s) {
    const bytes = new TextEncoder().encode(s);
    let bin = "";
    for (const b of bytes)
        bin += String.fromCharCode(b);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s) {
    const pad = s.length % 4 === 0 ? 0 : 4 - (s.length % 4);
    const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
    const bin = atob(padded);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++)
        bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
}
/** Build a shareable URL that carries the tx (with its current signatures). */
export function buildShareUrl(tx) {
    const payload = b64urlEncode(JSON.stringify(tx));
    const { origin, pathname } = window.location;
    return `${origin}${pathname}#tx=${payload}`;
}
/** Read a tx from the URL hash if present. Returns null otherwise. */
export function readSharedTxFromHash() {
    const m = /[#&]tx=([A-Za-z0-9_-]+)/.exec(window.location.hash);
    if (!m)
        return null;
    try {
        return JSON.parse(b64urlDecode(m[1]));
    }
    catch {
        return null;
    }
}
/** Clear the `#tx=...` fragment from the address bar without a reload. */
export function clearSharedTxHash() {
    if (window.location.hash.includes("tx=")) {
        const { origin, pathname, search } = window.location;
        window.history.replaceState(null, "", `${origin}${pathname}${search}`);
    }
}
