import { defineChain } from "viem";
import config from "./config.json";
export const APP_NAME = config.appName;
export const WALLETCONNECT_PROJECT_ID = config.walletConnectProjectId;
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
function toChain(c) {
    return defineChain({
        id: c.id,
        name: c.name,
        nativeCurrency: c.nativeCurrency,
        rpcUrls: { default: { http: [c.rpcUrl] } },
        blockExplorers: { default: c.blockExplorer },
    });
}
const rawChains = config.chains;
if (rawChains.length === 0) {
    throw new Error("src/config/config.json must define at least one chain.");
}
const chains = rawChains.map(toChain);
export const SUPPORTED_CHAINS = chains;
export const chainById = Object.fromEntries(chains.map((c) => [c.id, c]));
export const SAFE_CONTRACTS = Object.fromEntries(rawChains.map((c) => [c.id, c.contracts]));
export function isChainDeployed(chainId) {
    const cfg = SAFE_CONTRACTS[chainId];
    if (!cfg)
        return false;
    return (cfg.safeSingleton !== ZERO_ADDRESS &&
        cfg.safeProxyFactory !== ZERO_ADDRESS);
}
