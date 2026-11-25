import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assets } from "@/drizzle/schema";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

export default async function AiImagePage() {
  const images = await db
    .select()
    .from(assets)
    .where(eq(assets.kind, "image"))
    .limit(50);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold">AI Image Studio</h1>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {images.map((a) => (
          <Card key={a.id}>
            {a.url ? <img src={a.url} alt={a.mimeType ?? "image"} className="h-40 w-full rounded-lg object-cover" /> : <div className="h-40" />}
            <div className="mt-3">
              <p className="truncate text-sm font-medium">{a.createdAt.toLocaleDateString("en-US")}</p>
              <p className="text-xs text-(--foreground-muted)">
                {(a.width && a.height) ? `${a.width}×${a.height}` : "—"}
              </p>
            </div>
          </Card>
        ))}
        {images.length === 0 && <Card className="col-span-full text-sm text-(--foreground-muted)">No images yet.</Card>}
      </div>
    </div>
  );
}
