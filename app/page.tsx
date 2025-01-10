'use client';

import { useState, useEffect } from 'react';
import ModelViewer from '@/components/ModelViewer';

interface Model {
  name: string;
  path: string;
}

export default function Home() {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    fetch('/api/models')
      .then(res => res.json())
      .then(data => {
        setModels(data);
      })
      .catch(error => {
        console.error('Error fetching models:', error);
      });
  }, []);

  return (
    <main className="container mx-auto p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">3D Model Viewer</h1>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="px-3 py-1 text-sm rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {showHelp ? 'Hide Controls' : 'Show Controls'}
          </button>
        </div>

        {showHelp && (
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <h2 className="font-semibold mb-2">Controls:</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>🖱️ <strong>Left Click + Drag</strong>: Rotate the model</li>
              <li>🖱️ <strong>Right Click + Drag</strong>: Pan the view</li>
              <li>🖱️ <strong>Scroll Wheel</strong>: Zoom in/out</li>
              <li>🖱️ <strong>Double Click</strong>: Reset view</li>
            </ul>
          </div>
        )}
        
        <div className="w-[300px]">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Select a model to view</option>
            {models.map((model) => (
              <option key={model.path} value={model.path}>
                {model.name}
              </option>
            ))}
          </select>
        </div>

        {selectedModel && (
          <ModelViewer modelUrl={selectedModel} />
        )}
      </div>
    </main>
  );
}
