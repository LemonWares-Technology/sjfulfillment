import { useEffect, useState } from 'react';

export default function GlobalNetworkModal() {
  const [show, setShow] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    function handleNetworkModal(e: any) {
      setShow(true);
      setReconnecting(!!e.detail?.reconnecting);
      let reconnectInterval = setInterval(async () => {
        // Check browser online status
        if (navigator.onLine) {
          // Try to fetch a public resource to confirm connectivity
          try {
            await fetch('https://www.google.com/favicon.ico', { method: 'HEAD', mode: 'no-cors' });
            setShow(false);
            clearInterval(reconnectInterval);
          } catch {
            setReconnecting(true);
          }
        } else {
          setReconnecting(true);
        }
      }, 2000);
      return () => clearInterval(reconnectInterval);
    }
    window.addEventListener('network-modal', handleNetworkModal);
    return () => {
      window.removeEventListener('network-modal', handleNetworkModal);
    };
  }, []);

  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">Network Error</h2>
        <p className="text-gray-700 mb-4">Unable to reach the server.</p>
        <p className="text-amber-700 font-semibold">{reconnecting ? 'Reconnecting...' : 'Please check your connection.'}</p>
      </div>
    </div>
  );
}
