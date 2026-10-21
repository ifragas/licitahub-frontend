import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { FileText, Lock, Mail, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      // Faz o POST para a rota de login
      const response = await api.post('auth/login', { email, password: senha });

      // Guarda o token retornado (se a API devolver token/jwt)
      if (response.data?.accessToken) {
        localStorage.setItem('token', response.data.accessToken);
      }

      //Guarda o Refresh token (se a API devolver)
      if (response.data?.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }

      // Guarda os dados do utilizador se existirem
      if (response.data?.usuario || response.data?.user) {
        localStorage.setItem('usuario', JSON.stringify(response.data.usuario || response.data.user));
      }

      setLoading(false);
      navigate('/');
    } catch (err) {
      setLoading(false);
      console.error('Erro na resposta da API:', err);

      if (err.response) {
        // A API respondeu com um status code diferente de 2xx (ex: 400, 401, 404)
        const mensagemApi = err.response.data?.mensagem || err.response.data?.message || err.response.data?.error;
        setErro(mensagemApi || `Erro ${err.response.status}: Rota não encontrada ou credenciais inválidas.`);
      } else if (err.request) {
        // A requisição foi feita mas não houve resposta (ex: servidor offline ou bloqueio de CORS)
        setErro('Servidor indisponível ou problema de CORS. Verifique se a API está online.');
      } else {
        setErro('Erro ao realizar login: ' + err.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white">
            <FileText size={26} />
          </div>
          <span className="font-bold text-2xl text-slate-900">LicitaHub</span>
        </div>
        <h2 className="text-xl font-semibold text-slate-800 text-center mb-2">Bem-vindo de volta</h2>
        <p className="text-sm text-slate-500 text-center mb-6">Introduza os seus dados para aceder ao sistema.</p>

        {erro && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl text-center">
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 text-slate-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Palavra-passe</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 text-slate-400" size={18} />
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
          >
            {loading ? 'A verificar...' : 'Entrar'} <ArrowRight size={18} />
          </button>
        </form>

        <p className="text-sm text-center text-slate-500 mt-6">
          Ainda não tem conta?{' '}
          <Link to="/register" className="text-blue-600 font-semibold hover:underline">
            Registre-se
          </Link>
        </p>
      </div>
    </div>
  );
}