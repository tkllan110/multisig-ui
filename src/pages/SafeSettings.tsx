import { type Address } from "viem";
import { useSafeInfo } from "../lib/useSafeInfo";

export function SafeSettings({ safe }: { safe: Address }) {
  const { owners, threshold } = useSafeInfo(safe);
  return (
    <>
      <h1 className="page-title">Settings</h1>
      <p className="page-sub">Signers and policies for this multisig.</p>

      <div className="card">
        <h3>Signing policy</h3>
        <p>
          Any transaction requires <b>{threshold?.toString() ?? "-"}</b> out of{" "}
          <b>{owners?.length ?? "-"}</b> owners to confirm.
        </p>
      </div>

      <div className="card">
        <h3>Owners</h3>
        {!owners || owners.length === 0 ? (
          <p className="status-text">No owners found.</p>
        ) : (
          <div>
            {owners.map((o) => (
              <div key={o} className="card inner" style={{ marginBottom: 8 }}>
                <code>{o}</code>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
