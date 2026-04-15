import { useEffect, useState } from "react";
import { type Address, type Hex } from "viem";
import { useAccount, useWalletClient } from "wagmi";
import { safeAbi } from "../abis/safe";
import {
  EIP712_SAFE_TX_TYPES,
  fromStored,
  packSignatures,
  type StoredSafeTx,
} from "../lib/safe";
import {
  addSignature,
  buildShareUrl,
  deletePending,
  listPending,
} from "../lib/storage";

interface Props {
  safeAddress: Address;
  threshold?: bigint;
  owners?: Address[];
}

export function PendingTxList({ safeAddress, threshold, owners }: Props) {
  const { chain, address: me } = useAccount();
  const { data: wallet } = useWalletClient();
  const [txs, setTxs] = useState<StoredSafeTx[]>([]);

  async function refresh() {
    if (!chain) return;
    setTxs(await listPending(safeAddress, chain.id));
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [safeAddress, chain?.id]);

  async function sign(tx: StoredSafeTx) {
    if (!wallet || !chain || !me) return;
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

  async function execute(tx: StoredSafeTx) {
    if (!wallet) return;
    const core = fromStored(tx);
    const packed = packSignatures(tx.signatures);
    const hash = await wallet.writeContract({
      address: safeAddress,
      abi: safeAbi,
      functionName: "execTransaction",
      args: [
        core.to, core.value, core.data, core.operation,
        core.safeTxGas, core.baseGas, core.gasPrice,
        core.gasToken, core.refundReceiver, packed as Hex,
      ],
    });
    alert(`Submitted: ${hash}`);
    await deletePending(tx);
    refresh();
  }

  return (
    <div className="card">
      <h3 style={{ marginBottom: 16 }}>Queue</h3>
      {txs.length === 0 && <p className="status-text">No pending transactions.</p>}
      {txs.map((tx) => {
        const count = Object.keys(tx.signatures).length;
        const ready = threshold !== undefined && BigInt(count) >= threshold;
        const signedByMe = me && tx.signatures[me.toLowerCase() as Address];
        const canSign = owners?.some(
          (o) => o.toLowerCase() === me?.toLowerCase(),
        );
        return (
          <div key={tx.safeTxHash} className="card inner">
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
              <span className="badge">Nonce {tx.nonce}</span>
              <span className={`badge ${ready ? "success" : ""}`}>
                {count} / {threshold?.toString() ?? "?"} signatures
              </span>
            </div>
            <div className="stat" style={{ marginBottom: 8 }}>
              <span className="k">To</span>
              <code>{tx.to}</code>
            </div>
            <div className="stat" style={{ marginBottom: 8 }}>
              <span className="k">Value</span>
              <span>{tx.value} wei</span>
            </div>
            <div className="stat" style={{ marginBottom: 12 }}>
              <span className="k">Transaction Hash</span>
              <code>{tx.safeTxHash}</code>
            </div>
            <div className="row">
              <button onClick={() => sign(tx)} disabled={!!signedByMe || !canSign}>
                {signedByMe ? "Signed" : "Sign"}
              </button>
              <button className="secondary" onClick={() => execute(tx)} disabled={!ready}>
                Execute
              </button>
              <button
                className="secondary"
                onClick={async () => {
                  const url = buildShareUrl(tx);
                  try {
                    await navigator.clipboard.writeText(url);
                    alert("Share link copied to clipboard");
                  } catch {
                    prompt("Copy this share link:", url);
                  }
                }}
              >
                Share link
              </button>
              <button className="danger" onClick={async () => { await deletePending(tx); refresh(); }}>
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
