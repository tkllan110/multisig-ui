import {
  type Address,
  type Hex,
  encodeFunctionData,
  zeroAddress,
  concatHex,
  pad,
} from "viem";
import { safeAbi } from "../abis/safe";

export type Operation = 0 | 1;

export interface SafeTx {
  to: Address;
  value: bigint;
  data: Hex;
  operation: Operation;
  safeTxGas: bigint;
  baseGas: bigint;
  gasPrice: bigint;
  gasToken: Address;
  refundReceiver: Address;
  nonce: bigint;
}

export interface StoredSafeTx extends Omit<SafeTx, "value" | "safeTxGas" | "baseGas" | "gasPrice" | "nonce"> {
  value: string;
  safeTxGas: string;
  baseGas: string;
  gasPrice: string;
  nonce: string;
  safeAddress: Address;
  chainId: number;
  safeTxHash: Hex;
  signatures: Record<Address, Hex>;
  createdAt: number;
}

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
} as const;

export function buildSafeTx(partial: Partial<SafeTx> & Pick<SafeTx, "to" | "nonce">): SafeTx {
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

export function encodeSetup(params: {
  owners: Address[];
  threshold: bigint;
  fallbackHandler: Address;
}): Hex {
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
export function packSignatures(sigs: Record<Address, Hex>): Hex {
  const ordered = Object.entries(sigs)
    .map(([a, s]) => [a.toLowerCase() as Address, s] as const)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return concatHex(ordered.map(([, s]) => s));
}

export function toStored(tx: SafeTx, meta: {
  safeAddress: Address;
  chainId: number;
  safeTxHash: Hex;
}): StoredSafeTx {
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

export function fromStored(s: StoredSafeTx): SafeTx {
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
export function saltFromNonce(_initializer: Hex, saltNonce: bigint): Hex {
  return pad(`0x${saltNonce.toString(16)}`, { size: 32 }) as Hex;
  // Note: full address prediction needs proxy creationCode + keccak of initializer;
  // skipped for v0 - we just read `ProxyCreation` from the tx receipt.
}
