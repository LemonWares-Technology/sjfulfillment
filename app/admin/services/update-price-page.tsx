import { useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function UpdateServicePricePage() {
  const { data, error, mutate } = useSWR('/api/services', fetcher);
  const [selectedService, setSelectedService] = useState<string>('');
  const [newPrice, setNewPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (error) return <div>Error loading services.</div>;
  if (!data) return <div>Loading...</div>;

  const handleUpdate = async () => {
    if (!selectedService || newPrice <= 0) {
      setMessage('Select a service and enter a valid price.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/services/update-price', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: selectedService, newPrice })
      });
      const result = await res.json();
      if (res.ok) {
        setMessage('Service price updated successfully.');
        mutate();
      } else {
        setMessage(result.error || 'Failed to update price.');
      }
    } catch (err) {
      setMessage('Error updating price.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Update Service Price</h2>
      <div className="mb-4">
        <label className="block mb-2">Select Service:</label>
        <select
          className="w-full p-2 border rounded"
          value={selectedService}
          onChange={e => setSelectedService(e.target.value)}
        >
          <option value="">-- Select --</option>
          {data.map((service: any) => (
            <option key={service.id} value={service.id}>
              {service.name} (Current: ₦{service.price})
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-2">New Price (₦):</label>
        <input
          type="number"
          className="w-full p-2 border rounded"
          value={newPrice}
          onChange={e => setNewPrice(Number(e.target.value))}
          min={1}
        />
      </div>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={handleUpdate}
        disabled={loading}
      >
        {loading ? 'Updating...' : 'Update Price'}
      </button>
      {message && <div className="mt-4 text-green-600">{message}</div>}
    </div>
  );
}
