<?php
/**
 * Image Upload Endpoint for GoDaddy Server
 * Place this file in your public_html or www folder on GoDaddy
 */

// Enable CORS for Next.js app
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Upload-Token');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Configuration
$UPLOAD_TOKEN = 'YOUR_SECRET_UPLOAD_TOKEN_HERE'; // Change this to match your .env.local UPLOAD_TOKEN
$UPLOAD_DIR = 'uploads/'; // Directory to store uploaded files
$MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
$ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.oasis.opendocument.spreadsheet',
];

// Validate token
$token = $_SERVER['HTTP_X_UPLOAD_TOKEN'] ?? '';
if (empty($token) || $token !== $UPLOAD_TOKEN) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized. Invalid upload token.']);
    exit();
}

// Check if file was uploaded
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded or upload error occurred.']);
    exit();
}

$file = $_FILES['file'];

// Validate file size
if ($file['size'] > $MAX_FILE_SIZE) {
    http_response_code(400);
    echo json_encode(['error' => 'File size too large. Maximum size is 5MB.']);
    exit();
}

// Validate file type
$fileType = mime_content_type($file['tmp_name']);
if (!in_array($fileType, $ALLOWED_TYPES)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid file type. Allowed: Images (JPEG, PNG, GIF, WebP), PDF, Excel.']);
    exit();
}

// Create upload directory if it doesn't exist
if (!file_exists($UPLOAD_DIR)) {
    mkdir($UPLOAD_DIR, 0755, true);
}

// Generate unique filename
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$fileName = time() . '_' . uniqid() . '.' . $extension;
$filePath = $UPLOAD_DIR . $fileName;

// Move uploaded file
if (!move_uploaded_file($file['tmp_name'], $filePath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save file.']);
    exit();
}

// Get the base URL (adjust based on your domain)
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];
$baseUrl = $protocol . '://' . $host;

// Return success response with file URL
$fileUrl = $baseUrl . '/' . $filePath;

echo json_encode([
    'success' => true,
    'url' => $fileUrl,
    'fileName' => $fileName,
    'fileSize' => $file['size'],
    'fileType' => $fileType,
]);
?>

