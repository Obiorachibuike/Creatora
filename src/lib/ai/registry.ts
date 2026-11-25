import { db } from "@/db";
import { aiModels, aiProviders } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { mockProvider, type AIProvider, type AiCapability } from "./providers";

let providerCache: Promise<AIProvider[]> | null = null;

/**
 * Provider-independent registry (Part 5). Builds adapters from the ai_providers
 * + ai_models tables (Part 7), with the mock provider as an offline dev
 * fallback.
 */
export async function getProviders(): Promise<AIProvider[]> {
  providerCache ??= (async () => {
    try {
      const rows = await db.select().from(aiProviders);
      const adapters: AIProvider[] = rows
        .filter((r) => r.isActive)
        .map((r) => createAdapter(r));
      adapters.push(mockProvider);
      return adapters;
    } catch {
      // Database unavailable (no DATABASE_URL): dev/test mode uses the mock provider.
      return [mockProvider];
    }
  })();
  return providerCache;
}

/** Maps a provider DB row to the AIProvider interface. Future adapters go here. */
function createAdapter(providerRow: {
  id: string;
  slug: string;
  name: string;
  type: string;
  baseUrl: string | null;
}): AIProvider {
  const adapter: AIProvider = {
    id: providerRow.id,
    slug: providerRow.slug,
    name: providerRow.name,
    type: providerRow.type,
    capabilities: [],
    checkHealth: async () => {
      try {
        const res = await fetch(providerRow.baseUrl ?? "", { method: "HEAD" });
        return res.ok;
      } catch {
        return false;
      }
    },
    generateImage: async () => {
      throw new Error(
        `Image generation is not implemented for provider "${providerRow.slug}" yet.`
      );
    },
    generateVideo: async () => {
      throw new Error(
        `Video generation is not implemented for provider "${providerRow.slug}" yet.`
      );
    },
    generateAudio: async () => {
      throw new Error(
        `Audio generation is not implemented for provider "${providerRow.slug}" yet.`
      );
    },
  };
  return adapter;
}

export async function getModels(
  capability: AiCapability
): Promise<
  Array<{ provider: AIProvider; modelName: string; displayName: string; priority: number }>
> {
  const providers = await getProviders();
  const rows = await db
    .select()
    .from(aiModels)
    .where(eq(aiModels.status, "active"));
  const byId = new Map(providers.map((p) => [p.id, p]));
  return rows
    .map((m) => {
      const provider = byId.get(m.providerId);
      const caps = m.capabilities as AiCapability[];
      return provider && caps.includes(capability)
        ? { provider, modelName: m.modelName, displayName: m.displayName, priority: m.priority }
        : null;
    })
    .filter(Boolean) as Array<{ provider: AIProvider; modelName: string; displayName: string; priority: number }>;
}

export async function getProvider(slug: string): Promise<AIProvider | null> {
  const providers = await getProviders();
  return providers.find((p) => p.slug === slug) ?? null;
}

export async function getFirstModelByCapability(capability: AiCapability) {
  const models = await getModels(capability);
  return models[0] ?? null;
}

export async function seedDefaultProviders() {
  const providers = await db.select().from(aiProviders);
  if (providers.length > 0) return;
  const [mockRow] = await db
    .insert(aiProviders)
    .values({
      id: "provider-mock",
      name: "Mock Provider",
      slug: "mock",
      type: "mock",
      status: "active",
      apiKeyEnvVar: "",
      isDefault: true,
      isActive: true,
    })
    .returning();
  await db.insert(aiModels).values({
    id: `model-${mockRow.id}-mock-1`,
    providerId: mockRow.id,
    modelName: "mock-1",
    displayName: "Mock Model (dev)",
    capabilities: ["text-to-image", "text-to-video", "image-to-video", "text-to-speech"],
    status: "active",
  });
  return mockRow;
}
