import { NextRequest } from "next/server";
import { readFile, stat } from "fs/promises";
import { join, extname } from "path";

const UPLOADS_DIR = process.env.UPLOADS_DIR || "./uploads";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;

  // Prevent directory traversal
  if (segments.some((s) => s.includes("..") || s.includes("~"))) {
    return new Response("Não encontrado", { status: 404 });
  }

  const relativePath = segments.join("/");
  const filePath = join(UPLOADS_DIR, relativePath);

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return new Response("Não encontrado", { status: 404 });
    }

    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext];
    if (!contentType) {
      return new Response("Tipo não suportado", { status: 415 });
    }

    const fileBuffer = await readFile(filePath);

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(fileBuffer.length),
      },
    });
  } catch {
    return new Response("Não encontrado", { status: 404 });
  }
}
