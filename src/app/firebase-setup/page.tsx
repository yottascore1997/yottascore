'use client';

import { useState } from 'react';

export default function FirebaseSetupPage() {
  const [config, setConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });

  const handleConfigChange = (field: string, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const generateEnvFile = () => {
    const envContent = `# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="${config.apiKey}"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="${config.authDomain}"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="${config.projectId}"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="${config.storageBucket}"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="${config.messagingSenderId}"
NEXT_PUBLIC_FIREBASE_APP_ID="${config.appId}"`;

    // Create and download .env.local file
    const blob = new Blob([envContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env.local';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Firebase Setup for YottaScore</h1>
        
        {/* Step 1: Firebase Console */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 1: Firebase Console Setup</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Go to <a href="https://console.firebase.google.com/" target="_blank" className="text-blue-500 hover:underline">Firebase Console</a></li>
            <li>Click "Create a project"</li>
            <li>Project name: <code className="bg-gray-100 px-2 py-1 rounded">yottascore-app</code></li>
            <li>Enable Google Analytics: <strong>No</strong></li>
            <li>Click "Create project"</li>
          </ol>
        </div>

        {/* Step 2: Add Web App */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 2: Add Web App</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>In Firebase Console, click "Add app" → Web (</>)</li>
            <li>App nickname: <code className="bg-gray-100 px-2 py-1 rounded">YottaScore Web</code></li>
            <li><strong>Don't check</strong> "Also set up Firebase Hosting"</li>
            <li>Click "Register app"</li>
            <li>Copy the configuration object</li>
          </ol>
        </div>

        {/* Step 3: Enable Authentication */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 3: Enable Authentication</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Go to "Authentication" in Firebase Console</li>
            <li>Click "Get started"</li>
            <li>Go to "Sign-in method" tab</li>
            <li>Enable: <strong>Email/Password</strong> and <strong>Phone</strong></li>
          </ol>
        </div>

        {/* Step 4: Configuration Form */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 4: Enter Firebase Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input
                type="text"
                value={config.apiKey}
                onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                className="w-full p-3 border rounded-lg"
                placeholder="AIzaSyBxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Auth Domain</label>
              <input
                type="text"
                value={config.authDomain}
                onChange={(e) => handleConfigChange('authDomain', e.target.value)}
                className="w-full p-3 border rounded-lg"
                placeholder="yottascore-app.firebaseapp.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project ID</label>
              <input
                type="text"
                value={config.projectId}
                onChange={(e) => handleConfigChange('projectId', e.target.value)}
                className="w-full p-3 border rounded-lg"
                placeholder="yottascore-app"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Storage Bucket</label>
              <input
                type="text"
                value={config.storageBucket}
                onChange={(e) => handleConfigChange('storageBucket', e.target.value)}
                className="w-full p-3 border rounded-lg"
                placeholder="yottascore-app.appspot.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Messaging Sender ID</label>
              <input
                type="text"
                value={config.messagingSenderId}
                onChange={(e) => handleConfigChange('messagingSenderId', e.target.value)}
                className="w-full p-3 border rounded-lg"
                placeholder="123456789012"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App ID</label>
              <input
                type="text"
                value={config.appId}
                onChange={(e) => handleConfigChange('appId', e.target.value)}
                className="w-full p-3 border rounded-lg"
                placeholder="1:123456789012:web:abcdef1234567890"
              />
            </div>
          </div>
          
          <button
            onClick={generateEnvFile}
            className="mt-4 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
          >
            Download .env.local File
          </button>
        </div>

        {/* Step 5: Test */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 5: Test Configuration</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Download the .env.local file above</li>
            <li>Place it in your project root directory</li>
            <li>Restart your development server: <code className="bg-gray-100 px-2 py-1 rounded">npm run dev</code></li>
            <li>Go to: <a href="/firebase-test" className="text-blue-500 hover:underline">/firebase-test</a></li>
            <li>Test email login first (easier)</li>
            <li>Test phone login with real number</li>
          </ol>
        </div>

        {/* Quick Links */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="font-semibold mb-4">Quick Links:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/firebase-test" className="bg-blue-500 text-white p-3 rounded-lg text-center hover:bg-blue-600">
              Test Firebase Auth
            </a>
            <a href="/firebase-login" className="bg-green-500 text-white p-3 rounded-lg text-center hover:bg-green-600">
              Full Login Page
            </a>
            <a href="https://console.firebase.google.com/" target="_blank" className="bg-orange-500 text-white p-3 rounded-lg text-center hover:bg-orange-600">
              Firebase Console
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}