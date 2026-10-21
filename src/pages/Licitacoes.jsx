import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  Building2, Calendar, Plus, Search, Filter, AlertCircle, 
  ExternalLink, X, CheckCircle, Clock, Trash2, Pencil, Trophy 
} from 'lucide-react';

export default function Licitacoes() {
  const [licitacoes, setLicitacoes] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // Estados para o Modal (Criação / Edição)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [organ, setOrgan] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [status, setStatus] = useState('Em Análise');
  const [editalUrl, setEditalUrl] = useState('');
  const [openingDate, setOpeningDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLicitacoes();
    fetchCompanies();
  }, []);

  const fetchLicitacoes = async () => {
    try {
      const response = await api.get('/api/bids');
      setLicitacoes(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Erro ao carregar licitações:", err);
      setError("Erro ao carregar licitações da API.");
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      setCompanies(response.data);
    } catch (err) {
      console.error("Erro ao carregar empresas:", err);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setOrgan('');
    setEstimatedValue('');
    setCompanyId('');
    setStatus('Em Análise');
    setEditalUrl('');
    setOpeningDate('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingId(item._id);
    setTitle(item.title || '');
    setOrgan(item.organ || '');
    setEstimatedValue(item.estimatedValue || '');
    setCompanyId(item.company?._id || item.company || '');
    setStatus(item.status || 'Em Análise');
    setEditalUrl(item.editalUrl || '');
    
    if (item.openingDate) {
      const dateObj = new Date(item.openingDate);
      const tzOffset = dateObj.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(dateObj - tzOffset)).toISOString().slice(0, 16);
      setOpeningDate(localISOTime);
    } else {
      setOpeningDate('');
    }

    setNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveBid = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const payload = {
      title,
      organ,
      estimatedValue: Number(estimatedValue) || 0,
      company: companyId,
      status,
      editalUrl,
      openingDate,
      notes
    };

    try {
      if (editingId) {
        await api.put(`/api/bids/${editingId}`, payload);
      } else {
        await api.post('/api/bids', payload);
      }

      setIsModalOpen(false);
      fetchLicitacoes();
    } catch (err) {
      console.error("Erro ao guardar licitação:", err);
      setError(err.response?.data?.error || 'Erro ao guardar licitação.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.put(`/api/bids/${id}`, { status: newStatus });
      fetchLicitacoes();
    } catch (err) {
      console.error("Erro ao atualizar estado:", err);
      alert("Erro ao alterar o estado da licitação.");
    }
  };

  const handleDeleteBid = async (id) => {
    if (!window.confirm("Tem a certeza que deseja eliminar esta licitação?")) return;
    try {
      await api.delete(`/api/bids/${id}`);
      fetchLicitacoes();
    } catch (err) {
      console.error("Erro ao eliminar licitação:", err);
      alert("Erro ao eliminar a licitação.");
    }
  };

  // Filtrar licitações por pesquisa
  const filteredLicitacoes = licitacoes.filter(item => 
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.organ?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Topo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestão de Licitações</h1>
          <p className="text-slate-500 mt-1">Garimpo de oportunidades e validação de viabilidade com clientes.</p>
        </div>
        <button 
          onClick={handleOpenCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <Plus size={18} /> Nova Licitação
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Barra de Pesquisa */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por objeto ou órgão..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Lista ou Estado Vazio */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-400">
          <p>A carregar licitações do MongoDB...</p>
        </div>
      ) : filteredLicitacoes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-8 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Nenhuma licitação encontrada</h3>
          <p className="text-slate-500 text-sm mt-1 mb-6">Registe potenciais licitações garimpadas para validação dos clientes.</p>
          <button 
            onClick={handleOpenCreateModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-all cursor-pointer"
          >
            Criar Licitação
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLicitacoes.map((item) => (
            <div key={item._id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  {/* Badge de Estado Ajustada para Vencedora */}
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit ${
                    item.status === 'Vencedora' || item.status === 'Vencida' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    item.status === 'Aprovada' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                    item.status === 'Rejeitada' ? 'bg-red-50 text-red-600 border border-red-100' :
                    'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {(item.status === 'Vencedora' || item.status === 'Vencida') && <Trophy size={13} className="text-emerald-600" />}
                    {item.status === 'Vencida' ? 'Vencedora' : (item.status || 'Em Análise')}
                  </span>
                  
                  {/* Botões rápidos de Ação */}
                  <div className="flex items-center gap-1">
                    {item.status !== 'Aprovada' && item.status !== 'Vencedora' && item.status !== 'Vencida' && (
                      <button 
                        onClick={() => handleUpdateStatus(item._id, 'Aprovada')}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Aprovar Licitação"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Editar Licitação"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteBid(item._id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Eliminar Licitação"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-slate-800 text-base line-clamp-2 mb-2">{item.title}</h3>
                
                <p className="text-sm text-slate-600 flex items-center gap-1.5 mb-2 font-medium">
                  <Building2 size={16} className="text-blue-600 shrink-0" />
                  <span className="truncate">{item.company?.companyName || item.company?.name || 'Cliente não atribuído'}</span>
                </p>

                <p className="text-xs text-slate-500 mb-4 truncate">
                  <span className="font-semibold text-slate-700">Órgão:</span> {item.organ}
                </p>

                {item.editalUrl && (
                  <a 
                    href={item.editalUrl.startsWith('http') ? item.editalUrl : `https://${item.editalUrl}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium mb-4"
                  >
                    Aceder ao Edital <ExternalLink size={12} />
                  </a>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar size={14} /> {item.openingDate ? new Date(item.openingDate).toLocaleDateString() : 'A definir'}
                </span>
                <span className="font-bold text-emerald-600">
                  {item.estimatedValue ? Number(item.estimatedValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição de Licitação */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">
                {editingId ? 'Editar Licitação' : 'Nova Licitação / Oportunidade'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveBid} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Objeto / Título da Licitação</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Aquisição de equipamentos de informática"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Órgão Licitante</label>
                  <input
                    type="text"
                    value={organ}
                    onChange={(e) => setOrgan(e.target.value)}
                    placeholder="Ex: Prefeitura Municipal"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Valor Estimado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={estimatedValue}
                    onChange={(e) => setEstimatedValue(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Empresa Cliente</label>
                  <select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="">Selecione o cliente</option>
                    {companies.map((comp) => (
                      <option key={comp._id} value={comp._id}>
                        {comp.companyName || comp.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Estado de Análise</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="Em Análise">Em Análise</option>
                    <option value="Aprovada">Aprovada</option>
                    <option value="Vencida">Vencedora 🏆</option>
                    <option value="Rejeitada">Rejeitada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Data de Abertura</label>
                <input
                  type="datetime-local"
                  value={openingDate}
                  onChange={(e) => setOpeningDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Link do Edital</label>
                <input
                  type="url"
                  value={editalUrl}
                  onChange={(e) => setEditalUrl(e.target.value)}
                  placeholder="https://pncp.gov.br/app/editais/..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Notas / Observações</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Margem, logística ou detalhes do edital..."
                  rows="2"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'A guardar...' : editingId ? 'Guardar Alterações' : 'Salvar Licitação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}