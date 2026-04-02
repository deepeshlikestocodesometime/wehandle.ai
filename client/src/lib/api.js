import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) {
  throw new Error('VITE_API_URL environment variable is required');
}

// Create a configured Axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically attach the JWT token if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wehandle_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// --- AUTHENTICATION ENDPOINTS ---

export const authApi = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('wehandle_token', response.data.access_token);
    return response.data;
  },
  
  register: async (storeName, email, password) => {
    const response = await api.post('/auth/register', { 
      store_name: storeName, 
      email, 
      password 
    });
    localStorage.setItem('wehandle_token', response.data.access_token);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  enable2FA: async () => {
    const response = await api.post('/auth/2fa/enable');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('wehandle_token');
    window.location.href = '/auth'; // Redirect to login
  }
};

// --- ONBOARDING ENDPOINTS ---

export const onboardingApi = {
  connectStore: async (storeDomain) => {
    const response = await api.post('/onboarding/step1/connect', { store_domain: storeDomain });
    return response.data;
  },
  completeKnowledge: async () => {
    const response = await api.post('/onboarding/step2/knowledge');
    return response.data;
  },
  updatePersona: async (tone, emojiDensity) => {
    const response = await api.put('/onboarding/step3/persona', { 
      tone_of_voice: tone, 
      emoji_density: emojiDensity 
    });
    return response.data;
  },
  previewPersona: async (query = "What is your return policy?", tone = null, emojiDensity = null) => {
    const response = await api.post('/onboarding/step3/preview', {
      query,
      tone_of_voice: tone,
      emoji_density: emojiDensity,
    });
    return response.data;
  },
  deploy: async () => {
    const response = await api.post('/onboarding/step4/deploy');
    return response.data;
  },
  verifyDeployment: async () => {
    const response = await api.post('/onboarding/verify-deployment', {});
    return response.data;
  }
};

// --- COPILOT INBOX ENDPOINTS ---

export const inboxApi = {
  getTickets: async (status = null) => {
    const url = status ? `/inbox?status=${status}` : '/inbox';
    const response = await api.get(url);
    return response.data;
  },
  getThread: async (ticketId) => {
    const response = await api.get(`/inbox/${ticketId}`);
    return response.data;
  },
  sendReply: async (ticketId, content) => {
    const response = await api.post(`/inbox/${ticketId}/messages`, { content });
    return response.data;
  },
  getContext: async (ticketId) => {
    const response = await api.get(`/inbox/${ticketId}/context`);
    return response.data;
  }
};

// --- KNOWLEDGE HUB ENDPOINTS ---

export const knowledgeApi = {
  getRules: async () => {
    const response = await api.get('/knowledge');
    return response.data;
  },
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/knowledge/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  addRule: async (sourceName, content) => {
    const response = await api.post('/knowledge', { source_name: sourceName, content });
    return response.data;
  },
  deleteRule: async (chunkId) => {
    const response = await api.delete(`/knowledge/${chunkId}`);
    return response.data;
  }
};

export const suggestionsApi = {
  getSuggestions: async () => {
    const response = await api.get('/suggestions');
    return response.data;
  },
};

export const teamApi = {
  list: async () => {
    const response = await api.get('/team');
    return response.data;
  },
  invite: async (email) => {
    const response = await api.post('/team/invite', null, { params: { email } });
    return response.data;
  },
  remove: async (userId) => {
    const response = await api.delete(`/team/${userId}`);
    return response.data;
  },
};

export const settingsApi = {
  getApiKey: async () => {
    const response = await api.get('/settings/api-key');
    return response.data;
  },
  rotateApiKey: async () => {
    const response = await api.post('/settings/api-key/rotate');
    return response.data;
  },
  getBillingUsage: async () => {
    const response = await api.get('/settings/billing/usage');
    return response.data;
  },
};


// --- DASHBOARD / ANALYTICS ENDPOINTS ---

export const dashboardApi = {
  getStats: async () => {
    // HITS: GET /api/v1/analytics/pulse
    const response = await api.get('/analytics/pulse');
    return response.data;
  },
  
  getRecentActivity: async () => {
    // HITS: GET /api/v1/analytics/feed
    const response = await api.get('/analytics/feed');
    return response.data;
  }
};