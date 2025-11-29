/**
 * Reusable file upload utility function
 * Handles single or multiple file uploads with token authentication
 */

export interface UploadResult {
  success: boolean;
  url: string;
  fileName?: string;
  fileSize?: number;
  type?: string;
  error?: string;
}

export interface UploadOptions {
  token?: string;
  onProgress?: (progress: number) => void;
}

/**
 * Upload a single file to /api/upload endpoint
 * @param file - File to upload
 * @param options - Upload options (token, onProgress)
 * @returns Promise with upload result
 */
export async function handleFileUpload(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  // Validate file type (images only for now)
  if (!file.type.startsWith('image/')) {
    return {
      success: false,
      url: '',
      error: 'Please select a valid image file',
    };
  }

  // Validate file size (max 5MB)
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_SIZE) {
    return {
      success: false,
      url: '',
      error: 'Image size should be less than 5MB',
    };
  }

  try {
    // Get token from options or localStorage
    const token = options.token || localStorage.getItem('token') || '';

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Upload-Token': token, // Also send as X-Upload-Token for flexibility
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      return {
        success: false,
        url: '',
        error: errorData.error || 'Failed to upload file',
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      url: data.url,
      fileName: data.fileName || file.name,
      fileSize: data.fileSize || file.size,
      type: data.type || file.type,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      url: '',
      error: error instanceof Error ? error.message : 'Failed to upload file',
    };
  }
}

/**
 * Upload multiple files in parallel using Promise.all()
 * @param files - Array of files to upload
 * @param options - Upload options (token, onProgress)
 * @returns Promise with array of upload results
 */
export async function handleMultipleFileUpload(
  files: File[],
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  // Upload all files in parallel
  const uploadPromises = files.map((file) => handleFileUpload(file, options));
  
  try {
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Multiple upload error:', error);
    return files.map(() => ({
      success: false,
      url: '',
      error: 'Failed to upload files',
    }));
  }
}

/**
 * Upload multiple files with progress tracking
 * @param files - Array of files to upload
 * @param options - Upload options with onProgress callback
 * @returns Promise with array of upload results
 */
export async function handleMultipleFileUploadWithProgress(
  files: File[],
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  const totalFiles = files.length;

  for (let i = 0; i < files.length; i++) {
    const result = await handleFileUpload(files[i], options);
    results.push(result);

    // Call progress callback if provided
    if (options.onProgress) {
      const progress = ((i + 1) / totalFiles) * 100;
      options.onProgress(progress);
    }
  }

  return results;
}

