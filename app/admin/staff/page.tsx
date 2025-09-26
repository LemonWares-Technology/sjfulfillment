'use client'

import { useAuth } from '@/app/lib/auth-context'
import DashboardLayout from '@/app/components/dashboard-layout'
import { useApi } from '@/app/lib/use-api'
import { useEffect, useState } from 'react'
import { formatDate } from '@/app/lib/utils'
import { PlusIcon, PencilIcon, TrashIcon, UserIcon, EyeIcon } from '@heroicons/react/24/outline'
import SearchBar from '@/app/components/search-bar'
import FilterSelect from '@/app/components/filter-select'

interface StaffMember {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  isActive: boolean
  emailVerified: string
  createdAt: string
  merchant: {
    id: string
    businessName: string
  } | null
}

interface NewStaffData {
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  password: string
  merchantId: string
}

export default function AdminStaffPage() {
  const { user } = useAuth()
  const { get, post, put, delete: deleteStaff, loading } = useApi()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [merchants, setMerchants] = useState<{id: string, businessName: string}[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [merchantFilter, setMerchantFilter] = useState('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [newStaffData, setNewStaffData] = useState<NewStaffData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'MERCHANT_STAFF',
    password: '',
    merchantId: ''
  })

  useEffect(() => {
    fetchStaff()
    fetchMerchants()
  }, [])

  const fetchStaff = async () => {
    try {
      const response = await get<{users: StaffMember[]}>('/api/users', { silent: true })
      setStaff(response?.users || [])
    } catch (error) {
      console.error('Failed to fetch staff:', error)
      setStaff([])
    }
  }

  const fetchMerchants = async () => {
    try {
      const response = await get<{merchants: {id: string, businessName: string}[]}>('/api/merchants', { silent: true })
      setMerchants(response?.merchants || [])
    } catch (error) {
      console.error('Failed to fetch merchants:', error)
      setMerchants([])
    }
  }

  const handleAddStaff = async () => {
    try {
      await post('/api/auth/register', newStaffData)
      setShowAddModal(false)
      
      // Show success message with login instructions
      alert(`Staff member created successfully!\n\nLogin Instructions:\nEmail: ${newStaffData.email}\nTemporary Password: ${newStaffData.password}\n\nPlease share these credentials with the staff member. They can reset their password using "Forgot Password" on the login page.`)
      
      setNewStaffData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'MERCHANT_STAFF',
        password: '',
        merchantId: ''
      })
      fetchStaff()
    } catch (error) {
      console.error('Failed to add staff member:', error)
    }
  }

  const handleUpdateStaff = async () => {
    if (!editingStaff) return
    
    try {
      await put(`/api/users/${editingStaff.id}`, {
        firstName: editingStaff.firstName,
        lastName: editingStaff.lastName,
        email: editingStaff.email,
        phone: editingStaff.phone,
        role: editingStaff.role,
        isActive: editingStaff.isActive
      })
      setEditingStaff(null)
      fetchStaff()
    } catch (error) {
      console.error('Failed to update staff member:', error)
    }
  }

  const handleDeactivateStaff = async (staffId: string) => {
    if (confirm('Are you sure you want to deactivate this staff member?')) {
      try {
        await deleteStaff(`/api/users/${staffId}`)
        fetchStaff()
      } catch (error) {
        console.error('Failed to deactivate staff member:', error)
      }
    }
  }

  const filteredStaff = (staff || []).filter(member => {
    const matchesSearch = member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.merchant?.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    
    const matchesRole = roleFilter === 'ALL' || member.role === roleFilter
    const matchesMerchant = merchantFilter === 'ALL' || member.merchant?.id === merchantFilter
    
    return matchesSearch && matchesRole && matchesMerchant
  })

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'SJFS_ADMIN': return 'SJF Admin'
      case 'MERCHANT_ADMIN': return 'Merchant Admin'
      case 'MERCHANT_STAFF': return 'Merchant Staff'
      case 'WAREHOUSE_STAFF': return 'Warehouse Staff'
      default: return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SJFS_ADMIN': return 'bg-red-100 text-red-800'
      case 'MERCHANT_ADMIN': return 'bg-purple-100 text-purple-800'
      case 'MERCHANT_STAFF': return 'bg-blue-100 text-blue-800'
      case 'WAREHOUSE_STAFF': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <DashboardLayout userRole="SJFS_ADMIN">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
              <p className="mt-2 text-gray-600">
                Manage all staff members across all merchants
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Staff Member
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                placeholder="Search staff by name, email, or merchant..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
            </div>
            <div className="sm:w-48">
              <FilterSelect
                options={[
                  { value: 'SJFS_ADMIN', label: 'SJF Admin' },
                  { value: 'MERCHANT_ADMIN', label: 'Merchant Admin' },
                  { value: 'MERCHANT_STAFF', label: 'Merchant Staff' },
                  { value: 'WAREHOUSE_STAFF', label: 'Warehouse Staff' }
                ]}
                value={roleFilter}
                onChange={setRoleFilter}
                placeholder="All Roles"
              />
            </div>
            <div className="sm:w-48">
              <FilterSelect
                options={merchants.map(m => ({ value: m.id, label: m.businessName }))}
                value={merchantFilter}
                onChange={setMerchantFilter}
                placeholder="All Merchants"
              />
            </div>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Merchant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStaff.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-gray-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {member.firstName} {member.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{member.email}</div>
                        <div className="text-sm text-gray-500">{member.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {member.merchant?.businessName || 'No Merchant'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(member.role)}`}>
                          {getRoleDisplayName(member.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          member.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(member.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingStaff(member)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Staff Member"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeactivateStaff(member.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Deactivate Staff Member"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredStaff.length === 0 && (
              <div className="text-center py-8">
                <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No staff members found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding your first team member.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Add Staff Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Add Staff Member</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={newStaffData.firstName}
                        onChange={(e) => setNewStaffData({...newStaffData, firstName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={newStaffData.lastName}
                        onChange={(e) => setNewStaffData({...newStaffData, lastName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newStaffData.email}
                      onChange={(e) => setNewStaffData({...newStaffData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={newStaffData.phone}
                      onChange={(e) => setNewStaffData({...newStaffData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Merchant
                    </label>
                    <select
                      value={newStaffData.merchantId}
                      onChange={(e) => setNewStaffData({...newStaffData, merchantId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Merchant</option>
                      {merchants.map(merchant => (
                        <option key={merchant.id} value={merchant.id}>
                          {merchant.businessName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={newStaffData.role}
                      onChange={(e) => setNewStaffData({...newStaffData, role: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="MERCHANT_STAFF">Merchant Staff</option>
                      <option value="MERCHANT_ADMIN">Merchant Admin</option>
                      <option value="WAREHOUSE_STAFF">Warehouse Staff</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Temporary Password
                    </label>
                    <input
                      type="password"
                      value={newStaffData.password}
                      onChange={(e) => setNewStaffData({...newStaffData, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Set a temporary password"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Staff will use this password for first login. They can reset it using "Forgot Password" on the login page.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddStaff}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                  >
                    Add Staff Member
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Staff Modal */}
        {editingStaff && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Edit Staff Member</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={editingStaff.firstName}
                        onChange={(e) => setEditingStaff({...editingStaff, firstName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={editingStaff.lastName}
                        onChange={(e) => setEditingStaff({...editingStaff, lastName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editingStaff.email}
                      onChange={(e) => setEditingStaff({...editingStaff, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={editingStaff.phone}
                      onChange={(e) => setEditingStaff({...editingStaff, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={editingStaff.role}
                      onChange={(e) => setEditingStaff({...editingStaff, role: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="MERCHANT_STAFF">Merchant Staff</option>
                      <option value="MERCHANT_ADMIN">Merchant Admin</option>
                      <option value="WAREHOUSE_STAFF">Warehouse Staff</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingStaff.isActive}
                      onChange={(e) => setEditingStaff({...editingStaff, isActive: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    <label className="text-sm text-gray-700">Active</label>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setEditingStaff(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateStaff}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                  >
                    Update Staff Member
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
