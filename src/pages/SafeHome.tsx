import { type Address } from "viem";
import { useAccount } from "wagmi";
import { useSafeInfo } from "../lib/useSafeInfo";

export function SafeHome({ safe }: { safe: Address }) {
  const { chain } = useAccount();
  const { owners, threshold, nonce, balance } = useSafeInfo(safe);

  return (
    <>
      <h1 className="page-title">Home</h1>
      <p className="page-sub">Overview of your multisig.</p>

      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <div className="stat">
              <span className="k">Multisig Address</span>
              <span className="v" style={{ fontFamily: "ui-monospace, monospace", fontSize: 14 }}>
                <code>{safe}</code>
              </span>
            </div>
          </div>
          <span className="badge success">{chain?.name ?? "-"}</span>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="stat">
            <span className="k">Balance</span>
            <span className="v">
              {balance ? `${balance.formatted} ${balance.symbol}` : "-"}
            </span>
          </div>
        </div>
        <div className="card">
          <div className="stat">
            <span className="k">Threshold</span>
            <span className="v">
              {threshold?.toString() ?? "-"} / {owners?.length ?? "-"}
            </span>
          </div>
        </div>
        <div className="card">
          <div className="stat">
            <span className="k">Nonce</span>
            <span className="v">{nonce?.toString() ?? "-"}</span>
          </div>
        </div>
        <div className="card">
          <div className="stat">
            <span className="k">Owners</span>
            <span className="v">{owners?.length ?? "-"}</span>
          </div>
        </div>
      </div>
    </>
  );
}
