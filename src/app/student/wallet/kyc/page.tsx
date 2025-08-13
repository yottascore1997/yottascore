'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface KYCDocument {
  id: string;
  documentType: string;
  documentNumber?: string;
  documentImage: string;
  isVerified: boolean;
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

interface KYCData {
  kycStatus: string;
  kycVerifiedAt?: string;
  kycRejectedAt?: string;
  kycRejectionReason?: string;
  documents: KYCDocument[];
}

const KYCPage: React.FC = () => {
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('');
  const [documentNumber, setDocumentNumber] = useState<string>('');

  const router = useRouter();

  const documentTypes = [
    { value: 'AADHAR_CARD', label: 'Aadhar Card' },
    { value: 'PAN_CARD', label: 'PAN Card' },
    { value: 'DRIVING_LICENSE', label: 'Driving License' },
    { value: 'PASSPORT', label: 'Passport' },
    { value: 'VOTER_ID', label: 'Voter ID' },
    { value: 'BANK_PASSBOOK', label: 'Bank Passbook' },
    { value: 'OTHER', label: 'Other' }
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchKYCData();
  }, [router]);

  const fetchKYCData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/kyc/upload', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch KYC data');
      }
      const data: KYCData = await res.json();
      setKycData(data);
    } catch (error: any) {
      console.error('Error fetching KYC data:', error);
      toast.error(error.message || 'Failed to load KYC data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size should be less than 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      toast.error('Please select a file and document type');
      return;
    }

    setUploading(true);
    try {
      // Convert file to base64 for demo purposes
      // In production, you'd upload to a cloud service like AWS S3
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = reader.result as string;
        
        const token = localStorage.getItem('token');
        const res = await fetch('/api/user/kyc/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            documentType,
            documentNumber: documentNumber || undefined,
            documentImage: base64String,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Upload failed');
        }

        const result = await res.json();
        toast.success(result.message || 'Document uploaded successfully!');
        
        // Reset form
        setSelectedFile(null);
        setDocumentType('');
        setDocumentNumber('');
        
        // Refresh KYC data
        fetchKYCData();
      };
      reader.readAsDataURL(selectedFile);
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error(error.message || 'An error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'text-green-600 bg-green-100';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100';
      case 'REJECTED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'Verified';
      case 'PENDING':
        return 'Pending Verification';
      case 'REJECTED':
        return 'Rejected';
      default:
        return 'Not Submitted';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading KYC details...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.back()}
          className="mr-4 p-2 hover:bg-gray-100 rounded-full"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold">KYC Verification</h1>
      </div>

      {/* KYC Status */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">KYC Status</h2>
        <div className="flex items-center justify-between">
          <div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(kycData?.kycStatus || 'NOT_SUBMITTED')}`}>
              {getStatusText(kycData?.kycStatus || 'NOT_SUBMITTED')}
            </span>
            {kycData?.kycVerifiedAt && (
              <p className="text-sm text-gray-600 mt-1">
                Verified on: {new Date(kycData.kycVerifiedAt).toLocaleDateString()}
              </p>
            )}
            {kycData?.kycRejectionReason && (
              <p className="text-sm text-red-600 mt-1">
                Reason: {kycData.kycRejectionReason}
              </p>
            )}
          </div>
          {kycData?.kycStatus === 'VERIFIED' && (
            <div className="text-green-600 text-2xl">✓</div>
          )}
        </div>
      </div>

      {/* Upload New Document */}
      {kycData?.kycStatus !== 'VERIFIED' && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload New Document</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type *
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Document Type</option>
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Number (Optional)
              </label>
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="e.g., AADHAR1234567890"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Image *
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: JPG, PNG, PDF. Max size: 5MB
            </p>
          </div>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || !documentType || uploading}
            className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md font-semibold ${
              !selectedFile || !documentType || uploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      )}

      {/* Uploaded Documents */}
      {kycData?.documents && kycData.documents.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Uploaded Documents</h2>
          <div className="space-y-4">
            {kycData.documents.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {documentTypes.find(t => t.value === doc.documentType)?.label || doc.documentType}
                    </h3>
                    {doc.documentNumber && (
                      <p className="text-sm text-gray-600">Number: {doc.documentNumber}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    doc.isVerified ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'
                  }`}>
                    {doc.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 text-xs">Preview</span>
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">
                      Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                    {doc.verifiedAt && (
                      <p className="text-sm text-green-600">
                        Verified: {new Date(doc.verifiedAt).toLocaleDateString()}
                      </p>
                    )}
                    {doc.rejectionReason && (
                      <p className="text-sm text-red-600">
                        Rejection: {doc.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">KYC Verification Instructions</h3>
        <ul className="text-blue-800 space-y-2 text-sm">
          <li>• Upload clear, readable images of your identity documents</li>
          <li>• Ensure all text and numbers are clearly visible</li>
          <li>• Documents will be verified within 24-48 hours</li>
          <li>• You'll receive notifications about verification status</li>
          <li>• KYC verification is required for withdrawals above ₹1000</li>
        </ul>
      </div>
    </div>
  );
};

export default KYCPage; 