const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private token: string | null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  private getHeaders(isJson = true): Record<string, string> {
    const headers: Record<string, string> = {};
    if (isJson) headers['Content-Type'] = 'application/json';
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    return headers;
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      if (response.status === 401) {
        this.setToken(null);
        window.dispatchEvent(new CustomEvent('auth:logout'));
        throw new Error('Session expired. Please log in again.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to server. Please check your connection.');
      }
      throw error;
    }
  }

  // ─── Auth ────────────────────────────────────────────
  signup(name: string, email: string, password: string, confirmPassword: string) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });
  }

  login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  getProfile() {
    return this.request('/auth/profile');
  }

  updateProfile(name: string) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
  }

  // ─── Transactions ────────────────────────────────────
  getTransactions(filters: Record<string, any> = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    return this.request(`/transactions?${params.toString()}`);
  }

  getTransactionStats(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return this.request(`/transactions/stats?${params.toString()}`);
  }

  createTransaction(data: any) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateTransaction(id: string, data: any) {
    return this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteTransaction(id: string) {
    return this.request(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  // ─── Upload ──────────────────────────────────────────
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_URL}/upload/file`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Upload failed');
    return data;
  }

  // Alias for backward compatibility
  async uploadCSV(file: File) {
    return this.uploadFile(file);
  }

  // ─── AI ──────────────────────────────────────────────
  getInsights(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return this.request(`/ai/insights?${params.toString()}`);
  }

  getCategoryBreakdown(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return this.request(`/ai/categories?${params.toString()}`);
  }

  categorizeTransaction(description: string) {
    return this.request('/ai/categorize', {
      method: 'POST',
      body: JSON.stringify({ description }),
    });
  }

  // ─── Admin: set API keys (requires auth & upgraded plan) ───
  setApiKeys({ geminiKey, nvidiaKey, persist = false }: { geminiKey?: string; nvidiaKey?: string; persist?: boolean }) {
    return this.request('/admin/keys', {
      method: 'POST',
      body: JSON.stringify({ geminiKey, nvidiaKey, persist }),
    });
  }
}

export const apiClient = new ApiClient();
