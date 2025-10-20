'use client';

import { useState } from 'react';

export default function FirebaseErrorPage() {
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
    const envContent = `# Firebase Configuration - Replace with your actual values
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
    <div className="min-h-screen bg-red-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <h1 className="text-2xl font-bold mb-2">❌ Firebase Configuration Error</h1>
          <p className="text-sm">
            <strong>Error:</strong> CONFIGURATION_NOT_FOUND - Your Firebase project is not properly configured.
          </p>
        </div>

        {/* Quick Fix Steps */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">🔧 Quick Fix Steps:</h2>
          <ol className="list-decimal list-inside space-y-3 text-sm">
            <li>
              <strong>Go to Firebase Console:</strong> 
              <a href="https://console.firebase.google.com/" target="_blank" className="text-blue-500 hover:underline ml-2">
                https://console.firebase.google.com/
              </a>
            </li>
            <li>
              <strong>Create New Project:</strong> Click "Create a project" → Name: "yottascore-app"
            </li>
            <li>
              <strong>Add Web App:</strong> Click "Add app" → Web (</>) → App nickname: "YottaScore Web"
            </li>
            <li>
              <strong>Copy Configuration:</strong> Copy the firebaseConfig object from the console
            </li>
            <li>
              <strong>Enable Authentication:</strong> Go to Authentication → Get started → Enable Phone provider
            </li>
            <li>
              <strong>Add Authorized Domains:</strong> Authentication → Settings → Add "localhost" to authorized domains
            </li>
          </ol>
        </div>

        {/* Configuration Form */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">📝 Enter Your Firebase Configuration</h2>
          <p className="text-sm text-gray-600 mb-4">
            Get these values from your Firebase Console → Project Settings → Your apps
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input
                type="text"
                value={config.apiKey}
                onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="AIzaSyBxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Auth Domain</label>
              <input
                type="text"
                value={config.authDomain}
                onChange={(e) => handleConfigChange('authDomain', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="your-project.firebaseapp.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project ID</label>
              <input
                type="text"
                value={config.projectId}
                onChange={(e) => handleConfigChange('projectId', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="your-project-id"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Storage Bucket</label>
              <input
                type="text"
                value={config.storageBucket}
                onChange={(e) => handleConfigChange('storageBucket', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="your-project.appspot.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Messaging Sender ID</label>
              <input
                type="text"
                value={config.messagingSenderId}
                onChange={(e) => handleConfigChange('messagingSenderId', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="123456789012"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App ID</label>
              <input
                type="text"
                value={config.appId}
                onChange={(e) => handleConfigChange('appId', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="1:123456789012:web:abcdef1234567890"
              />
            </div>
          </div>
          
          <button
            onClick={generateEnvFile}
            className="mt-4 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            📥 Download .env.local File
          </button>
        </div>

        {/* After Setup Steps */}
        <div className="bg-green-50 p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">✅ After Setup:</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Download the .env.local file above</li>
            <li>Place it in your project root directory (same level as package.json)</li>
            <li>Restart your development server: <code className="bg-gray-100 px-2 py-1 rounded">npm run dev</code></li>
            <li>Go to: <a href="/firebase-test" className="text-blue-500 hover:underline">/firebase-test</a></li>
            <li>Test OTP login with your real phone number</li>
          </ol>
        </div>

        {/* Common Issues */}
        <div className="bg-yellow-50 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">⚠️ Common Issues:</h2>
          <ul className="space-y-2 text-sm">
            <li><strong>404 Error:</strong> Firebase project doesn't exist or wrong configuration</li>
            <li><strong>Phone Auth Not Working:</strong> Enable Phone provider in Authentication → Sign-in method</li>
            <li><strong>reCAPTCHA Issues:</strong> Add localhost to authorized domains in Firebase Console</li>
            <li><strong>OTP Not Received:</strong> Check phone number format (+91XXXXXXXXXX) and SMS quota</li>
          </ul>
        </div>

        {/* Quick Links */}
        <div className="mt-6 flex gap-4">
          <a href="/firebase-test" className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors">
            🧪 Test Firebase
          </a>
          <a href="/firebase-setup" className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors">
            📋 Setup Guide
          </a>
          <a href="https://console.firebase.google.com/" target="_blank" className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors">
            🔥 Firebase Console
          </a>
        </div>
      </div>
    </div>
  );
}