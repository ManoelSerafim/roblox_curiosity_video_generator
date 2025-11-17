
import React, { useState } from 'react';
import VideoGenerator from './components/VideoGenerator';
import AudioTranscriber from './components/AudioTranscriber';
import { VideoIcon } from './components/icons/VideoIcon';
import { SpeechToTextIcon } from './components/icons/SpeechToTextIcon';

type Tab = 'generator' | 'transcriber';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('generator');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'generator':
        return <VideoGenerator />;
      case 'transcriber':
        return <AudioTranscriber />;
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

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <div className="container mx-auto p-4 md:p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            AI Content Studio
          </h1>
          <p className="text-gray-400 mt-2">Generate Roblox Videos and Transcribe Audio with Gemini</p>
        </header>

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
