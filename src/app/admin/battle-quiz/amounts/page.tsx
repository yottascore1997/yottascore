"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  CheckCircle, 
  AlertCircle,
  IndianRupee
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  color: string;
  battleQuizAmounts: BattleAmount[];
}

interface BattleAmount {
  id: string;
  categoryId: string;
  amount: number;
  isActive: boolean;
  maxPlayers: number;
}

const DEFAULT_AMOUNTS = [5, 10, 25, 35, 50, 75, 100];

export default function BattleQuizAmountsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [selectedAmounts, setSelectedAmounts] = useState<number[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/battle-quiz/amounts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        setError('Failed to fetch categories');
      }
    } catch (error) {
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category.id);
    setSelectedAmounts(category.battleQuizAmounts.map(a => a.amount));
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setSelectedAmounts([]);
  };

  const handleAmountToggle = (amount: number) => {
    setSelectedAmounts(prev => 
      prev.includes(amount) 
        ? prev.filter(a => a !== amount)
        : [...prev, amount].sort((a, b) => a - b)
    );
  };

  const handleSaveAmounts = async (categoryId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/battle-quiz/amounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          categoryId,
          amounts: selectedAmounts
        })
      });

      if (response.ok) {
        setSuccess('Amounts updated successfully');
        setEditingCategory(null);
        setSelectedAmounts([]);
        fetchCategories(); // Refresh data
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update amounts');
      }
    } catch (error) {
      setError('Failed to update amounts');
    }
  };

  const handleToggleAmount = async (amountId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/battle-quiz/amounts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: amountId,
          isActive: !isActive
        })
      });

      if (response.ok) {
        setSuccess('Amount status updated');
        fetchCategories(); // Refresh data
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to update amount status');
      }
    } catch (error) {
      setError('Failed to update amount status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Battle Quiz Amounts</h1>
          <p className="text-gray-600">Manage entry amounts for different categories</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-800">{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card key={category.id} className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{category.name}</span>
                  <Badge 
                    variant={category.battleQuizAmounts.length > 0 ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {category.battleQuizAmounts.length} amounts
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editingCategory === category.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Amounts</label>
                      <div className="grid grid-cols-3 gap-2">
                        {DEFAULT_AMOUNTS.map((amount) => (
                          <button
                            key={amount}
                            onClick={() => handleAmountToggle(amount)}
                            className={`p-2 rounded-lg border-2 text-sm font-medium transition-all ${
                              selectedAmounts.includes(amount)
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-center">
                              <IndianRupee className="w-3 h-3 mr-1" />
                              {amount}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleSaveAmounts(category.id)}
                        size="sm"
                        className="flex-1"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        variant="outline"
                        size="sm"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="space-y-3">
                    {category.battleQuizAmounts.length > 0 ? (
                      <div className="space-y-2">
                        {category.battleQuizAmounts.map((amount) => (
                          <div
                            key={amount.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center">
                              <IndianRupee className="w-4 h-4 mr-1 text-gray-600" />
                              <span className="font-medium">{amount.amount}</span>
                              {!amount.isActive && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  Disabled
                                </Badge>
                              )}
                            </div>
                            <Button
                              onClick={() => handleToggleAmount(amount.id, amount.isActive)}
                              variant={amount.isActive ? "destructive" : "default"}
                              size="sm"
                            >
                              {amount.isActive ? (
                                <>
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Disable
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Enable
                                </>
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <p className="text-sm">No amounts configured</p>
                        <p className="text-xs">Click edit to add amounts</p>
                      </div>
                    )}
                    
                    <Button
                      onClick={() => handleEditCategory(category)}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      {category.battleQuizAmounts.length > 0 ? 'Edit Amounts' : 'Add Amounts'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">How it works</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Users can select from configured amounts when choosing a category</li>
            <li>• If no amounts are configured, default amounts (₹5, ₹10, ₹25, etc.) will be used</li>
            <li>• Disabled amounts won't appear to users</li>
            <li>• System automatically creates battle quizzes for selected amounts</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 