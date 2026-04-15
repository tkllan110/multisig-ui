import { useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { type Address, decodeEventLog, isAddress } from "viem";
import { Link, useNavigate } from "react-router-dom";
import { SAFE_CONTRACTS, ZERO_ADDRESS } from "../config";
import { safeProxyFactoryAbi } from "../abis/safe";
import { encodeSetup } from "../lib/safe";

export function CreateSafe() {
  const { chain, address: me } = useAccount();
  const publicClient = usePublicClient();
  const { data: wallet } = useWalletClient();
  const nav = useNavigate();

  const [ownerRows, setOwnerRows] = useState<string[]>([me ?? ""]);
  const [threshold, setThreshold] = useState(1);
  const [status, setStatus] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const owners = ownerRows.map((o) => o.trim()).filter(Boolean) as Address[];
  const ownersValid = owners.length > 0 && owners.every((o) => isAddress(o));
  const uniqueOwners = new Set(owners.map((o) => o.toLowerCase())).size === owners.length;
  const validThreshold = threshold >= 1 && threshold <= owners.length;
  const valid = ownersValid && uniqueOwners && validThreshold;
  const cfgForChain = chain ? SAFE_CONTRACTS[chain.id] : undefined;
  const chainSupported =
    !!cfgForChain &&
    cfgForChain.safeSingleton !== ZERO_ADDRESS &&
    cfgForChain.safeProxyFactory !== ZERO_ADDRESS;

  function setRow(i: number, v: string) {
    setOwnerRows((rows) => rows.map((r, idx) => (idx === i ? v : r)));
  }
  function addRow() {
    setOwnerRows((rows) => [...rows, ""]);
  }
  function removeRow(i: number) {
    setOwnerRows((rows) => (rows.length === 1 ? rows : rows.filter((_, idx) => idx !== i)));
    setThreshold((t) => Math.min(t, Math.max(1, ownerRows.length - 1)));
  }

  async function create() {
    if (!wallet || !chain || !publicClient) return;
    const cfg = SAFE_CONTRACTS[chain.id];
    if (!cfg) return setStatus("Unsupported chain");

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
        } catch {
          // not our event
        }
      }
      setStatus("Created, but could not find ProxyCreation event");
    } catch (e: any) {
      setStatus(e?.shortMessage ?? e?.message ?? "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Link to="/" className="back-link">Back to home</Link>
      <h1 className="page-title">Create new multisig</h1>
      <p className="page-sub">Deploy a new multisig on the selected network.</p>

      <div className="stepper">
        <div className="step active"><span className="idx">1</span>Signers</div>
        <div className="step-sep" />
        <div className="step"><span className="idx">2</span>Review &amp; Deploy</div>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Signers &amp; confirmations</h3>
          <span className={`badge ${chainSupported ? "success" : "warn"}`}>
            {chain?.name ?? "No network"}
          </span>
        </div>
        <p className="status-text" style={{ marginTop: 0 }}>
          Add the owners of the multisig and set how many of them need to confirm a transaction.
        </p>

        <label>Owners</label>
        <div className="owner-list">
          {ownerRows.map((row, i) => (
            <div key={i} className="owner-row">
              <span className="owner-idx">{i + 1}</span>
              <input
                placeholder="0x..."
                value={row}
                onChange={(e) => setRow(i, e.target.value)}
              />
              <button
                type="button"
                className="secondary"
                onClick={() => removeRow(i)}
                disabled={ownerRows.length === 1}
                aria-label="Remove owner"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="secondary" onClick={addRow} style={{ marginTop: 8 }}>
          + Add another owner
        </button>

        <label style={{ marginTop: 20 }}>Threshold</label>
        <div className="row">
          <select
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            style={{ maxWidth: 100 }}
          >
            {Array.from({ length: Math.max(1, owners.length) }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span className="status-text" style={{ margin: 0 }}>
            out of {owners.length || "-"} owner(s)
          </span>
        </div>
        {!uniqueOwners && (
          <p className="status-text error">Duplicate owner addresses detected.</p>
        )}
        {!chain && (
          <p className="status-text error">
            Connect a wallet and switch to Sei, Injective, or Realio.
          </p>
        )}
        {chain && !cfgForChain && (
          <p className="status-text error">
            {chain.name} is not supported. Switch to Sei, Injective, or Realio in the top-right.
          </p>
        )}
        {chain && cfgForChain && !chainSupported && (
          <p className="status-text error">
            Multisig contracts are not yet deployed on {chain.name}. Contact support or deploy the contracts yourself using the instructions.
          </p>
        )}

        <div className="row" style={{ marginTop: 20, gap: 12 }}>
          <button disabled={!valid || !wallet || !chainSupported || submitting} onClick={create}>
            {submitting ? "Deploying..." : "Create multisig"}
          </button>
          {status && <p className="status-text" style={{ margin: 0 }}>{status}</p>}
        </div>
      </div>
    </>
  );
}
