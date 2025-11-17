
export interface ScriptResult {
  script: string;
  keywords: string[];
}

export interface VideoGenerationResult {
  videoUrl: string;
  audioUrl: string;
  script: string;
  images: string[];
}

export enum AspectRatio {
  Portrait = '9:16',
  Landscape = '16:9',
}
