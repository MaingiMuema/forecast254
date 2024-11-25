/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FaPlus, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { getInitialSharePrices } from '@/lib/priceCalculation';

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
    source_url: '',
    initial_liquidity: '1000', // Default initial liquidity
    min_trade_amount: '1',    // Minimum trade amount
    max_trade_amount: '100'   // Maximum trade amount
  });

  const validateLiquidity = (liquidity: number) => {
    if (liquidity < 100) {
      throw new Error('Initial liquidity must be at least 100');
    }
    if (liquidity > 10000) {
      throw new Error('Initial liquidity cannot exceed 10000');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const initialLiquidity = Number(formData.initial_liquidity);
      const minAmount = Number(formData.min_trade_amount);
      const maxAmount = Number(formData.max_trade_amount);

      // Validate liquidity and trade amounts
      validateLiquidity(initialLiquidity);
      
      if (minAmount <= 0 || maxAmount <= minAmount) {
        throw new Error('Invalid trade amount limits');
      }

      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();

      if (authError) throw authError;
      if (!session) {
        router.push('/login');
        return;
      }

      // Get initial share prices
      const { yesPrice, noPrice, probability } = getInitialSharePrices();

      // Create the market
      const { data: market, error: insertError } = await supabase
        .from('markets')
        .insert({
          title: formData.title,
          question: formData.question,
          description: formData.description,
          category: formData.category,
          resolution_source: formData.resolution_source,
          resolution_criteria: formData.resolution_criteria,
          closing_date: new Date(formData.closing_date).toISOString(),
          resolution_date: new Date(formData.resolution_date).toISOString(),
          end_date: new Date(formData.end_date).toISOString(),
          created_by: session.user.id,
          status: 'open',
          total_volume: initialLiquidity,
          liquidity_pool: initialLiquidity,
          min_amount: minAmount,
          max_amount: maxAmount,
          probability_yes: probability,
          probability_no: 1 - probability,
          yes_price: yesPrice,
          no_price: noPrice,
          total_yes_amount: initialLiquidity / 2,
          total_no_amount: initialLiquidity / 2,
          views: 0,
          trades: 0,
          source_url: formData.source_url || null
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Create initial liquidity positions
      const { error: positionsError } = await supabase
        .from('market_positions')
        .insert([
          {
            market_id: market.id,
            user_id: session.user.id,
            position: 'yes',
            amount: initialLiquidity / 2,
            shares: initialLiquidity
          },
          {
            market_id: market.id,
            user_id: session.user.id,
            position: 'no',
            amount: initialLiquidity / 2,
            shares: initialLiquidity
          }
        ]);

      if (positionsError) {
        // If positions creation fails, attempt to delete the market
        await supabase
          .from('markets')
          .delete()
          .eq('id', market.id);
        throw positionsError;
      }

      toast.success('Market created successfully');
      router.push('/markets');
      router.refresh();
    } catch (err: any) {
      console.error('Error creating market:', err);
      setError(err.message || 'Failed to create market');
      toast.error(err.message || 'Failed to create market');
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

          <div className="space-y-6 bg-card/50 border border-border rounded-lg p-6">
            <div className="flex items-center space-x-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-primary" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <h2 className="text-xl font-semibold text-foreground">Market Timeline</h2>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <label htmlFor="closing_date" className="block text-sm font-medium text-foreground/80">
                  Trading Closing Date
                  <span className="ml-1 text-xs text-foreground/60">(When trading stops)</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg 
                      className="h-5 w-5 text-foreground/60" 
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="datetime-local"
                    id="closing_date"
                    name="closing_date"
                    value={formData.closing_date}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().slice(0, 16)}
                    className="block w-full pl-10 rounded-md bg-background border-border focus:border-primary focus:ring-primary sm:text-sm px-4 py-3 transition-colors"
                  />
                </div>
                <p className="mt-1 text-xs text-foreground/60">Must be in the future</p>
              </div>

              <div className="relative">
                <label htmlFor="resolution_date" className="block text-sm font-medium text-foreground/80">
                  Resolution Date
                  <span className="ml-1 text-xs text-foreground/60">(When outcome is determined)</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg 
                      className="h-5 w-5 text-foreground/60" 
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="datetime-local"
                    id="resolution_date"
                    name="resolution_date"
                    value={formData.resolution_date}
                    onChange={handleChange}
                    required
                    min={formData.closing_date || new Date().toISOString().slice(0, 16)}
                    className="block w-full pl-10 rounded-md bg-background border-border focus:border-primary focus:ring-primary sm:text-sm px-4 py-3 transition-colors"
                  />
                </div>
                <p className="mt-1 text-xs text-foreground/60">Must be after trading closing date</p>
              </div>

              <div className="relative">
                <label htmlFor="end_date" className="block text-sm font-medium text-foreground/80">
                  Market End Date
                  <span className="ml-1 text-xs text-foreground/60">(When payouts complete)</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg 
                      className="h-5 w-5 text-foreground/60" 
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 11-2 0V4H5v16h10v-2a1 1 0 112 0v3a1 1 0 01-1 1H4a1 1 0 01-1-1V3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="datetime-local"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    required
                    min={formData.resolution_date || formData.closing_date || new Date().toISOString().slice(0, 16)}
                    className="block w-full pl-10 rounded-md bg-background border-border focus:border-primary focus:ring-primary sm:text-sm px-4 py-3 transition-colors"
                  />
                </div>
                <p className="mt-1 text-xs text-foreground/60">Must be after resolution date</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <label htmlFor="source_url" className="block text-sm font-medium text-foreground/80">
              Source URL
              <span className="ml-1 text-xs text-foreground/60">(Optional)</span>
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg 
                  className="h-5 w-5 text-foreground/60" 
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="url"
                id="source_url"
                name="source_url"
                value={formData.source_url}
                onChange={handleChange}
                className="block w-full pl-10 rounded-md bg-background border-border focus:border-primary focus:ring-primary sm:text-sm px-4 py-3 transition-colors"
                placeholder="https://..."
              />
            </div>
            <p className="mt-1 text-xs text-foreground/60">Reference URL for market resolution</p>
          </div>

          <div className="space-y-6 bg-card/50 border border-border rounded-lg p-6">
            <div className="flex items-center space-x-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-primary" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm3 1h6v2H7V5zm8 5.5a.5.5 0 01-.5.5h-7a.5.5 0 010-1h7a.5.5 0 01.5.5zm-7.5 2.5h7a.5.5 0 010 1h-7a.5.5 0 010-1z" clipRule="evenodd" />
              </svg>
              <h2 className="text-xl font-semibold text-foreground">Market Liquidity Settings</h2>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <label htmlFor="initial_liquidity" className="block text-sm font-medium text-foreground/80">
                  Initial Liquidity Pool
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    id="initial_liquidity"
                    name="initial_liquidity"
                    value={formData.initial_liquidity}
                    onChange={handleChange}
                    min="100"
                    max="10000"
                    className="block w-full rounded-md bg-background border-border focus:border-primary focus:ring-primary sm:text-sm px-4 py-3 transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-sm text-foreground/60">100-10000</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="relative">
                  <label htmlFor="min_trade_amount" className="block text-sm font-medium text-foreground/80">
                    Minimum Trade Amount
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-foreground/60 sm:text-sm">KES</span>
                    </div>
                    <input
                      type="number"
                      id="min_trade_amount"
                      name="min_trade_amount"
                      value={formData.min_trade_amount}
                      onChange={handleChange}
                      min="1"
                      className="block w-full pl-11 rounded-md bg-background border-border focus:border-primary focus:ring-primary sm:text-sm px-4 py-3 transition-colors"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label htmlFor="max_trade_amount" className="block text-sm font-medium text-foreground/80">
                    Maximum Trade Amount
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-foreground/60 sm:text-sm">KES</span>
                    </div>
                    <input
                      type="number"
                      id="max_trade_amount"
                      name="max_trade_amount"
                      value={formData.max_trade_amount}
                      onChange={handleChange}
                      min="1"
                      className="block w-full pl-11 rounded-md bg-background border-border focus:border-primary focus:ring-primary sm:text-sm px-4 py-3 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
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
