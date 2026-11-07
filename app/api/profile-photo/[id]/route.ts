import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { publicVisibility, users } from "@/lib/db/schema";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return new Response("Foto não encontrada.", { status: 404 });
  const db = getDb();
  const [settings, member] = await Promise.all([
    db.select({ showActiveMembers: publicVisibility.showActiveMembers }).from(publicVisibility).where(eq(publicVisibility.id, 1)).limit(1),
    db.select({ id: users.id, status: users.status, photo: users.profilePhotoData, contentType: users.profilePhotoType }).from(users).where(eq(users.id, id)).limit(1),
  ]);
  const row = member[0];
  if (!row?.photo) return new Response("Foto não encontrada.", { status: 404 });
  const publicImage = settings[0]?.showActiveMembers === true && row.status === "ACTIVE";
  if (!publicImage) {
    const session = await auth();
    if (!session?.user?.id) return new Response("Acesso restrito.", { status: 401 });
  }
  return new Response(new Uint8Array(row.photo), {
    headers: {
      "Content-Type": row.contentType || "application/octet-stream",
      "Content-Length": String(row.photo.byteLength),
      "Cache-Control": publicImage ? "public, max-age=300" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

