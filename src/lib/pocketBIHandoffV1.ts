export const POCKETBI_HANDOFF_FORMAT = "pocketbi-handoff" as const;
export const POCKETBI_HANDOFF_VERSION = 1 as const;

const MAX_LINEAGE_STEPS = 256;
const MAX_COLUMNS = 4096;

type UnknownRecord = Record<string, unknown>;

export type PocketBIHandoffColumn = {
  name: string;
  type: string;
};

export type PocketBIHandoffLineageStep = {
  operation: string;
  app: string;
  at: string;
  metadata: Record<string, unknown>;
};

export type PocketBIHandoffManifest = {
  format: typeof POCKETBI_HANDOFF_FORMAT;
  version: typeof POCKETBI_HANDOFF_VERSION;
  handoffId: string;
  createdAt: string;
  source: {
    app: string;
    surface: string;
    appVersion: string;
  };
  destination: {
    app: string;
    action: string;
  };
  dataset: {
    id: string;
    parentId: string;
    workspaceId: string;
    name: string;
    sourceFileName: string;
    revision: number;
    rowCount: number;
    columnCount: number;
    schema: {
      columns: PocketBIHandoffColumn[];
      fingerprint: string;
    };
  };
  payload: {
    kind: string;
    transport: string;
    format: string;
    fileName: string;
    byteCount: number;
    sha256: string;
  };
  lineage: PocketBIHandoffLineageStep[];
  verification: {
    status: string;
    manifestId: string;
    scope: string;
  };
  compatibility: {
    plainFileFallback: boolean;
    fallbackFileName: string;
  };
};

export type PocketBIHandoffValidation = {
  ok: boolean;
  errors: string[];
};

function record(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as UnknownRecord
    : {};
}

function text(value: unknown, fallback = ""): string {
  const normalized = String(value == null ? "" : value).trim();
  return normalized || fallback;
}

function nonNegativeInteger(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
}

function normalizeColumns(columns: unknown): PocketBIHandoffColumn[] {
  if (!Array.isArray(columns)) return [];
  return columns.slice(0, MAX_COLUMNS).map((column, index) => {
    if (typeof column === "string") {
      return { name: text(column, `column_${index + 1}`), type: "unknown" };
    }
    const candidate = record(column);
    return {
      name: text(candidate.name, `column_${index + 1}`),
      type: text(candidate.type, "unknown"),
    };
  });
}

// Mirrors PocketBI Handoff V1. This is a deterministic drift hint, not a security hash.
export function pocketBISchemaFingerprint(columns: unknown): string {
  const canonical = normalizeColumns(columns)
    .map((column) => `${column.name}\u001f${column.type}`)
    .join("\u001e");
  let hash = 0x811c9dc5;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `fnv1a32-${hash.toString(16).padStart(8, "0")}`;
}

export function isPocketBIHandoffV1(value: unknown): value is PocketBIHandoffManifest {
  const candidate = record(value);
  return candidate.format === POCKETBI_HANDOFF_FORMAT
    && candidate.version === POCKETBI_HANDOFF_VERSION;
}

export function validatePocketBIHandoffV1(value: unknown): PocketBIHandoffValidation {
  const manifest = record(value);
  const dataset = record(manifest.dataset);
  const schema = record(dataset.schema);
  const payload = record(manifest.payload);
  const source = record(manifest.source);
  const errors: string[] = [];

  if (manifest.format !== POCKETBI_HANDOFF_FORMAT) errors.push(`format must equal ${POCKETBI_HANDOFF_FORMAT}.`);
  if (manifest.version !== POCKETBI_HANDOFF_VERSION) errors.push(`version must equal ${POCKETBI_HANDOFF_VERSION}.`);
  if (!text(manifest.handoffId)) errors.push("handoffId is required.");
  if (!text(source.app)) errors.push("source.app is required.");
  if (!text(dataset.id)) errors.push("dataset.id is required.");
  if (!Number.isInteger(dataset.revision) || Number(dataset.revision) < 0) errors.push("dataset.revision must be a non-negative integer.");
  if (!Number.isInteger(dataset.rowCount) || Number(dataset.rowCount) < 0) errors.push("dataset.rowCount must be a non-negative integer.");
  if (!Number.isInteger(dataset.columnCount) || Number(dataset.columnCount) < 0) errors.push("dataset.columnCount must be a non-negative integer.");
  if (!Array.isArray(schema.columns)) errors.push("dataset.schema.columns must be an array.");
  if (!text(schema.fingerprint)) errors.push("dataset.schema.fingerprint is required.");
  if (!text(payload.transport)) errors.push("payload.transport is required.");
  if (!text(payload.format)) errors.push("payload.format is required.");
  if (payload.transport === "sidecar-file" && !text(payload.fileName)) errors.push("payload.fileName is required for sidecar-file transport.");
  if (!Array.isArray(manifest.lineage)) errors.push("lineage must be an array.");

  const columns = normalizeColumns(schema.columns);
  if (columns.length > MAX_COLUMNS) errors.push(`dataset.schema.columns must contain at most ${MAX_COLUMNS} columns.`);
  if (Number.isInteger(dataset.columnCount) && Number(dataset.columnCount) !== columns.length) {
    errors.push("dataset.columnCount must match dataset.schema.columns length.");
  }
  if (columns.length && text(schema.fingerprint) && schema.fingerprint !== pocketBISchemaFingerprint(columns)) {
    errors.push("dataset.schema.fingerprint does not match dataset.schema.columns.");
  }
  if (Array.isArray(manifest.lineage) && manifest.lineage.length > MAX_LINEAGE_STEPS) {
    errors.push(`lineage must contain at most ${MAX_LINEAGE_STEPS} steps.`);
  }

  return { ok: errors.length === 0, errors };
}

export function normalizePocketBIHandoffV1(value: unknown): PocketBIHandoffManifest | null {
  const validation = validatePocketBIHandoffV1(value);
  if (!validation.ok) return null;

  const input = record(value);
  const source = record(input.source);
  const destination = record(input.destination);
  const dataset = record(input.dataset);
  const schema = record(dataset.schema);
  const payload = record(input.payload);
  const verification = record(input.verification);
  const compatibility = record(input.compatibility);
  const columns = normalizeColumns(schema.columns);
  const sourceApp = text(source.app);
  const lineage = (Array.isArray(input.lineage) ? input.lineage : []).map((step) => {
    const candidate = record(step);
    return {
      operation: text(candidate.operation, "unknown"),
      app: text(candidate.app, sourceApp || "unknown"),
      at: text(candidate.at),
      metadata: record(candidate.metadata),
    };
  });

  return {
    format: POCKETBI_HANDOFF_FORMAT,
    version: POCKETBI_HANDOFF_VERSION,
    handoffId: text(input.handoffId),
    createdAt: text(input.createdAt),
    source: {
      app: sourceApp,
      surface: text(source.surface, "unknown"),
      appVersion: text(source.appVersion),
    },
    destination: {
      app: text(destination.app),
      action: text(destination.action, "continue"),
    },
    dataset: {
      id: text(dataset.id),
      parentId: text(dataset.parentId),
      workspaceId: text(dataset.workspaceId),
      name: text(dataset.name, text(dataset.sourceFileName, "Untitled dataset")),
      sourceFileName: text(dataset.sourceFileName),
      revision: nonNegativeInteger(dataset.revision),
      rowCount: nonNegativeInteger(dataset.rowCount),
      columnCount: columns.length,
      schema: {
        columns,
        fingerprint: text(schema.fingerprint),
      },
    },
    payload: {
      kind: text(payload.kind, "dataset"),
      transport: text(payload.transport, "sidecar-file"),
      format: text(payload.format, "csv").toLowerCase(),
      fileName: text(payload.fileName),
      byteCount: nonNegativeInteger(payload.byteCount),
      sha256: text(payload.sha256),
    },
    lineage,
    verification: {
      status: text(verification.status, "unverified"),
      manifestId: text(verification.manifestId),
      scope: text(verification.scope),
    },
    compatibility: {
      plainFileFallback: compatibility.plainFileFallback !== false,
      fallbackFileName: text(compatibility.fallbackFileName, text(payload.fileName)),
    },
  };
}

export function appendBIDELineage(
  manifest: PocketBIHandoffManifest,
  operation: string,
  metadata: Record<string, unknown> = {},
): PocketBIHandoffManifest {
  return {
    ...manifest,
    lineage: [
      ...manifest.lineage,
      {
        operation: text(operation, "bide.open"),
        app: "bide",
        at: new Date().toISOString(),
        metadata,
      },
    ].slice(-MAX_LINEAGE_STEPS),
  };
}
