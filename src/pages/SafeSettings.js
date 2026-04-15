import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useSafeInfo } from "../lib/useSafeInfo";
export function SafeSettings({ safe }) {
    const { owners, threshold } = useSafeInfo(safe);
    return (_jsxs(_Fragment, { children: [_jsx("h1", { className: "page-title", children: "Settings" }), _jsx("p", { className: "page-sub", children: "Signers and policies for this multisig." }), _jsxs("div", { className: "card", children: [_jsx("h3", { children: "Signing policy" }), _jsxs("p", { children: ["Any transaction requires ", _jsx("b", { children: threshold?.toString() ?? "-" }), " out of", " ", _jsx("b", { children: owners?.length ?? "-" }), " owners to confirm."] })] }), _jsxs("div", { className: "card", children: [_jsx("h3", { children: "Owners" }), !owners || owners.length === 0 ? (_jsx("p", { className: "status-text", children: "No owners found." })) : (_jsx("div", { children: owners.map((o) => (_jsx("div", { className: "card inner", style: { marginBottom: 8 }, children: _jsx("code", { children: o }) }, o))) }))] })] }));
}
