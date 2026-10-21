import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Building2, Calendar, Plus, Search, Filter, AlertCircle } from 'lucide-react';

export default function Licitacoes() {
  const [licitacoes, setLicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/licitacoes')
      .then(response => {
        setLicitacoes(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Erro ao carregar licitações:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Topo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestão de Licitações</h1>
          <p className="text-slate-500 mt-1">Acompanhe e gira os processos licitatórios e documentos do sistema.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer">
          <Plus size={18} /> Nova Licitação
        </button>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por objeto, órgão ou número..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <button className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl flex items-center gap-2 hover:bg-slate-50 text-sm font-medium transition-all cursor-pointer">
          <Filter size={16} /> Filtros
        </button>
      </div>

      {/* Lista ou Estado Vazio */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-400">
          <p>A carregar licitações da API...</p>
        </div>
      ) : licitacoes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-8 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Nenhuma licitação encontrada</h3>
          <p className="text-slate-500 text-sm mt-1 mb-6">Ainda não existem registos no MongoDB Atlas. Adicione uma nova licitação para começar.</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-all cursor-pointer">
            Criar Licitação
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {licitacoes.map((item) => (
            <div key={item._id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                    {item.status || "Em Andamento"}
                  </span>
                  <span className="text-xs text-slate-400">#{item._id?.substring(0, 6)}</span>
                </div>
                <h3 className="font-semibold text-slate-800 text-base line-clamp-2 mb-2">{item.titulo || "Sem Título"}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-4">
                  <Building2 size={16} className="text-slate-400 shrink-0" />
                  <span className="truncate">{item.orgao || "Órgão Não Informado"}</span>
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar size={14} /> {item.dataLimite ? new Date(item.dataLimite).toLocaleDateString() : 'A definir'}
                </span>
                <span className="font-semibold text-slate-700">{item.valor ? `R$ ${item.valor}` : 'Valor N/D'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}