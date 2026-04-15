import { encodeFunctionData, zeroAddress, concatHex, pad, } from "viem";
import { safeAbi } from "../abis/safe";
export const EIP712_SAFE_TX_TYPES = {
    SafeTx: [
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "data", type: "bytes" },
        { name: "operation", type: "uint8" },
        { name: "safeTxGas", type: "uint256" },
        { name: "baseGas", type: "uint256" },
        { name: "gasPrice", type: "uint256" },
        { name: "gasToken", type: "address" },
        { name: "refundReceiver", type: "address" },
        { name: "nonce", type: "uint256" },
    ],
};
export function buildSafeTx(partial) {
    return {
        to: partial.to,
        value: partial.value ?? 0n,
        data: partial.data ?? "0x",
        operation: partial.operation ?? 0,
        safeTxGas: partial.safeTxGas ?? 0n,
        baseGas: partial.baseGas ?? 0n,
        gasPrice: partial.gasPrice ?? 0n,
        gasToken: partial.gasToken ?? zeroAddress,
        refundReceiver: partial.refundReceiver ?? zeroAddress,
        nonce: partial.nonce,
    };
}
export function encodeSetup(params) {
    return encodeFunctionData({
        abi: safeAbi,
        functionName: "setup",
        args: [
            params.owners,
            params.threshold,
            zeroAddress,
            "0x",
            params.fallbackHandler,
            zeroAddress,
            0n,
            zeroAddress,
        ],
    });
}
// Sort signers ascending by address and pack 65-byte ECDSA signatures.
export function packSignatures(sigs) {
    const ordered = Object.entries(sigs)
        .map(([a, s]) => [a.toLowerCase(), s])
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return concatHex(ordered.map(([, s]) => s));
}
export function toStored(tx, meta) {
    return {
        ...tx,
        value: tx.value.toString(),
        safeTxGas: tx.safeTxGas.toString(),
        baseGas: tx.baseGas.toString(),
        gasPrice: tx.gasPrice.toString(),
        nonce: tx.nonce.toString(),
        safeAddress: meta.safeAddress,
        chainId: meta.chainId,
        safeTxHash: meta.safeTxHash,
        signatures: {},
        createdAt: Date.now(),
    };
}
export function fromStored(s) {
    return {
        to: s.to,
        value: BigInt(s.value),
        data: s.data,
        operation: s.operation,
        safeTxGas: BigInt(s.safeTxGas),
        baseGas: BigInt(s.baseGas),
        gasPrice: BigInt(s.gasPrice),
        gasToken: s.gasToken,
        refundReceiver: s.refundReceiver,
        nonce: BigInt(s.nonce),
    };
}
// Predict proxy address for CREATE2 - optional helper; bytecode is chain-specific.
export function saltFromNonce(_initializer, saltNonce) {
    return pad(`0x${saltNonce.toString(16)}`, { size: 32 });
    // Note: full address prediction needs proxy creationCode + keccak of initializer;
    // skipped for v0 - we just read `ProxyCreation` from the tx receipt.
}
