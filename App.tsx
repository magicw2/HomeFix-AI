import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ImageUploader from './components/ImageUploader';
import ResultsDisplay from './components/ResultsDisplay';
import type { RepairGuide } from './types';

interface MediaPreview {
  url: string;
  type: string;
}

const LOCAL_STORAGE_KEYS = {
  RESULT: 'homefix_analysisResult',
  MEDIA_URL: 'homefix_mediaUrl',
  MEDIA_TYPE: 'homefix_mediaType',
  PROMPT: 'homefix_prompt',
};

const App: React.FC = () => {
  // Lazy initialize state from localStorage
  const [analysisResult, setAnalysisResult] = useState<RepairGuide | null>(() => {
    try {
      const savedResult = localStorage.getItem(LOCAL_STORAGE_KEYS.RESULT);
      return savedResult ? JSON.parse(savedResult) : null;
    } catch {
      return null;
    }
  });

  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(() => {
    try {
      const url = localStorage.getItem(LOCAL_STORAGE_KEYS.MEDIA_URL);
      const type = localStorage.getItem(LOCAL_STORAGE_KEYS.MEDIA_TYPE);
      if (url && type) {
        return { url, type };
      }
      return null;
    } catch {
      return null;
    }
  });
  
  const [prompt, setPrompt] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.PROMPT) || '';
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Persist state to localStorage on change
  useEffect(() => {
    if (analysisResult) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.RESULT, JSON.stringify(analysisResult));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.RESULT);
    }
  }, [analysisResult]);

  useEffect(() => {
    if (mediaPreview) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.MEDIA_URL, mediaPreview.url);
      localStorage.setItem(LOCAL_STORAGE_KEYS.MEDIA_TYPE, mediaPreview.type);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.MEDIA_URL);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.MEDIA_TYPE);
    }
  }, [mediaPreview]);

  useEffect(() => {
    if (prompt) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.PROMPT, prompt);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.PROMPT);
    }
  }, [prompt]);

  const handleAnalysisComplete = (result: RepairGuide) => {
    setAnalysisResult(result);
    setIsLoading(false);
    setError(null);
  };

  const handleAnalysisStart = () => {
    setIsLoading(true);
    setAnalysisResult(null);
    setError(null);
  };

  const handleAnalysisError = (errorMessage: string) => {
    setError(errorMessage);
    setIsLoading(false);
    setAnalysisResult(null);
  };
  
  const handleReset = () => {
    setAnalysisResult(null);
    setError(null);
    setIsLoading(false);
    setMediaPreview(null);
    setPrompt('');
    // Clear all related local storage items
    Object.values(LOCAL_STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  }

  return (
    <div 
      className="min-h-screen flex flex-col antialiased text-slate-800"
      style={{
        backgroundColor: '#f8fafc', // slate-50
        backgroundImage: 'radial-gradient(circle at 25px 25px, #e2e8f0 2%, transparent 0%), radial-gradient(circle at 75px 75px, #e2e8f0 2%, transparent 0%)',
        backgroundSize: '100px 100px',
      }}
    >
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 flex items-center justify-center">
        <div className="w-full max-w-4xl">
          {!analysisResult ? (
            <ImageUploader
              onAnalysisStart={handleAnalysisStart}
              onAnalysisComplete={handleAnalysisComplete}
              onAnalysisError={handleAnalysisError}
              isLoading={isLoading}
              error={error}
              prompt={prompt}
              setPrompt={setPrompt}
              mediaPreview={mediaPreview}
              setMediaPreview={setMediaPreview}
            />
          ) : (
            <ResultsDisplay result={analysisResult} onReset={handleReset} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;