import Papa from "papaparse";
import {
  POCKETBI_HANDOFF_FORMAT,
  POCKETBI_HANDOFF_VERSION,
  normalizePocketBIHandoffV1,
  pocketBISchemaFingerprint,
  type PocketBIHandoffManifest,
} from "@/lib/pocketBIHandoffV1";

const POCKETBI_ORIGIN = "https://pocketbi.app";
const POCKETBI_HANDOFF_URL = `${POCKETBI_ORIGIN}/app?source=bide`;
const CONTEXT_KEY = "bide.pocketbi.dataset.v1";
const HANDSHAKE_TIMEOUT_MS = 12_000;
const ACCEPT_TIMEOUT_MS = 12_000;
const MAX_BYTES = 20 * 1024 * 1024;

type DatasetContext = {
  version?: number;
  name?: string;
  sourceApp?: string;
  datasetId?: string;
  datasetRevision?: number;
  parentId?: string;
  workspaceId?: string;
  lineage?: unknown[];
  verification?: unknown;
  manifest?: unknown;
};

type PocketBIMessage = {
  type?: string;
  version?: number;
  fileName?: string;
  rowCount?: number;
  columnCount?: number;
  manifestAccepted?: boolean;
  datasetId?: string;
  warning?: string;
  handoffFormats?: unknown[];
  reason?: string;
  error?: string;
};

export type PocketBIOutboundResult = {
  fileName: string;
  rowCount: number;
  columnCount: number;
  manifestAccepted: boolean;
  datasetId: string;
  warning: string;
};

function readContext(): DatasetContext | null {
  try {
    const raw = sessionStorage.getItem(CONTEXT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as DatasetContext : null;
  } catch {
    return null;
  }
}

function safeStem(value: string): string {
  return value
    .replace(/\.csv$/i, "")
    .replace(/[^A-Za-z0-9 _-]+/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase() || "bide-result";
}

function parentManifestFromContext(): PocketBIHandoffManifest | null {
  const context = readContext();
  return normalizePocketBIHandoffV1(context?.manifest);
}

function createResultManifest({
  title,
  fileName,
  csv,
  headers,
  rowCount,
}: {
  title: string;
  fileName: string;
  csv: string;
  headers: string[];
  rowCount: number;
}): PocketBIHandoffManifest {
  const parent = parentManifestFromContext();
  const context = readContext();
  const columns = headers.map((name) => ({ name, type: "unknown" }));
  const createdAt = new Date().toISOString();
  const sourceName = String(context?.name || "");
  const isOriginalSource = Boolean(parent && sourceName && title === sourceName);
  const datasetId = isOriginalSource && parent
    ? parent.dataset.id
    : `dataset-${crypto.randomUUID()}`;
  const parentId = isOriginalSource
    ? parent?.dataset.parentId || ""
    : parent?.dataset.id || context?.datasetId || "";
  const revision = isOriginalSource && parent
    ? parent.dataset.revision
    : 0;
  const parentLineage = parent?.lineage || [];
  const sourceVerification = parent?.verification || null;

  return {
    format: POCKETBI_HANDOFF_FORMAT,
    version: POCKETBI_HANDOFF_VERSION,
    handoffId: `handoff-${crypto.randomUUID()}`,
    createdAt,
    source: {
      app: "bide",
      surface: "dataset-viewer",
      appVersion: "",
    },
    destination: {
      app: "pocketbi",
      action: "continue",
    },
    dataset: {
      id: datasetId,
      parentId,
      workspaceId: parent?.dataset.workspaceId || context?.workspaceId || "",
      name: title || safeStem(fileName),
      sourceFileName: parent?.dataset.sourceFileName || "",
      revision,
      rowCount,
      columnCount: columns.length,
      schema: {
        columns,
        fingerprint: pocketBISchemaFingerprint(columns),
      },
    },
    payload: {
      kind: "dataset",
      transport: "browser-message",
      format: "csv",
      fileName,
      byteCount: new TextEncoder().encode(csv).byteLength,
      sha256: "",
    },
    lineage: [
      ...parentLineage,
      {
        operation: isOriginalSource ? "bide.return_source" : "bide.dataset_result",
        app: "bide",
        at: createdAt,
        metadata: {
          title,
          rowCount,
          columnCount: headers.length,
          ...(sourceVerification ? { sourceVerification } : {}),
        },
      },
    ].slice(-256),
    // A bIDE-derived result is not automatically covered by upstream cleaning
    // verification. Keep the source verification in lineage metadata instead.
    verification: isOriginalSource && parent
      ? parent.verification
      : { status: "unverified", manifestId: "", scope: "" },
    compatibility: {
      plainFileFallback: true,
      fallbackFileName: fileName,
    },
  };
}

function isTrustedPocketBIMessage(event: MessageEvent, target: Window): boolean {
  return event.origin === POCKETBI_ORIGIN && event.source === target;
}

function waitForMessage(target: Window, types: string[], timeoutMs: number): Promise<PocketBIMessage> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      reject(new Error("PocketBI did not respond to the dataset handoff."));
    }, timeoutMs);

    function onMessage(event: MessageEvent) {
      if (!isTrustedPocketBIMessage(event, target)) return;
      const data = event.data as PocketBIMessage;
      if (!data || data.version !== 1 || !types.includes(String(data.type || ""))) return;
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      if (data.type === "bide:pocketbi:error") {
        reject(new Error(data.error || "PocketBI rejected the dataset handoff."));
        return;
      }
      if (data.type === "bide:pocketbi:cancelled") {
        reject(new Error("PocketBI kept the dataset that was already open."));
        return;
      }
      resolve(data);
    }

    window.addEventListener("message", onMessage);
  });
}

export async function sendDatasetToPocketBI({
  title,
  headers,
  data,
}: {
  title: string;
  headers: string[];
  data: string[][];
}): Promise<PocketBIOutboundResult> {
  const fileName = `${safeStem(title)}.csv`;
  const csv = Papa.unparse([headers, ...data]);
  const bytes = new TextEncoder().encode(csv).byteLength;
  if (!bytes || bytes > MAX_BYTES) {
    throw new Error("Direct PocketBI handoff supports datasets up to 20 MB. Export the CSV instead for larger results.");
  }

  const target = window.open(POCKETBI_HANDOFF_URL, "bide-pocketbi");
  if (!target) throw new Error("Your browser blocked the PocketBI window. Allow pop-ups for bIDE and try again.");

  const readyPromise = waitForMessage(target, ["bide:pocketbi:ready", "bide:pocketbi:error"], HANDSHAKE_TIMEOUT_MS);
  try {
    const ready = await readyPromise;
    if (target.closed) throw new Error("The PocketBI window was closed before the result could be sent.");
    const supportsV1 = Array.isArray(ready.handoffFormats) && ready.handoffFormats.includes("pocketbi-handoff@1");
    const manifest = supportsV1
      ? createResultManifest({ title, fileName, csv, headers, rowCount: data.length })
      : undefined;

    const acceptedPromise = waitForMessage(
      target,
      ["bide:pocketbi:accepted", "bide:pocketbi:cancelled", "bide:pocketbi:error"],
      ACCEPT_TIMEOUT_MS,
    );
    target.postMessage({
      type: "bide:pocketbi:dataset",
      version: 1,
      fileName,
      csv,
      ...(manifest ? { manifest } : {}),
    }, POCKETBI_ORIGIN);

    const response = await acceptedPromise;
    return {
      fileName: response.fileName || fileName,
      rowCount: Number.isInteger(response.rowCount) ? Number(response.rowCount) : data.length,
      columnCount: Number.isInteger(response.columnCount) ? Number(response.columnCount) : headers.length,
      manifestAccepted: response.manifestAccepted === true,
      datasetId: response.datasetId || "",
      warning: response.warning || "",
    };
  } catch (error) {
    if (!target.closed) {
      try { target.postMessage({ type: "bide:pocketbi:source-error", version: 1 }, POCKETBI_ORIGIN); } catch {}
    }
    throw error;
  }
}
