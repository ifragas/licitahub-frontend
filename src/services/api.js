
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://consultoria-licitacoes-api.onrender.com',
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await axios.post(
          'https://consultoria-licitacoes-api.onrender.com/auth/refresh',
          { refreshToken }
        );

        const { accessToken } = response.data;

        if (!accessToken) {
          throw new Error('O servidor não retornou um novo token de acesso.');
        }

        localStorage.setItem('token', accessToken);

        originalRequest.headers = originalRequest.headers || {};
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

/**
 * Converte os filtros de modalidade para o formato esperado pela API.
 * Uma lista vazia representa todas as modalidades, conforme o backend.
 */
function adicionarModalidades(params, filtros = {}) {
  const { modalidades, modalidade } = filtros;

  if (Array.isArray(modalidades)) {
    params.modalidades = modalidades.join(',');
  } else if (modalidades !== undefined && modalidades !== null) {
    params.modalidades = modalidades;
  } else if (modalidade !== undefined && modalidade !== '') {
    params.modalidade = modalidade;
  }

  return params;
}

/**
 * Consulta direta do PNCP.
 * Mantida para compatibilidade com outras telas do sistema.
 */
export const getPncpBids = async ({
  termo = '',
  uf = '',
  modalidade,
  modalidades,
  pagina = 1,
  dataInicial = '',
  dataFinal = '',
} = {}) => {
  const params = adicionarModalidades(
    {
      termo,
      uf,
      pagina,
      dataInicial,
      dataFinal,
    },
    { modalidade, modalidades }
  );

  const response = await api.get('/api/pncp/search', { params });

  return response.data;
};

/**
 * Inicia uma pesquisa em segundo plano.
 */
export const startPncpSearch = async ({
  termo = '',
  uf = '',
  modalidade,
  modalidades,
  dataInicial = '',
  dataFinal = '',
} = {}) => {
  const payload = {
    termo,
    uf,
    dataInicial,
    dataFinal,
  };

  if (Array.isArray(modalidades)) {
    payload.modalidades = modalidades;
  } else if (modalidades !== undefined && modalidades !== null) {
    payload.modalidades = modalidades;
  } else if (modalidade !== undefined && modalidade !== '') {
    payload.modalidade = modalidade;
  }

  const response = await api.post('/api/pncp/search/jobs', payload);

  return response.data;
};

/**
 * Consulta o estado de uma pesquisa em segundo plano.
 * O backend atual retorna todos os resultados acumulados em `data`.
 */
export const getPncpSearchProgress = async (jobId) => {
  if (!jobId) {
    throw new Error('Identificador da pesquisa não informado.');
  }

  const response = await api.get(
    `/api/pncp/search/jobs/${encodeURIComponent(jobId)}`
  );

  return response.data;
};

export default api;
