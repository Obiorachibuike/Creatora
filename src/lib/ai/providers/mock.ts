import type {
  AIProvider,
  AiCapability,
  AudioInput,
  ImageInput,
  MediaOutput,
  VideoInput,
} from "./base";

const ID_BASE = "https://placeholder.creatora.ai/mock";

/**
 * Development/test provider. It does not call out to a third-party API; it
 * returns deterministic placeholder URLs so the app can be demoed without
 * provider keys. Swap this provider out (see src/lib/ai/registry) in
 * production with real provider adapters behind environment-variable keys.
 */
export class MockProvider implements AIProvider {
  readonly id = "provider-mock";
  readonly slug = "mock";
  readonly name = "Mock (dev/test)";
  readonly type = "mock";
  readonly capabilities: AiCapability[] = [
    "text-to-image",
    "text-to-video",
    "image-to-video",
    "text-to-speech",
    "transcription",
  ];

  async checkHealth() {
    return true;
  }

  private mockOutput(kind: "image" | "video" | "audio", prompt: string): MediaOutput {
    const id = `mock-${kind}-${Math.random().toString(36).slice(2, 8)}`;
    return {
      url: `${ID_BASE}/${kind}/${id}?prompt=${encodeURIComponent(prompt)}`,
      provider: this.slug,
      model: "mock-1",
      metadata: { note: "placeholder output (dev mode)" },
      estimatedCost: kind === "video" ? 0.02 : kind === "audio" ? 0.01 : 0.005,
    };
  }

  async generateImage(input: ImageInput): Promise<MediaOutput> {
    return this.mockOutput("image", input.prompt);
  }

  async generateVideo(input: VideoInput): Promise<MediaOutput> {
    return this.mockOutput("video", input.prompt);
  }

  async generateAudio(input: AudioInput): Promise<MediaOutput> {
    return this.mockOutput("audio", input.text);
  }
}

export const mockProvider = new MockProvider();
