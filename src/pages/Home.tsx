import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAddress } from "viem";
import { SUPPORTED_CHAINS } from "../config";

export function Home() {
  const nav = useNavigate();
  const [addr, setAddr] = useState("");
  return (
    <div className="welcome">
      <div className="hero">
        <span className="eyebrow">multisigEVM</span>
        <h1>Secure your assets with a multisig.</h1>
        <p>
          Create a multisig wallet and manage it from a clean, familiar dashboard.
          Works across multiple EVM networks.
        </p>
      </div>

      <div className="grid-2">
        <div className="card cta-card">
          <div className="cta-icon">NEW</div>
          <h3>Create a new multisig</h3>
          <p className="page-sub">
            Deploy a new multisig. Add owners and set a signing threshold.
          </p>
          <Link to="/new-safe"><button>Create multisig</button></Link>
        </div>
        <div className="card cta-card">
          <div className="cta-icon">OPEN</div>
          <h3>Open an existing multisig</h3>
          <p className="page-sub">
            Load a multisig by its address on the connected chain.
          </p>
          <input
            placeholder="0x..."
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
          />
          <button
            disabled={!isAddress(addr)}
            onClick={() => nav(`/safe/${addr}/home`)}
          >
            Open multisig
          </button>
        </div>
      </div>

      <div className="networks">
        <div className="networks-label">Supported networks</div>
        <div className="networks-list">
          {SUPPORTED_CHAINS.map((c) => (
            <span key={c.id} className="badge">{c.name}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
