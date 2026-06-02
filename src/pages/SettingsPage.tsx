import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/apiClient';

export function SettingsPage() {
  const { user } = useAuth();
  const [geminiKey, setGeminiKey] = useState('');
  const [nvidiaKey, setNvidiaKey] = useState('');
  const [persist, setPersist] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res = await apiClient.setApiKeys({ geminiKey: geminiKey || undefined, nvidiaKey: nvidiaKey || undefined, persist });
      setMessage(res.message || 'Keys updated');
    } catch (err: any) {
      setMessage(err.message || 'Failed to update keys');
    } finally {
      setLoading(false);
    }
  };

  // Basic client-side check: require upgraded plan
  if (!user) return <div className="p-6">Please sign in.</div>;
  if ((user.subscriptionPlan || 'free') === 'free') {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-3">Settings</h2>
        <p className="text-sm text-gray-500">Upgrade to a paid plan to configure API keys from the app.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-lg font-semibold mb-4">API Keys</h2>
      <p className="text-sm text-gray-500 mb-4">Add your AI provider keys here. Keys are saved to the running server process and optionally persisted to <strong>.env.local</strong>. Do not share keys publicly.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Google Gemini API Key</label>
          <input value={geminiKey} onChange={e => setGeminiKey(e.target.value)} placeholder="GEMINI_API_KEY" className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">NVIDIA API Key</label>
          <input value={nvidiaKey} onChange={e => setNvidiaKey(e.target.value)} placeholder="NVIDIA_API_KEY" className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" checked={persist} onChange={e => setPersist(e.target.checked)} />
          <label className="text-sm text-gray-600">Persist to server/.env.local (will overwrite keys in that file)</label>
        </div>

        <div className="flex items-center gap-2">
          <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-emerald-600 text-white">
            {loading ? 'Saving...' : 'Save Keys'}
          </button>
          <button type="button" onClick={() => { setGeminiKey(''); setNvidiaKey(''); setMessage(null); }} className="px-3 py-2 rounded border">Clear</button>
        </div>

        {message && <div className="text-sm text-gray-700 mt-2">{message}</div>}
      </form>
    </div>
  );
}

export default SettingsPage;
