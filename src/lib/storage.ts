import { mkdir, writeFile, unlink } from "fs/promises";
import { existsSync } from "fs";
import { join, extname } from "path";
import { randomUUID } from "crypto";

const UPLOADS_DIR = process.env.UPLOADS_DIR || "./uploads";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_FOLDERS = new Set([
  "avatars",
  "banners",
  "checkins",
  "comments",
  "posts",
]);

export class StorageError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function validateFolder(folder: string) {
  if (!ALLOWED_FOLDERS.has(folder)) {
    throw new StorageError(`Pasta inválida: ${folder}`);
  }
}

function validateMimeType(mimeType: string) {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new StorageError("Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.");
  }
}

function validateSize(size: number) {
  if (size > MAX_FILE_SIZE) {
    throw new StorageError("Arquivo muito grande. Máximo 5 MB.");
  }
}

function safeExtension(filename: string, mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };
  const ext = extname(filename).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) {
    return ext;
  }
  return mimeToExt[mimeType] || ".jpg";
}

export const storage = {
  async uploadFile(
    buffer: Buffer,
    originalFilename: string,
    mimeType: string,
    folder: string
  ): Promise<string> {
    validateFolder(folder);
    validateMimeType(mimeType);
    validateSize(buffer.length);

    const ext = safeExtension(originalFilename, mimeType);
    const uniqueName = `${randomUUID()}${ext}`;
    const dirPath = join(UPLOADS_DIR, folder);

    if (!existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true });
    }

    const filePath = join(dirPath, uniqueName);
    await writeFile(filePath, buffer);

    return `/api/uploads/${folder}/${uniqueName}`;
  },

  async deleteFile(urlPath: string): Promise<void> {
    // urlPath is like /api/uploads/avatars/uuid.jpg
    const relativePath = urlPath.replace("/api/uploads/", "");
    const filePath = join(UPLOADS_DIR, relativePath);
    try {
      await unlink(filePath);
    } catch {
      // File may already be deleted — ignore
    }
  },
};
