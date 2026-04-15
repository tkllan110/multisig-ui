/**
 * Deploy Safe v1.4.1 multisig contracts to a chain listed in
 * src/config/config.json, and write the deployed addresses back into
 * that same file.
 *
 * Usage:
 *   PRIVATE_KEY=0x... npx tsx scripts/deploy.ts <chainId>
 *
 * Example:
 *   PRIVATE_KEY=0xabc... npx tsx scripts/deploy.ts 1329
 *
 * Requirements:
 *   npm i -D @safe-global/safe-contracts
 *
 * Notes:
 *   - The deployer account must have enough native gas on the target chain.
 *   - Contracts are deployed NON-deterministically (plain CREATE). If you
 *     need canonical CREATE2 addresses identical to Ethereum mainnet, use
 *     the @safe-global/safe-singleton-factory flow instead.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  type Abi,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

// Compiled Safe v1.4.1 artifacts (install @safe-global/safe-contracts first).
// The `with { type: "json" }` assertion keeps tsx/node happy.
// @ts-ignore - provided by @safe-global/safe-contracts build output
import SafeArtifact from "@safe-global/safe-contracts/build/artifacts/contracts/Safe.sol/Safe.json" with { type: "json" };
// @ts-ignore
import SafeProxyFactoryArtifact from "@safe-global/safe-contracts/build/artifacts/contracts/proxies/SafeProxyFactory.sol/SafeProxyFactory.json" with { type: "json" };
// @ts-ignore
import FallbackHandlerArtifact from "@safe-global/safe-contracts/build/artifacts/contracts/handler/CompatibilityFallbackHandler.sol/CompatibilityFallbackHandler.json" with { type: "json" };

interface Artifact {
  abi: Abi;
  bytecode: Hex;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.resolve(__dirname, "..", "src", "config", "config.json");

interface ChainEntry {
  id: number;
  name: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrl: string;
  blockExplorer: { name: string; url: string };
  contracts: {
    safeSingleton: Hex;
    safeProxyFactory: Hex;
    fallbackHandler: Hex;
  };
}

interface Config {
  appName: string;
  walletConnectProjectId: string;
  chains: ChainEntry[];
}

function loadConfig(): Config {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")) as Config;
}

function saveConfig(config: Config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n");
}

async function main() {
  const chainIdArg = process.argv[2];
  if (!chainIdArg) {
    console.error("Usage: PRIVATE_KEY=0x... tsx scripts/deploy.ts <chainId>");
    process.exit(1);
  }
  const chainId = Number(chainIdArg);

  const privateKey = process.env.PRIVATE_KEY as Hex | undefined;
  if (!privateKey || !privateKey.startsWith("0x")) {
    console.error("PRIVATE_KEY env var must be set (0x-prefixed hex).");
    process.exit(1);
  }

  const config = loadConfig();
  const entry = config.chains.find((c) => c.id === chainId);
  if (!entry) {
    console.error(`Chain ${chainId} is not listed in ${CONFIG_PATH}`);
    process.exit(1);
  }

  const chain = defineChain({
    id: entry.id,
    name: entry.name,
    nativeCurrency: entry.nativeCurrency,
    rpcUrls: { default: { http: [entry.rpcUrl] } },
    blockExplorers: { default: entry.blockExplorer },
  });

  const account = privateKeyToAccount(privateKey);
  const transport = http();
  const wallet = createWalletClient({ account, chain, transport });
  const pub = createPublicClient({ chain, transport });

  console.log(`Deploying to ${entry.name} (chainId ${entry.id})`);
  console.log(`Deployer:   ${account.address}`);
  const balance = await pub.getBalance({ address: account.address });
  console.log(`Balance:    ${balance} wei`);
  if (balance === 0n) {
    console.error("Deployer has zero balance. Fund the account and retry.");
    process.exit(1);
  }

  async function deploy(label: string, artifact: Artifact): Promise<Hex> {
    console.log(`\n> Deploying ${label}...`);
    const hash = await wallet.deployContract({
      abi: artifact.abi,
      bytecode: artifact.bytecode,
      args: [],
    });
    console.log(`  tx:      ${hash}`);
    const receipt = await pub.waitForTransactionReceipt({ hash });
    if (!receipt.contractAddress) {
      throw new Error(`${label}: transaction succeeded but no contractAddress`);
    }
    console.log(`  address: ${receipt.contractAddress}`);
    return receipt.contractAddress;
  }

  const safeSingleton = await deploy("Safe singleton", SafeArtifact as Artifact);
  const safeProxyFactory = await deploy("SafeProxyFactory", SafeProxyFactoryArtifact as Artifact);
  const fallbackHandler = await deploy(
    "CompatibilityFallbackHandler",
    FallbackHandlerArtifact as Artifact,
  );

  // Persist results back into config.json
  const fresh = loadConfig();
  const idx = fresh.chains.findIndex((c) => c.id === chainId);
  fresh.chains[idx].contracts = { safeSingleton, safeProxyFactory, fallbackHandler };
  saveConfig(fresh);

  console.log(`\nDone. Updated ${path.relative(process.cwd(), CONFIG_PATH)}.`);
  console.log({ safeSingleton, safeProxyFactory, fallbackHandler });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
