/** @jsxImportSource react */
'use client';

import React from 'react';

export default function FirebaseErrorPage() {
  return (
    <div className="min-h-screen bg-red-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Firebase Configuration Error</h1>
        <p>Your Firebase project is not properly configured.</p>
      </div>
    </div>
  );
}