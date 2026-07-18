import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.MODE === 'production' ? '/api' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'),
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['ngrok-skip-browser-warning'] = 'true';
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const basename = import.meta.env.MODE === 'production' ? '/walkwars' : '';
      if (!window.location.pathname.includes(`${basename}/login`)) {
        window.location.href = `${basename}/login`;
      }
    }
    return Promise.reject(err);
  },
);

export default client;
