import fs from 'fs';
import path from 'path';
import User from '../models/User.js';

// Set API keys in memory (process.env). Optionally persist to server/.env.local if persist=true.
export const setApiKeys = async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Only allow non-free users to configure keys (basic access control)
    if ((user.subscriptionPlan || 'free') === 'free') {
      return res.status(403).json({ message: 'Upgrade required to configure API keys' });
    }

    const { geminiKey, nvidiaKey, persist } = req.body;

    if (!geminiKey && !nvidiaKey) {
      return res.status(400).json({ message: 'No keys provided' });
    }

    if (geminiKey) process.env.GEMINI_API_KEY = String(geminiKey).trim();
    if (nvidiaKey) process.env.NVIDIA_API_KEY = String(nvidiaKey).trim();

    // Optionally persist to server/.env.local (warn: persists to disk, do not commit)
    if (persist) {
      try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        const lines = [];
        if (fs.existsSync(envPath)) {
          const existing = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
          // keep other existing lines except GEMINI_API_KEY/NVIDIA_API_KEY
          for (const l of existing) {
            if (/^\s*GEMINI_API_KEY\s*=/.test(l)) continue;
            if (/^\s*NVIDIA_API_KEY\s*=/.test(l)) continue;
            lines.push(l);
          }
        }
        if (geminiKey) lines.push(`GEMINI_API_KEY=${geminiKey}`);
        if (nvidiaKey) lines.push(`NVIDIA_API_KEY=${nvidiaKey}`);
        fs.writeFileSync(envPath, lines.join('\n'));
      } catch (err) {
        console.warn('Failed to persist keys to .env.local', err.message || err);
      }
    }

    return res.json({ message: 'Keys updated in server process (and persisted if requested)' });
  } catch (error) {
    next(error);
  }
};
