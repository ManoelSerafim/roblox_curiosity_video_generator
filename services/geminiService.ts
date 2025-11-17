// FIX: Import `Modality` to use in the text-to-speech request config.
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { ScriptResult, AspectRatio } from '../types';
import { decode } from '../utils/audioUtils';

const SCRIPT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    script: {
      type: Type.STRING,
      description: 'The script text, between 100 and 150 words.',
    },
    keywords: {
      type: Type.ARRAY,
      description: 'An array of 5 to 7 main keywords from the script.',
      items: { type: Type.STRING },
    },
  },
  required: ['script', 'keywords'],
};

export async function generateScript(title: string): Promise<ScriptResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `Generate a script for a short video about: "${title}"`,
        config: {
            systemInstruction: `You are an expert in 'Roblox' and a viral video scriptwriter for TikTok and Reels. Your task is to create a trivia script about Roblox based on the user's title.
- The tone must be mysterious, intriguing, and direct.
- The script must be between 100 and 150 words.
- Do not include greetings (like 'Hello everyone') or farewells/CTAs (like 'like and follow'). Get straight to the point.
- Use short, impactful sentences.
- You must return the response in the specified JSON format.`,
            responseMimeType: 'application/json',
            responseSchema: SCRIPT_SCHEMA,
            thinkingConfig: { thinkingBudget: 32768 }
        },
    });

    const jsonText = response.text;
    try {
        return JSON.parse(jsonText) as ScriptResult;
    } catch (e) {
        console.error("Failed to parse script JSON:", jsonText);
        throw new Error("Could not understand the model's response for the script.");
    }
}

export async function generateTTS(script: string): Promise<Uint8Array> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: script }] }],
        config: {
            // FIX: Replaced `responseMimeType` with `responseModalities` and added a `speechConfig` as required by the TTS model.
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error('No audio data received from TTS API.');
    }
    return decode(base64Audio);
}

export async function generateImages(keywords: string[], aspectRatio: AspectRatio): Promise<string[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const imagePrompts = keywords.slice(0, 4).map(keyword => 
        `High-quality, vertical Roblox in-game screenshot or gameplay footage related to: "${keyword}". Cinematic, detailed.`
    );

    const imagePromises = imagePrompts.map(prompt => 
        ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: aspectRatio,
            },
        })
    );

    const responses = await Promise.all(imagePromises);
    return responses.map(response => {
        const base64Image = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64Image}`;
    });
}

async function fileToBase64(fileUrl: string): Promise<string> {
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export async function generateVideo(
    script: string, 
    startImageUrl: string, 
    aspectRatio: AspectRatio, 
    onError: (error: Error) => void
): Promise<ArrayBuffer> {
    // A new instance is created here to ensure it uses the latest selected API key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const base64Image = await fileToBase64(startImageUrl);

    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `A short, cinematic video about Roblox, based on this script: "${script}"`,
        image: {
            imageBytes: base64Image,
            mimeType: 'image/jpeg',
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio,
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        try {
             operation = await ai.operations.getVideosOperation({ operation: operation });
        } catch(e: any) {
            onError(e);
            throw e;
        }
    }

    if (operation.error) {
        throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error('Video generation finished but no download link was provided.');
    }

    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) {
        throw new Error('Failed to download the generated video.');
    }
    return videoResponse.arrayBuffer();
}