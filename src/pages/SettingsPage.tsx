import { useEffect, useState } from 'react';
import { useNavigate } from '../lib/router';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/apiClient';

type Provider = 'gemini' | 'nvidia';

export function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeProvider, setActiveProvider] = useState<Provider>('nvidia');
  const [apiKey, setApiKey] = useState('');
  const [maskedKey, setMaskedKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [nvidiaKey, setNvidiaKey] = useState('');
  const [geminiKeyMasked, setGeminiKeyMasked] = useState('');

  const loadBothKeys = async () => {
    try {
      const [nvidiaResp, geminiResp] = await Promise.all([
        apiClient.getSettingsApiKey('nvidia').catch(() => ({ key: '' })),
        apiClient.getSettingsApiKey('gemini').catch(() => ({ key: '' }))
      ]);
      
      setNvidiaKey(nvidiaResp.key || '');
      setGeminiKeyMasked(geminiResp.key || '');
      setMaskedKey(activeProvider === 'nvidia' ? nvidiaResp.key || '' : geminiResp.key || '');
    } catch (error) {
      console.warn('Unable to load keys', error);
    }
  };

  // Load keys on mount and when provider changes
  useEffect(() => {
    loadBothKeys();
  }, [activeProvider]);

  // Reload keys when the window gains focus
  useEffect(() => {
    const handleFocus = () => {
      loadBothKeys();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [activeProvider]);

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
      const response = await apiClient.saveSettingsApiKey(apiKey, activeProvider);
      setMaskedKey(response.key || '');
      setApiKey('');
      setShowKey(false);
      setMessage(response.message || `Your ${activeProvider} API key was saved successfully.`);
      
      // Reload both keys after successful save
      await loadBothKeys();
    } catch (err: any) {
      setMessage(err.message || `Failed to save your ${activeProvider} API key.`);
    } finally {
      setLoading(false);
    }
  };

  const providerInfo = {
    nvidia: {
      title: 'NVIDIA API Key',
      description: 'Use NVIDIA\'s hosted inference for fast, free AI categorization.',
      learnMore: 'https://developer.nvidia.com/docs/nvidia-nim-overview',
      docs: 'NVIDIA API Documentation',
      steps: [
        'Go to NVIDIA NIM (developer.nvidia.com)',
        'Create a free API key',
        'Paste it here and save.',
      ],
    },
    gemini: {
      title: 'Google Gemini API Key',
      description: 'Use Google\'s Gemini model for AI-powered insights.',
      learnMore: 'https://studio.google.ai/',
      docs: 'Google AI Studio',
      steps: [
        'Go to Google AI Studio.',
        'Generate a Gemini API key for your project.',
        'Paste it here and save.',
      ],
    },
  };

  const info = providerInfo[activeProvider];

  return (
    <div className="p-6 max-w-3xl space-y-8 page-enter">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900">AI Configuration</h2>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          Finsight uses a bring-your-own-key model to keep AI features free to use. Add your API key to enable AI categorization and spending insights.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          {/* Provider Selector */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Select AI Provider</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setActiveProvider('nvidia')}
                className={`flex-1 px-4 py-3 rounded-2xl text-sm font-semibold transition ${
                  activeProvider === 'nvidia'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                NVIDIA (Recommended)
              </button>
              <button
                onClick={() => setActiveProvider('gemini')}
                className={`flex-1 px-4 py-3 rounded-2xl text-sm font-semibold transition ${
                  activeProvider === 'gemini'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Gemini
              </button>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900">{info.title}</h3>
          <p className="mt-2 text-sm text-gray-500">{info.description}</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">API Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder={maskedKey ? `Saved key: ${maskedKey}` : `Enter your ${activeProvider.toUpperCase()} API key`}
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
                onClick={() => setApiKey('')}
                className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
            </div>

            {message && <p className="text-sm text-gray-700">{message}</p>}
          </form>

          <div className="mt-6 rounded-2xl border border-gray-100 bg-emerald-50 p-4 text-sm text-gray-700">
            <p className="font-medium text-gray-900">How to get a {activeProvider} API key</p>
            <ol className="mt-3 space-y-2 list-decimal pl-5 text-gray-700">
              {info.steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
            <a
              href={info.learnMore}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50"
            >
              {info.docs}
            </a>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Key status</h3>
          <div className="mt-4 space-y-3 text-sm text-gray-700">
            <p><strong>NVIDIA key:</strong> {nvidiaKey ? nvidiaKey : 'Not configured'}</p>
            <p><strong>Gemini key:</strong> {geminiKeyMasked ? geminiKeyMasked : 'Not configured'}</p>
            <p>AI features will use your configured API key. Both providers can be set up.</p>
            <p className="text-xs text-gray-500">Your keys are masked for safety and never returned to the client in full.</p>
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
