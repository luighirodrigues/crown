import { requireAuth, handleAuthError } from "@/lib/auth/rbac";
import { storage, StorageError } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    await requireAuth();

    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder");

    if (!(file instanceof File)) {
      return Response.json({ error: "Arquivo é obrigatório" }, { status: 400 });
    }

    if (typeof folder !== "string") {
      return Response.json({ error: "Pasta é obrigatória" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await storage.uploadFile(buffer, file.name, file.type, folder);

    return Response.json({ url });
  } catch (error) {
    if (error instanceof StorageError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return handleAuthError(error);
  }
}
