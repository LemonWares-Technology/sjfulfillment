"use client";

import { useAuth } from "@/app/lib/auth-context";
import DashboardLayout from "@/app/components/dashboard-layout";
import { useApi } from "@/app/lib/use-api";
import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/app/lib/utils";
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import SearchBar from "@/app/components/search-bar";
import FilterSelect from "@/app/components/filter-select";
import ProductModal from "@/app/components/product-modal";
import BulkOperationsModal from "@/app/components/bulk-operations-modal";
import ExportModal from "@/app/components/export-modal";

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  category: string;
  weight: number;
  dimensions: string;
  isActive: boolean;
  createdAt: string;
  images?: string[];
  merchant: {
    businessName: string;
  };
}

export default function ProductsPage() {
  const { user } = useAuth();
  const { get, delete: deleteProduct, loading } = useApi();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await get<Product[]>("/api/products", { silent: true });
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
    }
  };

  const handleDelete = async (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(`/api/products/${productId}`);
        setProducts(products.filter((p) => p.id !== productId));
      } catch (error) {
        console.error("Failed to delete product:", error);
      }
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleCloseModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = () => {
    fetchProducts();
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
    setSelectAll(!selectAll);
  };

  const handleBulkOperation = () => {
    if (selectedProducts.length === 0) return;
    setShowBulkModal(true);
  };

  const handleBulkComplete = () => {
    setSelectedProducts([]);
    setSelectAll(false);
    fetchProducts();
  };

  const filteredProducts = (products || []).filter(
    (product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === "ALL" || product.category === categoryFilter;
      const matchesStatus = statusFilter === "ALL" || 
                           (statusFilter === "ACTIVE" && product.isActive) ||
                           (statusFilter === "INACTIVE" && !product.isActive);
      
      return matchesSearch && matchesCategory && matchesStatus;
    }
  );

  // Get unique categories for filter
  const categories = Array.from(new Set(products.map(p => p.category))).map(cat => ({
    value: cat,
    label: cat
  }));

  return (
    <DashboardLayout userRole={user?.role || "MERCHANT_ADMIN"}>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Products</h1>
              <p className="mt-2 text-gray-600">Manage your product catalog</p>
            </div>
            <div className="flex space-x-3">
              {selectedProducts.length > 0 && (
                <button
                  onClick={handleBulkOperation}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
                >
                  <CheckIcon className="h-5 w-5 mr-2" />
                  Bulk Actions ({selectedProducts.length})
                </button>
              )}
              <button
                onClick={() => setShowExportModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Export
              </button>
              <button
                onClick={handleAddProduct}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Product
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                placeholder="Search products by name, SKU, or description..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
            </div>
            <div className="sm:w-48">
              <FilterSelect
                options={categories}
                value={categoryFilter}
                onChange={setCategoryFilter}
                placeholder="All Categories"
              />
            </div>
            <div className="sm:w-48">
              <FilterSelect
                options={[
                  { value: "ACTIVE", label: "Active" },
                  { value: "INACTIVE", label: "Inactive" }
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="All Status"
              />
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {product.images && product.images.length > 0 ? (
                            <div className="flex-shrink-0 h-12 w-12 mr-4">
                              <img
                                className="h-12 w-12 rounded-md object-cover"
                                src={product.images[0]}
                                alt={product.name}
                              />
                            </div>
                          ) : (
                            <div className="flex-shrink-0 h-12 w-12 mr-4 bg-gray-200 rounded-md flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            product.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(product.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-900"
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

            {filteredProducts.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No products found</p>
              </div>
            )}
          </div>
        </div>

        {/* Product Modal */}
        <ProductModal
          isOpen={showProductModal}
          onClose={handleCloseModal}
          product={editingProduct}
          onSave={handleSaveProduct}
        />

        {/* Bulk Operations Modal */}
        <BulkOperationsModal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          operation={{
            type: 'products',
            action: '',
            selectedItems: selectedProducts
          }}
          onComplete={handleBulkComplete}
        />

        {/* Export Modal */}
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          type="products"
          selectedItems={selectedProducts.length > 0 ? selectedProducts : undefined}
          filters={{
            category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
            status: statusFilter !== 'ALL' ? statusFilter : undefined
          }}
        />
      </div>
    </DashboardLayout>
  );
}
