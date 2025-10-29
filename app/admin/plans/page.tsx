"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/app/components/dashboard-layout";
import { useApi } from "@/app/lib/use-api";
import { formatCurrency } from "@/app/lib/utils";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  features: string[];
  isActive: boolean;
  discount: number; // percent discount for merchants
}

export default function AdminPlansPage() {
  const { get, put, loading } = useApi();
  const [services, setServices] = useState<Service[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState<string>("");
  const [discountInput, setDiscountInput] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const data = await get<Service[]>("/api/services");
    setServices(data);
  };

  const startEdit = (service: Service) => {
    setEditId(service.id);
    setPriceInput(service.price.toString());
    setDiscountInput(service.discount?.toString() || "0");
  };

  const cancelEdit = () => {
    setEditId(null);
    setPriceInput("");
    setDiscountInput("");
  };

  const saveEdit = async (service: Service) => {
    setSaving(true);
    try {
      const result = await put(`/api/services/${service.id}`, {
        price: Number(priceInput),
      });
      if (result && result.success === false) {
        alert(result.error || "Failed to update plan.");
      } else {
        cancelEdit();
        fetchServices();
      }
    } catch (err) {
      alert("Failed to update plan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout userRole="SJFS_ADMIN">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-[#f08c17] mb-8">Manage Plans</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            // Calculate discounted price
            const discountedPrice = service.discount ? service.price * (1 - service.discount / 100) : service.price;
            return (
              <div key={service.id} className="bg-white/30 rounded-[5px] p-6 shadow">
                <h2 className="text-xl font-semibold text-[#f08c17] mb-2">{service.name}</h2>
                <p className="text-sm text-white/80 mb-2">{service.description}</p>
                <div className="mb-2 text-lg font-bold text-[#f08c17]">
                  Price: {formatCurrency(service.price)} / day
                </div>
                {service.discount > 0 && (
                  <div className="mb-2 p-3 rounded bg-green-100/20 border border-green-400 text-green-700 font-semibold">
                    <div className="text-sm">You have a discount from the merchant!</div>
                    <div className="text-xs text-green-700">Original Price: <span className="line-through">{formatCurrency(service.price)}</span></div>
                    <div className="text-xs text-green-700">Discount: {service.discount}%</div>
                    <div className="text-base font-bold">Discounted Price: {formatCurrency(discountedPrice)} / day</div>
                  </div>
                )}
                {editId === service.id ? (
                  <div className="mt-4 space-y-2">
                    <input
                      type="number"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      className="w-full px-3 py-2 rounded border"
                      placeholder="Price"
                    />
                    <input
                      type="number"
                      disabled
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value)}
                      className="w-full px-3 py-2 rounded border disabled:cursor-not-allowed bg-gray-100"
                      placeholder="Discount (%)"
                    />
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => saveEdit(service)}
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
                    onClick={() => startEdit(service)}
                    className="mt-4 bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-4 py-2 rounded"
                  >
                    Edit
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
