import { XMarkIcon, ClipboardDocumentIcon, CheckIcon, EyeIcon, EyeSlashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface ViewSecretKeyModalProps {
  isOpen: boolean;
  publicKey: string;
  secretKey: string;
  onClose: () => void;
}

export default function ViewSecretKeyModal({ isOpen, publicKey, secretKey, onClose }: ViewSecretKeyModalProps) {
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[5px] shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">API Key Created</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-4 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 mb-2">
              <CheckIcon className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Copy Your API Keys</h3>
            <p className="text-sm text-gray-500">Your secret key will only be shown once. Please copy and store it securely.</p>
          </div>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Public Key</label>
              <div className="relative">
                <input type="text" value={publicKey} readOnly className="w-full px-4 py-3 border border-gray-300 rounded-[5px] bg-gray-50 text-sm font-mono pr-20" />
                <button type="button" onClick={() => copyToClipboard(publicKey, 'public')} className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-[5px] transition-colors" title="Copy to clipboard">
                  {copied === 'public' ? <CheckIcon className="h-5 w-5 text-green-600" /> : <ClipboardDocumentIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Secret Key</label>
              <div className="relative">
                <input type={showSecret ? 'text' : 'password'} value={secretKey} readOnly className="w-full px-4 py-3 border border-gray-300 rounded-[5px] bg-gray-50 text-sm font-mono pr-20" />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                  <button type="button" onClick={() => setShowSecret(!showSecret)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-[5px] transition-colors" title={showSecret ? 'Hide secret key' : 'Show secret key'}>
                    {showSecret ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                  <button type="button" onClick={() => copyToClipboard(secretKey, 'secret')} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-[5px] transition-colors" title="Copy to clipboard">
                    {copied === 'secret' ? <CheckIcon className="h-5 w-5 text-green-600" /> : <ClipboardDocumentIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-[5px] p-4 mb-6">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-400 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-amber-800">Important Security Notice</h3>
                <p className="text-sm text-amber-700 mt-1">Your secret key will only be shown once. Make sure to copy and store it securely. You won't be able to retrieve it again.</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-[5px] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
