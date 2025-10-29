"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/app/components/dashboard-layout";
import { useApi } from "@/app/lib/use-api";
import { formatCurrency, formatNumber } from "@/app/lib/utils";

interface Merchant {
  id: string;
  businessName: string;
  email: string;
  discount: number; // percent discount
  accumulatedCharges?: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
  };
}

interface MerchantSubscription {
  serviceId: string;
  priceAtSubscription: number;
  quantity: number;
  status: string;
}
export default function AdminDiscountsPage() {

  const { get, put, loading } = useApi();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [subscriptions, setSubscriptions] = useState<{[merchantId: string]: MerchantSubscription[]}>( {} );
  const [editId, setEditId] = useState<string | null>(null);
  const [discountInput, setDiscountInput] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [tab, setTab] = useState<'all' | 'with' | 'without'>('all');

  useEffect(() => {
    fetchMerchants();
  }, [search, page]);

  const fetchMerchants = async () => {
    const response = await get<any>(`/api/merchants?page=${page}&limit=9${search ? `&search=${encodeURIComponent(search)}` : ""}`);
    setMerchants(response?.merchants || []);
    setTotalPages(response?.pagination?.pages || 1);
    // Fetch subscriptions for each merchant
    const subs: {[merchantId: string]: MerchantSubscription[]} = {};
    for (const merchant of response?.merchants || []) {
      try {
        const subData = await get<MerchantSubscription[]>(`/api/merchants/${merchant.id}/subscriptions`);
        subs[merchant.id] = subData || [];
      } catch {
        subs[merchant.id] = [];
      }
    }
    setSubscriptions(subs);
  };

  const startEdit = (merchant: Merchant) => {
    setEditId(merchant.id);
    setDiscountInput(merchant.discount?.toString() || "0");
  };

  const cancelEdit = () => {
    setEditId(null);
    setDiscountInput("");
  };

  const saveEdit = async (merchant: Merchant) => {
    setSaving(true);
    await put(`/api/merchants/${merchant.id}/discount`, {
      discount: parseFloat(discountInput),
    });
    setSaving(false);
    cancelEdit();
    fetchMerchants();
  };

  const openMerchantModal = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
  };

  const closeMerchantModal = () => {
    setSelectedMerchant(null);
  };

  return (
    <DashboardLayout userRole="ADMIN">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-[#f08c17] mb-8">Manage Merchant Discounts</h1>
        {/* Tabs for filtering merchants by discount status */}
        <div className="mb-6 flex gap-2">
          <button
            className={`px-4 py-2 rounded font-medium ${tab === 'all' ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-800'}`}
            onClick={() => setTab('all')}
          >All Merchants</button>
          <button
            className={`px-4 py-2 rounded font-medium ${tab === 'with' ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-800'}`}
            onClick={() => setTab('with')}
          >With Discount</button>
          <button
            className={`px-4 py-2 rounded font-medium ${tab === 'without' ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-800'}`}
            onClick={() => setTab('without')}
          >Without Discount</button>
        </div>
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search merchant by name or email..."
            className="w-full md:w-1/3 px-3 py-2 rounded border"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(tab === 'all'
            ? merchants
            : tab === 'with'
              ? merchants.filter(m => m.discount && m.discount > 0)
              : merchants.filter(m => !m.discount || m.discount === 0)
          ).map((merchant) => {
            // Calculate daily cost from active subscriptions
            const merchantSubs = subscriptions[merchant.id] || [];
            const dailyCost = merchantSubs
              .filter(sub => sub.status === 'ACTIVE')
              .reduce((total, sub) => total + (Number(sub.priceAtSubscription) * sub.quantity), 0);
            const discountedDailyCost = merchant.discount > 0 ? dailyCost * (1 - merchant.discount / 100) : dailyCost;
            const totalRevenue = merchant.accumulatedCharges?.total || 0;
            const paid = merchant.accumulatedCharges?.paid || 0;
            const pending = merchant.accumulatedCharges?.pending || 0;
            const overdue = merchant.accumulatedCharges?.overdue || 0;
            return (
              <div key={merchant.id} className="bg-white/30 rounded-[5px] p-6 shadow">
                {/* Discount block styled like merchant screen */}
                
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-semibold text-[#f08c17]">{merchant.businessName}</h2>
                  <button
                    onClick={() => openMerchantModal(merchant)}
                    className="text-xs text-amber-500 underline"
                  >View</button>
                </div>
                <div className="mb-2 text-sm text-white/80"><strong>Business Email:</strong> {merchant.email}</div>
                <div className="mb-2 text-sm text-white/80"><strong>Discount:</strong> {merchant.discount || 0}%</div>
                <div className="mb-2 text-sm text-white/80">
                  <strong>Initial Daily Cost:</strong> <span className="line-through text-red-400">{formatCurrency(dailyCost)}</span>
                </div>
                <div className="mb-2 text-sm text-green-400 font-semibold">
                  <strong>Discounted Daily Cost:</strong> {formatCurrency(discountedDailyCost)} {merchant.discount > 0 && <span className="text-xs text-white/60">(after {merchant.discount}% discount)</span>}
                </div>
                
                {editId === merchant.id ? (
                  <div className="mt-4 space-y-2">
                    <input
                      type="number"
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value)}
                      className="w-full px-3 py-2 rounded border"
                      placeholder="Discount (%)"
                    />
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => saveEdit(merchant)}
                        disabled={saving}
                        className="bg-amber-500 text-white px-4 py-2 rounded"
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(merchant)}
                    className="mt-4 bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-4 py-2 rounded"
                  >
                    Edit Discount
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination Controls - now beneath the grid */}
        <div className="flex gap-2 items-center justify-center mt-8">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-2 rounded bg-gray-200 text-gray-800 disabled:opacity-50"
          >Prev</button>
          <span className="text-sm text-white">Page {page} of {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-2 rounded bg-gray-200 text-gray-800 disabled:opacity-50"
          >Next</button>
        </div>

        {/* Merchant Details Modal */}
        {selectedMerchant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={closeMerchantModal}></div>
            <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-md mx-4 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Merchant Details</h3>
              <div className="mb-2 text-sm text-gray-700"><strong>Name:</strong> {selectedMerchant.businessName}</div>
              <div className="mb-2 text-sm text-gray-700"><strong>Business Email:</strong> {selectedMerchant.email}</div>
              <div className="mb-2 text-sm text-gray-700"><strong>Discount:</strong> {selectedMerchant.discount || 0}%</div>
              <div className="mb-2 text-sm text-gray-700"><strong>Total Revenue:</strong> ₦{selectedMerchant.accumulatedCharges?.total?.toLocaleString() || 0}</div>
              <div className="mb-2 text-sm text-gray-700"><strong>Paid:</strong> ₦{selectedMerchant.accumulatedCharges?.paid?.toLocaleString() || 0}</div>
              <div className="mb-2 text-sm text-gray-700"><strong>Pending:</strong> ₦{selectedMerchant.accumulatedCharges?.pending?.toLocaleString() || 0}</div>
              <div className="mb-2 text-sm text-gray-700"><strong>Overdue:</strong> ₦{selectedMerchant.accumulatedCharges?.overdue?.toLocaleString() || 0}</div>
              <button
                onClick={closeMerchantModal}
                className="mt-4 bg-amber-500 text-white px-4 py-2 rounded"
              >Close</button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
