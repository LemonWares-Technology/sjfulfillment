
'use client'

import { useAuth } from '@/app/lib/auth-context'
import DashboardLayout from '@/app/components/dashboard-layout'
import { useApi } from '@/app/lib/use-api'
import { useEffect, useState } from 'react'
import { formatCurrency, formatDate } from '@/app/lib/utils'
import { useCurrency } from '@/app/lib/currency-context';
import { EyeIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import SearchBar from '@/app/components/search-bar'
import FilterSelect from '@/app/components/filter-select'
import Pagination from '@/app/components/pagination'

export default function RefundRequestsPage() {
  const { user } = useAuth();
  const { get, loading } = useApi();
  // Remove duplicate and incorrect selectedCurrency declaration
  const [refundRequests, setRefundRequests] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    async function fetchRefundRequests() {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10',
          ...(status && { status }),
          ...(search && { search }),
        });
        const data = await get(`/api/refund-requests?${params.toString()}`);
        setRefundRequests(Array.isArray(data.refundRequests) ? data.refundRequests : []);
        setTotalPages(data.pagination?.totalPages || 1);
        setError('');
      } catch (err: any) {
        setError(err.message || 'Failed to load refund requests');
      }
    }
    fetchRefundRequests();
  }, [page, status, search]);

  if (error) {
    return (
      <DashboardLayout userRole={user?.role || 'SJFS_ADMIN'}>
        <div className="p-6 text-red-600">{error}</div>
      </DashboardLayout>
    );
  }
  if (loading) {
    return (
      <DashboardLayout userRole={user?.role || 'SJFS_ADMIN'}>
        <div className="p-6 w-full h-full flex items-center justify-center text-white">Loading...</div>
      </DashboardLayout>
    );
  }

  const { currency: selectedCurrency } = useCurrency();

  return (
    <DashboardLayout userRole={user?.role || 'SJFS_ADMIN'}>
      <div className="p-6">
        <div className="bg-white/30 rounded-[5px] shadow p-6">
          <h1 className="text-2xl font-bold mb-4 text-[#f08c17]">Refund Requests</h1>
          <div className="flex gap-4 mb-4">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by order/customer..." />
            {/* Remove label prop, use only options, value, onChange for FilterSelect */}
            <FilterSelect
              options={[{ value: '', label: 'All' }, { value: 'PENDING', label: 'Pending' }, { value: 'APPROVED', label: 'Approved' }, { value: 'REJECTED', label: 'Rejected' }]}
              value={status}
              onChange={setStatus}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border rounded mb-4 bg-white/30">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left">Order</th>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Requested By</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {refundRequests.length === 0 ? (
                  <tr><td colSpan={7} className="p-4 text-center">No refund requests found.</td></tr>
                ) : (
                  refundRequests.map((req: any) => (
                    <tr key={req.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{req.order?.orderNumber || '-'}</td>
                      <td className="p-3">{req.order?.customerName || '-'}</td>
                      <td className="p-3">{formatCurrency(req.requestedAmount, selectedCurrency as 'NGN' | 'USD' | 'EUR')}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${req.status === 'APPROVED' ? 'bg-green-100 text-green-700' : req.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{req.status}</span>
                      </td>
                      <td className="p-3">{req.requestedByUser?.firstName} {req.requestedByUser?.lastName}</td>
                      <td className="p-3">{formatDate(req.createdAt)}</td>
                      <td className="p-3 flex gap-2">
                        <button className="text-blue-600 hover:underline"><EyeIcon className="w-5 h-5" /></button>
                        {req.status === 'PENDING' && <button className="text-green-600 hover:underline"><CheckIcon className="w-5 h-5" /></button>}
                        {req.status === 'PENDING' && <button className="text-red-600 hover:underline"><XMarkIcon className="w-5 h-5" /></button>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Fix Pagination props: add totalItems and itemsPerPage if required by PaginationProps */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={refundRequests.length}
            itemsPerPage={10}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
