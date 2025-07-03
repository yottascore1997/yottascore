'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, MessageCircle, Clock, CheckCircle, AlertCircle, FileText, Filter, Upload, X, Image } from 'lucide-react';

interface SupportTicket {
  id: string;
  ticketId: string;
  title: string;
  description: string;
  issueType: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    replies: number;
  };
  replies: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

const statusColors = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  WAITING_FOR_USER: 'bg-orange-100 text-orange-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
};

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/student/support-tickets?status=${statusFilter}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <AlertCircle className="w-4 h-4" />;
      case 'IN_PROGRESS':
        return <Clock className="w-4 h-4" />;
      case 'RESOLVED':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
          <p className="text-gray-600 mt-2">Get help with your questions and issues</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Tickets</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_USER">Waiting for User</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-lg shadow-sm border">
        {tickets.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-600 mb-4">
              {statusFilter === 'ALL' 
                ? "You haven't created any support tickets yet."
                : `No tickets with status "${statusFilter}" found.`
              }
            </p>
            {statusFilter === 'ALL' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Ticket
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Link
                        href={`/student/support/${ticket.id}`}
                        className="text-lg font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {ticket.ticketId} - {ticket.title}
                      </Link>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status as keyof typeof statusColors]}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[ticket.priority as keyof typeof priorityColors]}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {ticket.description}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Issue: {ticket.issueType.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>{ticket._count.replies} replies</span>
                      <span>•</span>
                      <span>Created {formatDate(ticket.createdAt)}</span>
                      {ticket.replies.length > 0 && (
                        <>
                          <span>•</span>
                          <span>Last updated {formatDate(ticket.replies[ticket.replies.length - 1].createdAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(ticket.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onTicketCreated={() => {
            setShowCreateModal(false);
            fetchTickets();
          }}
        />
      )}
    </div>
  );
}

// Create Ticket Modal Component
function CreateTicketModal({ onClose, onTicketCreated }: { onClose: () => void; onTicketCreated: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    issueType: 'GENERAL_INQUIRY',
    priority: 'MEDIUM',
  });
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>>([]);
  const [uploading, setUploading] = useState(false);

  const issueTypes = [
    { value: 'TECHNICAL_ISSUE', label: 'Technical Issue' },
    { value: 'PAYMENT_PROBLEM', label: 'Payment Problem' },
    { value: 'EXAM_ACCESS', label: 'Exam Access' },
    { value: 'ACCOUNT_ISSUE', label: 'Account Issue' },
    { value: 'FEATURE_REQUEST', label: 'Feature Request' },
    { value: 'BUG_REPORT', label: 'Bug Report' },
    { value: 'GENERAL_INQUIRY', label: 'General Inquiry' },
    { value: 'OTHER', label: 'Other' },
  ];

  const priorities = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' },
  ];

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setAttachments(prev => [...prev, {
          fileName: data.fileName,
          fileUrl: data.fileUrl,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
        }]);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        handleFileUpload(file);
      });
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/student/support-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          attachments,
        }),
      });

      if (response.ok) {
        onTicketCreated();
      } else {
        console.error('Error creating ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create Support Ticket</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of your issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue Type *
            </label>
            <select
              required
              value={formData.issueType}
              onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {issueTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {priorities.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              required
              rows={6}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Please provide detailed information about your issue..."
            />
          </div>

          {/* File Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments (Screenshots, Documents)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {uploading ? 'Uploading...' : 'Click to upload files or drag and drop'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, GIF, PDF, DOC up to 5MB each
                </p>
              </label>
            </div>
          </div>

          {/* Attachments List */}
          {attachments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</h4>
              <div className="space-y-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {attachment.mimeType.startsWith('image/') ? (
                        <Image className="w-5 h-5 text-blue-500" />
                      ) : (
                        <FileText className="w-5 h-5 text-gray-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{attachment.fileName}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(attachment.fileSize)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 