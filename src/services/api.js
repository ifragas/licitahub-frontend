import axios from 'axios';

// Cria a instância do Axios com a URL base da tua API no Render
const api = axios.create({
  baseURL: 'https://consultoria-licitacoes-api.onrender.com',
});

// 1. Interceptor de Pedido: Adiciona o token Bearer em todos os requests enviados à API
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Interceptor de Resposta: Deteta tokens expirados e tenta renová-los com o Refresh Token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await axios.post('https://consultoria-licitacoes-api.onrender.com/auth/refresh', {
          refreshToken
        });

        const { accessToken } = response.data;

        localStorage.setItem('token', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;