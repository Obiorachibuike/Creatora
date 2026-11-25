export type AiCapability =
  // image
  | "text-to-image"
  | "image-to-image"
  | "image-editing"
  | "background-removal"
  | "object-replacement"
  | "image-enhancement"
  | "product-photography"
  // video
  | "text-to-video"
  | "image-to-video"
  | "video-to-video"
  | "reference-based"
  | "first-frame"
  | "last-frame"
  | "multi-shot"
  | "scene-variation"
  // audio
  | "text-to-speech"
  | "voice-clone"
  | "transcription"
  | "subtitles"
  | "translation"
  | "dubbing"
  | "background-music"
  | "sound-effects"
  | "audio-enhancement";

export interface MediaOutput {
  /** Publicly reachable URL of the produced media. */
  url: string;
  provider: string;
  model: string;
  /** Provider-specific metadata (job ids, prompts, costs, ...). */
  metadata?: Record<string, unknown>;
  /** Estimated cost for this operation (units decided by provider). */
  estimatedCost?: number;
}

export interface ImageInput {
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  quality?: string;
  referenceImageUrls?: string[];
  styleImageUrl?: string;
  negativePrompt?: string;
}

export interface VideoInput {
  prompt: string;
  model?: string;
  resolution?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  duration?: number;
  firstFrameUrl?: string;
  lastFrameUrl?: string;
  referenceImageUrl?: string;
  seed?: number;
  numberOfVideos?: number; // scenes variation
}

export interface AudioInput {
  text: string;
  model?: string;
  voice?: string;
  language?: string;
  speed?: number;
  duration?: number;
  loopPoint?: number;
}

export interface AIProvider {
  id: string;
  slug: string;
  name: string;
  type: string;
  capabilities: AiCapability[];
  /** List of capabilities advertised by this provider (best effort). */
  /** Returns true when the provider reports a healthy connection. */
  checkHealth(): Promise<boolean>;
  generateImage(input: ImageInput): Promise<MediaOutput>;
  generateVideo(input: VideoInput): Promise<MediaOutput>;
  generateAudio(input: AudioInput): Promise<MediaOutput>;
}

export const DEFAULT_CAPABILITIES: AiCapability[] = [
  "text-to-image",
  "image-to-image",
  "text-to-video",
  "image-to-video",
  "text-to-speech",
  "transcription",
];
