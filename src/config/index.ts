import { defineChain, type Chain } from "viem";
import config from "./config.json";

export interface MultisigDeployment {
  safeSingleton: `0x${string}`;
  safeProxyFactory: `0x${string}`;
  fallbackHandler: `0x${string}`;
}

interface RawChain {
  id: number;
  name: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrl: string;
  blockExplorer: { name: string; url: string };
  contracts: MultisigDeployment;
}

export const APP_NAME: string = config.appName;
export const WALLETCONNECT_PROJECT_ID: string = config.walletConnectProjectId;

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

function toChain(c: RawChain): Chain {
  return defineChain({
    id: c.id,
    name: c.name,
    nativeCurrency: c.nativeCurrency,
    rpcUrls: { default: { http: [c.rpcUrl] } },
    blockExplorers: { default: c.blockExplorer },
  });
}

const rawChains = config.chains as RawChain[];

if (rawChains.length === 0) {
  throw new Error("src/config/config.json must define at least one chain.");
}

const chains = rawChains.map(toChain);

export const SUPPORTED_CHAINS = chains as unknown as readonly [Chain, ...Chain[]];

export const chainById: Record<number, Chain> = Object.fromEntries(
  chains.map((c) => [c.id, c]),
);

export const SAFE_CONTRACTS: Record<number, MultisigDeployment> = Object.fromEntries(
  rawChains.map((c) => [c.id, c.contracts]),
);

export function isChainDeployed(chainId: number): boolean {
  const cfg = SAFE_CONTRACTS[chainId];
  if (!cfg) return false;
  return (
    cfg.safeSingleton !== ZERO_ADDRESS &&
    cfg.safeProxyFactory !== ZERO_ADDRESS
  );
}
