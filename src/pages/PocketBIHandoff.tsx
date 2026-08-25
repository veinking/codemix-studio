import { useEffect, useState } from "react";
import Papa from "papaparse";
import { useNavigate } from "react-router-dom";
import { useIndexedDB } from "@/hooks/useIndexedDB";

const CONTEXT_KEY = "bide.pocketbi.dataset.v1";
const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED_ORIGINS = new Set([
  "https://pocket-clean.vercel.app",
  "https://pocketbi.app",
]);

type PocketBIDatasetMessage = {
  type: "pocketbi:bide:dataset";
  version: 1;
  fileName: string;
  csv: string;
};

function isDatasetMessage(value: unknown): value is PocketBIDatasetMessage {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return candidate.type === "pocketbi:bide:dataset"
    && candidate.version === 1
    && typeof candidate.fileName === "string"
    && typeof candidate.csv === "string";
}

function safeFileName(value: string): string {
  const base = value.split(/[\\/]/).pop()?.trim() || "pocketbi-dataset.csv";
  const normalized = base.replace(/[^a-zA-Z0-9._ -]+/g, "_").slice(0, 160);
  return /\.csv$/i.test(normalized) ? normalized : `${normalized || "pocketbi-dataset"}.csv`;
}

function headersFromCsv(csv: string): string[] {
  const parsed = Papa.parse<string[]>(csv, { preview: 1, skipEmptyLines: true });
  const first = parsed.data[0] || [];
  return first.map((header) => String(header ?? "").trim()).filter(Boolean).slice(0, 2_000);
}

export default function PocketBIHandoff() {
  const navigate = useNavigate();
  const { saveFile, isReady } = useIndexedDB();
  const [status, setStatus] = useState("Preparing BIDE workspace…");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isReady) return;

    const announceReady = () => {
      if (!window.opener || window.opener.closed) return;
      for (const origin of ALLOWED_ORIGINS) {
        window.opener.postMessage({ type: "pocketbi:bide:ready", version: 1 }, origin);
      }
    };

    const onMessage = async (event: MessageEvent) => {
      if (!window.opener || event.source !== window.opener) return;
      if (!ALLOWED_ORIGINS.has(event.origin) || !isDatasetMessage(event.data)) return;
      setError("");
      setStatus("Saving cleaned dataset into BIDE…");

      try {
        const bytes = new TextEncoder().encode(event.data.csv).byteLength;
        if (!bytes || bytes > MAX_BYTES) throw new Error("PocketBI handoff must be between 1 byte and 20 MB.");
        const columns = headersFromCsv(event.data.csv);
        if (!columns.length) throw new Error("The PocketBI handoff does not contain a usable CSV header.");

        const name = safeFileName(event.data.fileName);
        const id = `pocketbi-${crypto.randomUUID()}`;
        await saveFile({
          id,
          name,
          content: event.data.csv,
          language: "csv",
          type: "file",
        });

        sessionStorage.setItem(CONTEXT_KEY, JSON.stringify({
          version: 1,
          id,
          name,
          columns,
          source: "pocketbi",
          receivedAt: new Date().toISOString(),
        }));
        localStorage.setItem("bide_visited", "true");

        window.opener.postMessage({
          type: "pocketbi:bide:accepted",
          version: 1,
          fileId: id,
          fileName: name,
          columns,
        }, event.origin);

        setStatus(`${name} is ready in BIDE.`);
        window.setTimeout(() => navigate(`/ide?source=pocketbi&file=${encodeURIComponent(name)}`, { replace: true }), 250);
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "BIDE could not accept this PocketBI dataset.";
        setError(message);
        setStatus("Handoff failed.");
        window.opener.postMessage({ type: "pocketbi:bide:error", version: 1, error: message }, event.origin);
      }
    };

    window.addEventListener("message", onMessage);
    announceReady();
    const retry = window.setInterval(announceReady, 500);
    const stopRetry = window.setTimeout(() => window.clearInterval(retry), 10_000);
    return () => {
      window.removeEventListener("message", onMessage);
      window.clearInterval(retry);
      window.clearTimeout(stopRetry);
    };
  }, [isReady, navigate, saveFile]);

  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#09090b",color:"#fafafa",fontFamily:"Inter,system-ui,sans-serif",padding:24}}>
    <section style={{width:"min(560px,100%)",padding:28,border:"1px solid #27272a",borderRadius:18,background:"#111113",boxShadow:"0 30px 80px rgba(0,0,0,.35)"}}>
      <div style={{fontSize:12,fontWeight:900,letterSpacing:".12em",textTransform:"uppercase",color:"#a78bfa"}}>PocketBI → BIDE</div>
      <h1 style={{margin:"10px 0 8px",fontSize:30,letterSpacing:"-.04em"}}>Opening your dataset workspace.</h1>
      <p style={{margin:0,color:"#a1a1aa",lineHeight:1.55}}>{status}</p>
      {error && <p style={{marginTop:14,padding:12,border:"1px solid #7f1d1d",borderRadius:10,background:"rgba(127,29,29,.15)",color:"#fecaca"}}>{error}</p>}
      <p style={{margin:"18px 0 0",fontSize:12,color:"#71717a"}}>The CSV is transferred directly from the trusted PocketBI opener and saved into BIDE's existing local workspace store. It is not placed in the URL.</p>
    </section>
  </main>;
}
