import { useEffect, useState } from 'react';
import { useNavigate } from '../lib/router';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/apiClient';

export function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [geminiKey, setGeminiKey] = useState('');
  const [maskedKey, setMaskedKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadKey = async () => {
      try {
        const response = await apiClient.getSettingsApiKey('gemini');
        setMaskedKey(response.key || '');
      } catch (error) {
        console.warn('Unable to load Gemini key', error);
      }
    };

    loadKey();
  }, []);

  if (!user) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-3">Settings</h2>
        <p className="text-sm text-gray-500">Please sign in to manage your AI key.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const response = await apiClient.saveSettingsApiKey(geminiKey, 'gemini');
      setMaskedKey(response.key || '');
      setGeminiKey('');
      setShowKey(false);
      setMessage(response.message || 'Your Gemini API key was saved successfully.');
    } catch (err: any) {
      setMessage(err.message || 'Failed to save your Gemini API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl space-y-8 page-enter">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900">AI Configuration</h2>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          Finsight uses a bring-your-own-key model to keep AI features free to use. Add your Gemini API key to enable AI categorization and spending insights.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Gemini API Key</h3>
          <p className="mt-2 text-sm text-gray-500">Your key is stored securely on the server and never revealed in full in the app.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Gemini API key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={(event) => setGeminiKey(event.target.value)}
                  placeholder={maskedKey ? `Saved key: ${maskedKey}` : 'Enter your Gemini API key'}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Saving...' : 'Save API Key'}
              </button>
              <button
                type="button"
                onClick={() => setGeminiKey('')}
                className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
            </div>

            {message && <p className="text-sm text-gray-700">{message}</p>}
          </form>

          <div className="mt-6 rounded-2xl border border-gray-100 bg-emerald-50 p-4 text-sm text-gray-700">
            <p className="font-medium text-gray-900">How to get a free Gemini API key</p>
            <ol className="mt-3 space-y-2 list-decimal pl-5 text-gray-700">
              <li>Go to Google AI Studio.</li>
              <li>Generate a Gemini API key for your project.</li>
              <li>Paste it here and save.</li>
            </ol>
            <a
              href="https://studio.google.ai/"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50"
            >
              Open Google AI Studio
            </a>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Key status</h3>
          <div className="mt-4 space-y-3 text-sm text-gray-700">
            <p><strong>Current Gemini key:</strong> {maskedKey ? maskedKey : 'No key configured'}</p>
            <p>AI features will use your Gemini API key first. If no key is configured, the app will prompt you to add one.</p>
            <p className="text-xs text-gray-500">Your key is masked for safety and never returned to the client in full.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/insights')}
            className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Back to Insights
          </button>
        </section>
      </div>
    </div>
  );
}

export default SettingsPage;
