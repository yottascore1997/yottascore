'use client';

import React, { useEffect, useState } from 'react';
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

interface KYCRequest {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  kycStatus: string;
  kycVerifiedAt?: string;
  kycRejectedAt?: string;
  kycRejectionReason?: string;
  createdAt: string;
  kycDocuments: KYCDocument[];
}

const AdminKYCPage: React.FC = () => {
  const [kycRequests, setKycRequests] = useState<KYCRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const statusOptions = [
    { value: 'ALL', label: 'All Requests' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'VERIFIED', label: 'Verified' },
    { value: 'REJECTED', label: 'Rejected' }
  ];

  useEffect(() => {
    fetchKYCRequests();
  }, [selectedStatus, currentPage]);

  const fetchKYCRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/kyc/verify?status=${selectedStatus}&page=${currentPage}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch KYC requests');
      }
      const data = await res.json();
      setKycRequests(data.kycRequests);
      setTotalPages(data.pagination.totalPages);
    } catch (error: any) {
      console.error('Error fetching KYC requests:', error);
      toast.error(error.message || 'Failed to load KYC requests');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (documentId: string, action: 'APPROVE' | 'REJECT') => {
    if (action === 'REJECT' && !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setVerifying(documentId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/kyc/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          documentId,
          action,
          rejectionReason: action === 'REJECT' ? rejectionReason : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Verification failed');
      }

      const result = await res.json();
      toast.success(result.message || 'Document verification successful!');
      
      // Reset form
      setRejectionReason('');
      setSelectedDocument(null);
      
      // Refresh data
      fetchKYCRequests();
    } catch (error: any) {
      console.error('Error during verification:', error);
      toast.error(error.message || 'An error occurred during verification.');
    } finally {
      setVerifying(null);
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
        return 'Pending';
      case 'REJECTED':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'AADHAR_CARD': 'Aadhar Card',
      'PAN_CARD': 'PAN Card',
      'DRIVING_LICENSE': 'Driving License',
      'PASSPORT': 'Passport',
      'VOTER_ID': 'Voter ID',
      'BANK_PASSBOOK': 'Bank Passbook',
      'OTHER': 'Other'
    };
    return types[type] || type;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading KYC requests...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">KYC Verification Panel</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="text-sm text-gray-600">
            Total Requests: {kycRequests.length}
          </div>
        </div>
      </div>

      {/* KYC Requests */}
      <div className="space-y-6">
        {kycRequests.map((request) => (
          <div key={request.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{request.name}</h3>
                <p className="text-sm text-gray-600">{request.email}</p>
                {request.phoneNumber && (
                  <p className="text-sm text-gray-600">{request.phoneNumber}</p>
                )}
                <p className="text-sm text-gray-500">
                  Submitted: {new Date(request.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.kycStatus)}`}>
                  {getStatusText(request.kycStatus)}
                </span>
                {request.kycVerifiedAt && (
                  <p className="text-xs text-green-600 mt-1">
                    Verified: {new Date(request.kycVerifiedAt).toLocaleDateString()}
                  </p>
                )}
                {request.kycRejectionReason && (
                  <p className="text-xs text-red-600 mt-1">
                    Rejected: {request.kycRejectionReason}
                  </p>
                )}
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Uploaded Documents</h4>
              {request.kycDocuments.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h5 className="font-medium text-gray-900">
                        {getDocumentTypeLabel(doc.documentType)}
                      </h5>
                      {doc.documentNumber && (
                        <p className="text-sm text-gray-600">Number: {doc.documentNumber}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      doc.isVerified ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'
                    }`}>
                      {doc.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>

                                     {/* Document Preview */}
                   <div className="mb-3">
                     {doc.documentImage ? (
                       <div className="relative group">
                         <img
                           src={doc.documentImage}
                           alt={`${doc.documentType} document`}
                           className="w-40 h-32 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-all duration-200 hover:scale-105"
                           onClick={() => setSelectedImage(doc.documentImage)}
                           title="Click to view full size"
                         />
                         <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                           <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 text-gray-800 text-xs px-2 py-1 rounded">
                             Click to enlarge
                           </div>
                         </div>
                         <div className="absolute top-2 right-2">
                           <button
                             onClick={() => setSelectedImage(doc.documentImage)}
                             className="bg-blue-600 text-white p-1 rounded-full hover:bg-blue-700 transition-colors"
                             title="View full size"
                           >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                             </svg>
                           </button>
                         </div>
                       </div>
                     ) : (
                       <div className="w-40 h-32 bg-gray-100 rounded-lg flex items-center justify-center border">
                         <div className="text-center">
                           <svg className="w-8 h-8 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                           </svg>
                           <span className="text-gray-500 text-xs">No Preview</span>
                         </div>
                       </div>
                     )}
                   </div>

                  {/* Verification Actions */}
                  {!doc.isVerified && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerification(doc.id, 'APPROVE')}
                        disabled={verifying === doc.id}
                        className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {verifying === doc.id ? 'Processing...' : 'Approve'}
                      </button>
                      
                      <button
                        onClick={() => setSelectedDocument(doc.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {doc.isVerified && (
                    <p className="text-sm text-green-600">
                      ✓ Verified on {new Date(doc.verifiedAt!).toLocaleDateString()}
                    </p>
                  )}

                  {doc.rejectionReason && (
                    <p className="text-sm text-red-600">
                      ✗ Rejected: {doc.rejectionReason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            <span className="px-3 py-2 text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

             {/* Image Preview Modal */}
       {selectedImage && (
         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
           <div className="relative max-w-4xl max-h-full">
             <div className="bg-white rounded-lg p-4">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-semibold">Document Preview</h3>
                 <button
                   onClick={() => setSelectedImage(null)}
                   className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                 >
                   ×
                 </button>
               </div>
               <div className="flex justify-center">
                 <img
                   src={selectedImage}
                   alt="Document preview"
                   className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                 />
               </div>
               <div className="mt-4 flex justify-center">
                 <button
                   onClick={() => window.open(selectedImage, '_blank')}
                   className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                 >
                   Open in New Tab
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Rejection Modal */}
       {selectedDocument && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
             <h3 className="text-lg font-semibold mb-4">Reject Document</h3>
             <div className="mb-4">
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Rejection Reason *
               </label>
               <textarea
                 value={rejectionReason}
                 onChange={(e) => setRejectionReason(e.target.value)}
                 placeholder="Please provide a reason for rejection..."
                 className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                 rows={3}
               />
             </div>
             
             <div className="flex gap-2 justify-end">
               <button
                 onClick={() => {
                   setSelectedDocument(null);
                   setRejectionReason('');
                 }}
                 className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
               >
                 Cancel
               </button>
               <button
                 onClick={() => handleVerification(selectedDocument, 'REJECT')}
                 disabled={!rejectionReason.trim() || verifying === selectedDocument}
                 className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
               >
                 {verifying === selectedDocument ? 'Processing...' : 'Reject'}
               </button>
             </div>
           </div>
         </div>
       )}

      {kycRequests.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No KYC requests found for the selected criteria.</p>
        </div>
      )}
    </div>
  );
};

export default AdminKYCPage; 