import React, { useState } from 'react';
import { generateScript, generateTTS, generateImages, generateVideo } from '../services/geminiService';
import { VideoGenerationResult, AspectRatio } from '../types';
import Loader from './Loader';

interface VideoGeneratorProps {
  apiKey: string | null;
  onInvalidApiKey: () => void;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ apiKey, onInvalidApiKey }) => {
  const [title, setTitle] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.Portrait);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VideoGenerationResult | null>(null);

  const handleGenerate = async () => {
    if (!title.trim()) {
      setError('Please enter a title for the video.');
      return;
    }

    if (!apiKey) {
        setError('An API Key is required. Please set one in the section above.');
        return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Step 1: Generate Script
      setStatusMessage('Crafting a viral script...');
      const scriptResult = await generateScript(title, apiKey);
      
      // Step 2: Generate Audio
      setStatusMessage('Recording the voice-over...');
      const audioData = await generateTTS(scriptResult.script, apiKey);
      const audioUrl = URL.createObjectURL(new Blob([audioData], { type: 'audio/mp3' }));

      // Step 3: Generate Images
      setStatusMessage('Creating visual assets...');
      const imageUrls = await generateImages(scriptResult.keywords, aspectRatio, apiKey);
      
      // Step 4: Generate Video
      setStatusMessage('Editing the final video... This may take a few minutes.');
      const videoData = await generateVideo(scriptResult.script, imageUrls[0], aspectRatio, apiKey);
      const videoUrl = URL.createObjectURL(new Blob([videoData], { type: 'video/mp4' }));

      setResult({
        videoUrl,
        audioUrl,
        script: scriptResult.script,
        images: imageUrls
      });
    } catch (e: any) {
      console.error(e);
       if (e.message.includes('API key not valid') || e.message.includes('permission') || e.message.includes('entity was not found')) {
          setError('The provided API Key is invalid or does not have the required permissions. The key has been cleared.');
          onInvalidApiKey();
      } else {
          setError(`An error occurred: ${e.message}`);
      }
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
            Curiosity Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='e.g., "The 5 Rarest Items in Roblox"'
            className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm px-4 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Aspect Ratio</label>
          <div className="flex items-center space-x-4 bg-gray-700 border border-gray-600 rounded-md p-2">
            {[AspectRatio.Portrait, AspectRatio.Landscape].map(ratio => (
              <button 
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                disabled={isLoading}
                className={`w-full py-1 rounded ${aspectRatio === ratio ? 'bg-indigo-600' : 'bg-gray-600 hover:bg-gray-500'}`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button
        onClick={handleGenerate}
        disabled={isLoading || !title.trim() || !apiKey}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
      >
        {isLoading ? 'Generating...' : 'Generate Video'}
      </button>

      {error && <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">{error}</div>}
      {isLoading && <Loader message={statusMessage} />}
      
      {result && (
        <div className="space-y-6 animate-fade-in">
          <h2 className="text-2xl font-bold text-center">Your Video is Ready!</h2>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <div className="aspect-w-9 aspect-h-16" style={{aspectRatio: aspectRatio === AspectRatio.Portrait ? '9/16' : '16/9'}}>
                <video controls src={result.videoUrl} className="w-full h-full rounded-lg bg-black" />
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Narration</h3>
                <audio controls src={result.audioUrl} className="w-full" />
              </div>
              <a href={result.videoUrl} download="roblox-curiosity.mp4" className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center">Download Video</a>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Generated Script</h3>
                <p className="bg-gray-700 p-4 rounded-md text-gray-300 text-sm whitespace-pre-wrap">{result.script}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Generated Images</h3>
                <div className="grid grid-cols-2 gap-2">
                  {result.images.map((img, index) => (
                    <img key={index} src={img} alt={`Generated visual ${index + 1}`} className="rounded-md w-full h-auto object-cover" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoGenerator;