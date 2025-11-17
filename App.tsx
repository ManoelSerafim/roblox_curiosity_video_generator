import React, { useState, useEffect, useCallback } from 'react';
import VideoGenerator from './components/VideoGenerator';
import AudioTranscriber from './components/AudioTranscriber';
import { VideoIcon } from './components/icons/VideoIcon';
import { SpeechToTextIcon } from './components/icons/SpeechToTextIcon';

type Tab = 'generator' | 'transcriber';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('generator');
  const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);

  const checkApiKey = useCallback(async () => {
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      try {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setApiKeySelected(hasKey);
      } catch (e) {
        console.error("Error checking for API key:", e);
        setApiKeySelected(false);
      }
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleSelectKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
        try {
            await window.aistudio.openSelectKey();
            // Assume success after dialog opens to avoid race conditions and re-check.
            setApiKeySelected(true);
        } catch(e) {
            console.error("Could not open API key selection dialog.", e);
        }
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'generator':
        return <VideoGenerator apiKeySelected={apiKeySelected} onApiKeyError={() => setApiKeySelected(false)} />;
      case 'transcriber':
        return <AudioTranscriber apiKeySelected={apiKeySelected} />;
      default:
        return null;
    }
  };

  const TabButton: React.FC<{tabName: Tab, label: string, icon: React.ReactNode}> = ({ tabName, label, icon }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
        activeTab === tabName
          ? 'bg-indigo-600 text-white'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  const ApiKeyPrompt = () => (
    <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-lg relative mb-6" role="alert">
        <strong className="font-bold">Action Required: </strong>
        <span className="block sm:inline">An API key is required to use all features of this application.</span>
        <div className="mt-2">
            <button
                onClick={handleSelectKey}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
                Select API Key
            </button>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="ml-4 text-sm underline hover:text-yellow-100">
                Learn about billing
            </a>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <div className="container mx-auto p-4 md:p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            AI Content Studio
          </h1>
          <p className="text-gray-400 mt-2">Generate Roblox Videos and Transcribe Audio with Gemini</p>
        </header>

        {!apiKeySelected && <ApiKeyPrompt />}

        <div className="flex justify-center mb-6">
          <div className="flex space-x-2 bg-gray-800 p-2 rounded-xl">
            <TabButton tabName="generator" label="Video Generator" icon={<VideoIcon />} />
            <TabButton tabName="transcriber" label="Audio Transcriber" icon={<SpeechToTextIcon />} />
          </div>
        </div>

        <main className="bg-gray-800 rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
