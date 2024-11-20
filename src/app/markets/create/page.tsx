'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FaPlus, FaSpinner } from 'react-icons/fa';

const categories = [
  'Politics',
  'Economics',
  'Technology',
  'Sports',
  'Entertainment',
  'Science',
  'Health',
  'Other'
];

export default function CreateMarketPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    question: '',
    description: '',
    category: '',
    resolution_source: '',
    resolution_criteria: '',
    closing_date: '',
    resolution_date: '',
    end_date: '',
    source_url: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();

      if (authError) throw authError;
      if (!session) {
        router.push('/login');
        return;
      }

      const { error: insertError } = await supabase
        .from('markets')
        .insert({
          creator_id: session.user.id,
          title: formData.title,
          question: formData.question,
          description: formData.description,
          category: formData.category,
          resolution_source: formData.resolution_source,
          resolution_criteria: formData.resolution_criteria,
          closing_date: new Date(formData.closing_date).toISOString(),
          resolution_date: new Date(formData.resolution_date).toISOString(),
          end_date: new Date(formData.end_date).toISOString(),
          status: 'open',
          outcome: null,
          total_volume: 0.0,
          liquidity_pool: 0.0,
          probability_yes: 0.5,
          probability_no: 0.5,
          views: 0,
          trades: 0
        });

      if (insertError) throw insertError;

      router.push('/markets');
      router.refresh();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Failed to create market');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 md:px-6 lg:px-8">
      <div className="flex items-center space-x-2 mb-8">
        <FaPlus className="w-8 h-8 text-primary" />
        <h1 className="text-4xl font-bold text-foreground">Create Market</h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-foreground">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Give your market a clear, concise title"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="question" className="text-sm font-medium text-foreground">
              Question
            </label>
            <input
              type="text"
              id="question"
              name="question"
              value={formData.question}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Will Bitcoin reach $100,000 by end of 2024?"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full p-3 rounded-lg bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Provide detailed context about this prediction market..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium text-foreground">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category} value={category.toLowerCase()}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="resolution_source" className="text-sm font-medium text-foreground">
              Resolution Source
            </label>
            <input
              type="text"
              id="resolution_source"
              name="resolution_source"
              value={formData.resolution_source}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Official source that will be used to resolve this market"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="resolution_criteria" className="text-sm font-medium text-foreground">
              Resolution Criteria
            </label>
            <textarea
              id="resolution_criteria"
              name="resolution_criteria"
              value={formData.resolution_criteria}
              onChange={handleChange}
              required
              rows={3}
              className="w-full p-3 rounded-lg bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Specific criteria that will be used to determine the outcome..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="closing_date" className="text-sm font-medium text-foreground">
              Trading Closing Date
            </label>
            <input
              type="datetime-local"
              id="closing_date"
              name="closing_date"
              value={formData.closing_date}
              onChange={handleChange}
              required
              min={new Date().toISOString().slice(0, 16)}
              className="w-full p-3 rounded-lg bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="resolution_date" className="text-sm font-medium text-foreground">
              Resolution Date
            </label>
            <input
              type="datetime-local"
              id="resolution_date"
              name="resolution_date"
              value={formData.resolution_date}
              onChange={handleChange}
              required
              min={formData.closing_date}
              className="w-full p-3 rounded-lg bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="end_date" className="text-sm font-medium text-foreground">
              Market End Date
            </label>
            <input
              type="datetime-local"
              id="end_date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              required
              min={formData.resolution_date}
              className="w-full p-3 rounded-lg bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="source_url" className="text-sm font-medium text-foreground">
              Source URL (Optional)
            </label>
            <input
              type="url"
              id="source_url"
              name="source_url"
              value={formData.source_url}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="https://..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium 
                     hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Creating Market...</span>
              </>
            ) : (
              <>
                <FaPlus />
                <span>Create Market</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
