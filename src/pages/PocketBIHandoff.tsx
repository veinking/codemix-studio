import { useEffect, useState } from "react";
import Papa from "papaparse";
import { useNavigate } from "react-router-dom";
import { useIndexedDB } from "@/hooks/useIndexedDB";
import {
  appendBIDELineage,
  normalizePocketBIHandoffV1,
  type PocketBIHandoffManifest,
  validatePocketBIHandoffV1,
} from "@/lib/pocketBIHandoffV1";

const CONTEXT_KEY = "bide.pocketbi.dataset.v1";
const MAX_BYTES = 20 * 1024 * 1024;
const MAX_COLUMNS = 2_000;
const ALLOWED_ORIGINS = new Set([
  "https://pocket-clean.vercel.app",
  "https://pocketbi.app",
]);

type PocketBIDatasetMessage = {
  type: "pocketbi:bide:dataset";
  version: 1;
  fileName: string;
  csv: string;
  manifest?: unknown;
};

type CsvFacts = {
  columns: string[];
  rowCount: number;
};

type ManifestDecision = {
  manifest: PocketBIHandoffManifest | null;
  warning: string;
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

function csvFacts(csv: string): CsvFacts {
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: "greedy",
  });
  const columns = (parsed.meta.fields || [])
    .map((header) => String(header ?? ""))
    .filter(Boolean)
    .slice(0, MAX_COLUMNS);
  return { columns, rowCount: parsed.data.length };
}

function sameColumns(actual: string[], expected: { name: string }[]): boolean {
  return actual.length === expected.length
    && actual.every((column, index) => column === expected[index]?.name);
}

async function sha256Hex(value: string): Promise<string> {
  if (!globalThis.crypto?.subtle) return "";
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function decideManifest(
  value: unknown,
  facts: CsvFacts,
  bytes: number,
  fileName: string,
  csv: string,
): Promise<ManifestDecision> {
  if (value == null) return { manifest: null, warning: "" };

  const validation = validatePocketBIHandoffV1(value);
  if (!validation.ok) {
    return {
      manifest: null,
      warning: `PocketBI metadata was not accepted (${validation.errors.join(" ")}) The CSV was imported normally instead.`,
    };
  }

  const manifest = normalizePocketBIHandoffV1(value);
  if (!manifest) {
    return { manifest: null, warning: "PocketBI metadata could not be normalized. The CSV was imported normally instead." };
  }

  const mismatches: string[] = [];
  if (manifest.payload.format !== "csv") mismatches.push(`payload format is ${manifest.payload.format}, not csv`);
  if (manifest.payload.fileName && safeFileName(manifest.payload.fileName) !== safeFileName(fileName)) {
    mismatches.push("payload filename does not match the transferred file");
  }
  if (manifest.payload.byteCount > 0 && manifest.payload.byteCount !== bytes) {
    mismatches.push(`declared byte count ${manifest.payload.byteCount} does not match ${bytes}`);
  }
  if (manifest.dataset.rowCount !== facts.rowCount) {
    mismatches.push(`declared row count ${manifest.dataset.rowCount} does not match ${facts.rowCount}`);
  }
  if (manifest.dataset.columnCount !== facts.columns.length) {
    mismatches.push(`declared column count ${manifest.dataset.columnCount} does not match ${facts.columns.length}`);
  }
  if (!sameColumns(facts.columns, manifest.dataset.schema.columns)) {
    mismatches.push("declared schema columns do not match the CSV header");
  }

  const declaredSha = manifest.payload.sha256.trim().toLowerCase();
  if (declaredSha) {
    if (!/^[0-9a-f]{64}$/.test(declaredSha)) {
      mismatches.push("declared payload SHA-256 is invalid");
    } else {
      const actualSha = await sha256Hex(csv);
      if (!actualSha) {
        mismatches.push("browser could not verify the declared payload SHA-256");
      } else if (actualSha !== declaredSha) {
        mismatches.push("declared payload SHA-256 does not match the transferred CSV");
      }
    }
  }

  if (mismatches.length) {
    return {
      manifest: null,
      warning: `PocketBI metadata did not match the transferred CSV (${mismatches.join("; ")}). The CSV was imported normally instead.`,
    };
  }

  return {
    manifest: appendBIDELineage(manifest, "bide.open", {
      transport: "browser-message",
      fileName: safeFileName(fileName),
    }),
    warning: "",
  };
}

export default function PocketBIHandoff() {
  const navigate = useNavigate();
  const { saveFile, isReady } = useIndexedDB();
  const [status, setStatus] = useState("Preparing BIDE workspace…");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!isReady) return;

    const announceReady = () => {
      if (!window.opener || window.opener.closed) return;
      for (const origin of ALLOWED_ORIGINS) {
        window.opener.postMessage({
          type: "pocketbi:bide:ready",
          version: 1,
          handoffFormats: ["pocketbi-handoff@1"],
        }, origin);
      }
    };

    const onMessage = async (event: MessageEvent) => {
      if (!window.opener || event.source !== window.opener) return;
      if (!ALLOWED_ORIGINS.has(event.origin) || !isDatasetMessage(event.data)) return;
      setError("");
      setNotice("");
      setStatus("Saving PocketBI dataset into BIDE…");

      try {
        const bytes = new TextEncoder().encode(event.data.csv).byteLength;
        if (!bytes || bytes > MAX_BYTES) throw new Error("PocketBI handoff must be between 1 byte and 20 MB.");
        const facts = csvFacts(event.data.csv);
        if (!facts.columns.length) throw new Error("The PocketBI handoff does not contain a usable CSV header.");

        const manifestDecision = await decideManifest(
          event.data.manifest,
          facts,
          bytes,
          event.data.fileName,
          event.data.csv,
        );
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
          columns: facts.columns,
          source: "pocketbi",
          sourceApp: manifestDecision.manifest?.source.app || "pocketbi",
          datasetId: manifestDecision.manifest?.dataset.id || "",
          datasetRevision: manifestDecision.manifest?.dataset.revision ?? 0,
          parentId: manifestDecision.manifest?.dataset.parentId || "",
          workspaceId: manifestDecision.manifest?.dataset.workspaceId || "",
          lineage: manifestDecision.manifest?.lineage || [],
          verification: manifestDecision.manifest?.verification || null,
          manifest: manifestDecision.manifest,
          receivedAt: new Date().toISOString(),
        }));
        localStorage.setItem("bide_visited", "true");

        window.opener.postMessage({
          type: "pocketbi:bide:accepted",
          version: 1,
          fileId: id,
          fileName: name,
          columns: facts.columns,
          rowCount: facts.rowCount,
          manifestAccepted: Boolean(manifestDecision.manifest),
          datasetId: manifestDecision.manifest?.dataset.id || "",
          warning: manifestDecision.warning,
        }, event.origin);

        if (manifestDecision.warning) setNotice(manifestDecision.warning);
        const identity = manifestDecision.manifest?.dataset.id
          ? ` Dataset ${manifestDecision.manifest.dataset.id} lineage is attached.`
          : "";
        setStatus(`${name} is ready in BIDE.${identity}`);
        window.setTimeout(() => navigate(`/ide?source=pocketbi&file=${encodeURIComponent(name)}`, { replace: true }), 450);
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
      {notice && <p style={{marginTop:14,padding:12,border:"1px solid #92400e",borderRadius:10,background:"rgba(146,64,14,.14)",color:"#fde68a"}}>{notice}</p>}
      {error && <p style={{marginTop:14,padding:12,border:"1px solid #7f1d1d",borderRadius:10,background:"rgba(127,29,29,.15)",color:"#fecaca"}}>{error}</p>}
      <p style={{margin:"18px 0 0",fontSize:12,color:"#71717a"}}>The CSV is transferred directly from the trusted PocketBI opener and saved into BIDE's existing local workspace store. Valid Handoff V1 identity and lineage travel with it; the dataset is never placed in the URL.</p>
    </section>
  </main>;
}
