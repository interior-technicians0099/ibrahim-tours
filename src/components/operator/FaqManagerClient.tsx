'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { saveFaqAction, deleteFaqAction } from '@/lib/actions/faq-actions';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export default function FaqManagerClient({ initialFaqs }: { initialFaqs: FaqItem[] }) {
  const [faqs, setFaqs] = useState<FaqItem[]>(initialFaqs);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('Booking & Payment');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const startNew = () => {
    setEditingFaqId('NEW');
    setQuestion('');
    setAnswer('');
    setCategory('Booking & Payment');
    setSortOrder(faqs.length);
    setIsActive(true);
    setErrorMessage(null);
  };

  const startEdit = (f: FaqItem) => {
    setEditingFaqId(f.id);
    setQuestion(f.question);
    setAnswer(f.answer);
    setCategory(f.category || 'General');
    setSortOrder(f.sortOrder);
    setIsActive(f.isActive);
    setErrorMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      setErrorMessage('Question and answer are required.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const result = await saveFaqAction({
        id: editingFaqId !== 'NEW' ? editingFaqId! : undefined,
        question,
        answer,
        category,
        sortOrder,
        isActive,
      });

      if (result.success && result.faq) {
        if (editingFaqId === 'NEW') {
          setFaqs([...faqs, result.faq]);
        } else {
          setFaqs(faqs.map((f) => (f.id === editingFaqId ? result.faq : f)));
        }
        setSuccessMessage('FAQ item saved successfully.');
        setTimeout(() => setSuccessMessage(null), 3000);
        setEditingFaqId(null);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save FAQ.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, qText: string) => {
    if (!confirm(`Are you sure you want to delete FAQ: "${qText}"?`)) return;
    try {
      await deleteFaqAction(id);
      setFaqs(faqs.filter((f) => f.id !== id));
      setSuccessMessage('FAQ item deleted successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to delete FAQ.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Header */}
      <header className="bg-slate-900/80 border-b border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/operator"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white">Frequently Asked Questions (FAQ)</h1>
            <p className="text-xs text-slate-400">Manage tourist knowledgebase and booking clarity</p>
          </div>
        </div>

        <button
          type="button"
          onClick={startNew}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Question</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal / Form */}
        {editingFaqId && (
          <form
            onSubmit={handleSave}
            className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white">
                {editingFaqId === 'NEW' ? 'Create New FAQ' : 'Edit FAQ Item'}
              </h2>
              <button
                type="button"
                onClick={() => setEditingFaqId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Question *
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. How does full prepayment work for Zanzibar tours?"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Booking & Payment, Transfers, Island Tours"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Detailed Answer *
                </label>
                <textarea
                  rows={4}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  required
                  placeholder="Provide clear, transparent guidelines for travelers..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-emerald-500 bg-slate-950"
                  />
                  <span className="text-xs font-semibold text-slate-300">Published in FAQ</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingFaqId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-extrabold flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Question'}</span>
              </button>
            </div>
          </form>
        )}

        {/* FAQs List */}
        <div className="space-y-3">
          {faqs.map((f) => (
            <div
              key={f.id}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    {f.category || 'General'}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      f.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {f.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <h3 className="font-bold text-white text-base">{f.question}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{f.answer}</p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>Order: #{f.sortOrder}</span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(f)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(f.id, f.question)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
