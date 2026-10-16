import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { moduleEntries, moduleFileVersions } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/permissions";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return new Response("Arquivo não encontrado.", { status: 404 });
  const db = getDb();
  const requestedVersion = Number(new URL(request.url).searchParams.get("version"));
  let fileData: Buffer | null = null;
  let fileName = "arquivo";
  let contentType = "application/octet-stream";
  if (Number.isInteger(requestedVersion) && requestedVersion > 0) {
    const [version] = await db.select().from(moduleFileVersions).where(and(eq(moduleFileVersions.entryId, id), eq(moduleFileVersions.version, requestedVersion))).limit(1);
    if (version) { fileData = version.fileData; fileName = version.fileName; contentType = version.contentType; }
  } else {
    const [row] = await db.select({ fileData: moduleEntries.fileData, metadata: moduleEntries.metadata }).from(moduleEntries).where(eq(moduleEntries.id, id)).limit(1);
    fileData = row?.fileData ?? null;
    fileName = typeof row?.metadata.fileName === "string" ? row.metadata.fileName : fileName;
    contentType = typeof row?.metadata.contentType === "string" ? row.metadata.contentType : contentType;
  }
  if (!fileData) return new Response("Arquivo não encontrado.", { status: 404 });
  const inlineRequested = new URL(request.url).searchParams.get("inline") === "1";
  const inlineAllowed = contentType === "application/pdf" || contentType.startsWith("image/") || contentType === "text/plain";
  const disposition = inlineRequested && inlineAllowed ? "inline" : "attachment";
  const asciiName = fileName.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  return new Response(new Uint8Array(fileData), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Content-Length": String(fileData.byteLength),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

