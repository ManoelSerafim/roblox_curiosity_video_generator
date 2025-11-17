import React, { useState, useEffect } from 'react';
import VideoGenerator from './components/VideoGenerator';
import AudioTranscriber from './components/AudioTranscriber';
import { VideoIcon } from './components/icons/VideoIcon';
import { SpeechToTextIcon } from './components/icons/SpeechToTextIcon';

type Tab = 'generator' | 'transcriber';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('generator');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini-api-key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleSetKey = () => {
    const key = apiKeyInput.trim();
    if (key) {
      setApiKey(key);
      localStorage.setItem('gemini-api-key', key);
      setApiKeyInput(''); // Clear input after setting
    }
  };

  const handleClearKey = () => {
    setApiKey(null);
    localStorage.removeItem('gemini-api-key');
  };


  const renderTabContent = () => {
    switch (activeTab) {
      case 'generator':
        return <VideoGenerator apiKey={apiKey} onInvalidApiKey={handleClearKey} />;
      case 'transcriber':
        return <AudioTranscriber apiKey={apiKey} />;
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

  const ApiKeyManager = () => (
    <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg mb-6">
      <h3 className="font-bold text-lg mb-2">API Key Management</h3>
      {apiKey ? (
         <div className="flex items-center justify-between">
           <p className="text-green-400">API Key is set.</p>
           <button onClick={handleClearKey} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm">
             Clear Key
           </button>
         </div>
      ) : (
        <div className="space-y-2">
            <p className="text-yellow-300 text-sm">An API key is required to use this application.</p>
            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Enter your Gemini API Key"
                    className="flex-grow bg-gray-700 border border-gray-600 rounded-md shadow-sm px-4 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                    onClick={handleSetKey}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                    Set API Key
                </button>
            </div>
            <a href="https://ai.google.dev/gemini-api/docs/api-key" target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 underline hover:text-indigo-300">
                How to get an API Key
            </a>
        </div>
      )}
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

        <ApiKeyManager />

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
