import User from '../models/User.js';

const maskApiKey = (key = '') => {
  const trimmed = String(key).trim();
  if (!trimmed) return '';
  if (trimmed.length <= 8) {
    return `${'*'.repeat(Math.max(0, trimmed.length - 4))}${trimmed.slice(-4)}`;
  }
  return `${trimmed.slice(0, 4)}${'*'.repeat(Math.max(0, trimmed.length - 8))}${trimmed.slice(-4)}`;
};

export const settingsController = {
  async getApiKey(req, res) {
    try {
      const provider = String(req.query.provider || 'gemini').toLowerCase();
      if (provider !== 'gemini') {
        return res.status(400).json({ message: 'Unsupported provider' });
      }

      const user = await User.findById(req.userId).lean();
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const storedKey = user.geminiApiKey?.trim() || user.apiKeys?.gemini?.trim() || '';
      return res.json({
        provider: 'gemini',
        available: Boolean(storedKey),
        key: storedKey ? maskApiKey(storedKey) : '',
      });
    } catch (error) {
      console.error('Get API key error:', error);
      res.status(500).json({ message: 'Failed to fetch API key', error: error.message });
    }
  },

  async saveApiKey(req, res) {
    try {
      const provider = String(req.body.provider || 'gemini').toLowerCase();
      if (provider !== 'gemini') {
        return res.status(400).json({ message: 'Unsupported provider' });
      }

      const key = String(req.body.key || '').trim();
      if (!key) {
        return res.status(400).json({ message: 'Gemini API key is required' });
      }

      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.geminiApiKey = key;
      user.apiKeys = user.apiKeys || {};
      user.apiKeys.gemini = key;
      await user.save();

      return res.json({
        message: 'Gemini API key saved successfully',
        provider: 'gemini',
        key: maskApiKey(key),
      });
    } catch (error) {
      console.error('Save API key error:', error);
      res.status(500).json({ message: 'Failed to save API key', error: error.message });
    }
  },
};
