/**
 * Example component showing how to use handleFileUpload
 * You can use this as a reference for implementing image uploads
 */

'use client';

import { useState } from 'react';
import { handleFileUpload, handleMultipleFileUpload } from '@/lib/upload';

export default function ImageUploadExample() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Single file upload example
  const handleSingleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const result = await handleFileUpload(file);
      
      if (result.success) {
        setUploadedUrls(prev => [...prev, result.url]);
        console.log('✅ Upload successful:', result.url);
      } else {
        setError(result.error || 'Upload failed');
        alert(result.error || 'Upload failed');
      }
    } catch (err) {
      setError('Upload error occurred');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  // Multiple files upload example (parallel)
  const handleMultipleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const fileArray = Array.from(files);
      const results = await handleMultipleFileUpload(fileArray);

      const successfulUploads = results
        .filter(r => r.success)
        .map(r => r.url);

      const failedUploads = results.filter(r => !r.success);

      if (successfulUploads.length > 0) {
        setUploadedUrls(prev => [...prev, ...successfulUploads]);
        console.log('✅ Uploaded files:', successfulUploads);
      }

      if (failedUploads.length > 0) {
        const errorMessages = failedUploads
          .map(r => r.error)
          .filter(Boolean)
          .join(', ');
        setError(`Some uploads failed: ${errorMessages}`);
      }
    } catch (err) {
      setError('Upload error occurred');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Image Upload Example</h2>

      {/* Single file upload */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Single Image Upload
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleSingleFile}
          disabled={uploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* Multiple files upload */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Multiple Images Upload (Parallel)
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleMultipleFiles}
          disabled={uploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* Upload status */}
      {uploading && (
        <div className="text-blue-600">Uploading...</div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-red-600 bg-red-50 p-3 rounded">
          {error}
        </div>
      )}

      {/* Uploaded images preview */}
      {uploadedUrls.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Uploaded Images:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {uploadedUrls.map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={`Uploaded ${index + 1}`}
                  className="w-full h-32 object-cover rounded border"
                />
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-2 text-xs text-blue-600 hover:underline truncate"
                >
                  {url}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

