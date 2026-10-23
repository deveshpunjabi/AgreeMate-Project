'use client';

import React, { useState, useEffect } from 'react';
import {
  Store,
  Plus,
  Search,
  MessageCircle,
  CheckCircle2,
  Phone,
  X,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface KhatabookEntry {
  id: string;
  customerName: string;
  customerPhone: string;
  itemName: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: 'Active Tab' | 'Payment Due' | 'Cleared';
}


export default function KhatabookPage() {
  const [entries, setEntries] = useState<KhatabookEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Load persisted entries on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('agreemate_khatabook_entries');
      if (saved) {
        setEntries(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
    setIsLoaded(true);
  }, []);

  // Save entries to localStorage on changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('agreemate_khatabook_entries', JSON.stringify(entries));
      } catch {
        // ignore
      }
    }
  }, [entries, isLoaded]);

  // New Entry Form State
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.customerPhone.includes(searchTerm) ||
      entry.itemName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && entry.status === statusFilter;
  });

  const totalOutstanding = entries
    .filter((e) => e.status !== 'Cleared')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalCleared = entries
    .filter((e) => e.status === 'Cleared')
    .reduce((sum, e) => sum + e.amount, 0);

  const activeTabsCount = entries.filter((e) => e.status === 'Active Tab').length;
  const overdueCount = entries.filter((e) => e.status === 'Payment Due').length;

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName || !newCustomerPhone || !newItemName || !newAmount) return;

    const newEntry: KhatabookEntry = {
      id: `kh_${Date.now()}`,
      customerName: newCustomerName,
      customerPhone: newCustomerPhone,
      itemName: newItemName,
      amount: Number(newAmount),
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: newDueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'Active Tab',
    };

    setEntries([newEntry, ...entries]);
    setIsAddModalOpen(false);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewItemName('');
    setNewAmount('');
    setNewDueDate('');
  };

  const handleMarkCleared = (id: string) => {
    setEntries(entries.map((e) => (e.id === id ? { ...e, status: 'Cleared' } : e)));
  };

  const handleSendWhatsappReminder = (entry: KhatabookEntry) => {
    const text = encodeURIComponent(
      `Hello ${entry.customerName}, this is a gentle reminder regarding your active Khatabook credit tab for "${entry.itemName}" (Amount: ₹${entry.amount.toLocaleString('en-IN')}). Due return date: ${entry.dueDate}. Thank you!`
    );
    window.open(`https://wa.me/91${entry.customerPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-7 animate-fade-in-up w-full select-none">
      
      {/* Hero Header */}
      <div className="bg-white/85 backdrop-blur-2xl border border-white/90 rounded-[28px] p-6 sm:p-7 shadow-[0_16px_45px_rgba(0,58,94,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />

        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800">
            <Store className="w-3.5 h-3.5 text-emerald-600" />
            <span>Khatabook Store Ledger</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#003a5e] tracking-tight">
            Customer Credit &amp; Tab Ledger 📖
          </h1>
          <p className="font-body text-xs text-[#1e2c3a]/75 font-medium max-w-xl leading-relaxed">
            Manage customer tabs, track outstanding credit balances, and send automated payment &amp; return reminders.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 z-10">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="btn-shimmer-luxe h-10.5 px-5 rounded-xl text-xs font-mono font-bold bg-[#003a5e] hover:bg-[#002a45] text-white transition-all cursor-pointer shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-[#0ea5e9]" />
            <span>New Credit Entry</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/85 backdrop-blur-2xl border border-white/90 rounded-[24px] p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            TOTAL OUTSTANDING CREDIT
          </span>
          <p className="font-display font-black text-2.5xl text-[#003a5e] tabular-nums">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="bg-white/85 backdrop-blur-2xl border border-white/90 rounded-[24px] p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            ACTIVE CUSTOMER TABS
          </span>
          <p className="font-display font-black text-2.5xl text-[#0068a3] tabular-nums">
            {activeTabsCount} Tabs
          </p>
        </div>

        <div className="bg-white/85 backdrop-blur-2xl border border-white/90 rounded-[24px] p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            PAYMENT DUE / OVERDUE
          </span>
          <p className="font-display font-black text-2.5xl text-amber-700 tabular-nums">
            {overdueCount} Accounts
          </p>
        </div>

        <div className="bg-white/85 backdrop-blur-2xl border border-white/90 rounded-[24px] p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            CLEARED THIS MONTH
          </span>
          <p className="font-display font-black text-2.5xl text-emerald-700 tabular-nums">
            ₹{totalCleared.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Search & Filter Header Bar */}
      <div className="bg-white/85 backdrop-blur-2xl border border-white/90 rounded-[28px] p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search customer name, phone or item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-xs font-medium text-[#003a5e] outline-none focus:border-[#0ea5e9]"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {['All', 'Active Tab', 'Payment Due', 'Cleared'].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`h-8 px-3.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                  statusFilter === filter
                    ? 'bg-[#003a5e] text-white border-[#003a5e]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Khatabook Entries Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="text-left px-4 py-3 text-[10px] font-mono font-extrabold text-[#003a5e] uppercase tracking-wider">Customer &amp; Contact</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono font-extrabold text-[#003a5e] uppercase tracking-wider">Item / Store Tab</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono font-extrabold text-[#003a5e] uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono font-extrabold text-[#003a5e] uppercase tracking-wider">Due Date</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono font-extrabold text-[#003a5e] uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-[10px] font-mono font-extrabold text-[#003a5e] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                    <Store className="size-8 mx-auto mb-2 text-slate-300 stroke-1" />
                    <p className="font-semibold text-slate-600">No Khatabook entries found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click "New Credit Entry" above to add your first customer tab.</p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-sky-50/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="text-xs font-bold text-[#003a5e]">{entry.customerName}</p>
                        <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" /> {entry.customerPhone}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="text-xs font-medium text-[#003a5e] max-w-xs">{entry.itemName}</p>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-xs font-bold text-[#003a5e] font-mono tabular-nums">
                        ₹{entry.amount.toLocaleString('en-IN')}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-xs text-slate-600 font-semibold tabular-nums">{entry.dueDate}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                        entry.status === 'Active Tab'
                          ? 'bg-sky-100 text-[#0068a3]'
                          : entry.status === 'Payment Due'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {entry.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {entry.status !== 'Cleared' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSendWhatsappReminder(entry)}
                              className="h-8 px-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
                              title="Send WhatsApp Reminder"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>WhatsApp</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleMarkCleared(entry.id)}
                              className="h-8 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Mark Paid</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Credit Entry Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />

          <div className="bg-white border border-slate-200 rounded-[28px] w-full max-w-md shadow-2xl relative z-10 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-bold text-[#003a5e] text-base">New Khatabook Entry</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEntry} className="space-y-3">
              <Input label="Customer Full Name *" placeholder="Rahul Verma" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} />
              <Input label="Mobile Number *" placeholder="98765 43210" value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} />
              <Input label="Item / Credit Detail *" placeholder="e.g. Store Goods Tab / DSLR Rental" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} />
              <Input label="Credit Amount (₹) *" type="number" placeholder="2500" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} />
              <Input label="Return / Due Date" type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Add Khatabook Tab
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
