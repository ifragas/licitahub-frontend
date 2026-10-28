
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Building2, Calendar, Plus, Search, Filter, AlertCircle,
  ExternalLink, X, CheckCircle, Clock, Trash2, Pencil, Trophy,
  ArrowUpDown, Check
} from 'lucide-react';

const normalizeStatus = (status) => {
  if (status === 'Vencida') return 'Vencedora';
  return status || 'Em Análise';
};

const getStatusClasses = (status) => {
  const normalizedStatus = normalizeStatus(status);

  switch (normalizedStatus) {
    case 'Vencedora':
    case 'Concluída':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';

    case 'Aprovada':
      return 'bg-blue-50 text-blue-600 border border-blue-100';

    case 'Perdida':
      return 'bg-purple-50 text-purple-700 border border-purple-200';

    case 'Rejeitada':
      return 'bg-red-50 text-red-600 border border-red-100';

    default:
      return 'bg-amber-50 text-amber-600 border border-amber-100';
  }
};

export default function Licitacoes() {
  const [licitacoes, setLicitacoes] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Estados dos filtros
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedOrgan, setSelectedOrgan] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('date-asc');

  // Estados do modal de criação e edição
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
      setLicitacoes(Array.isArray(response.data) ? response.data : []);
      setError('');
    } catch (err) {
      console.error('Erro ao carregar licitações:', err);
      setError('Erro ao carregar licitações da API.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      setCompanies(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Erro ao carregar empresas:', err);
    }
  };

  const showToast = (msg) => {
    setSuccessMessage(msg);

    setTimeout(() => {
      setSuccessMessage('');
    }, 4000);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setOrgan('');
    setEstimatedValue('');
    setCompanyId('');
    setStatus('Em Análise');
    setEditalUrl('');
    setOpeningDate('');
    setNotes('');
    setError('');
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Converte uma data ISO para o formato local de datetime-local.
  const formatDateTimeLocal = (dateValue) => {
    if (!dateValue) return '';

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleOpenEditModal = (item) => {
    setEditingId(item._id);
    setTitle(item.title || '');
    setOrgan(item.organ || '');
    setEstimatedValue(item.estimatedValue ?? '');
    setCompanyId(item.company?._id || item.company || '');

    // Converte o status antigo para o nome atual no formulário.
    setStatus(normalizeStatus(item.status));

    setEditalUrl(item.editalUrl || '');
    setOpeningDate(formatDateTimeLocal(item.openingDate));
    setNotes(item.notes || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSaveBid = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Converte o horário local informado no formulário para ISO.
      const openingDateISO = openingDate
        ? new Date(openingDate).toISOString()
        : null;

      const payload = {
        title,
        organ,
        estimatedValue: Number(estimatedValue) || 0,
        company: companyId,
        status,
        editalUrl,
        openingDate: openingDateISO,
        notes
      };

      if (editingId) {
        await api.put(`/api/bids/${editingId}`, payload);
        showToast('Licitação atualizada com sucesso!');
      } else {
        await api.post('/api/bids', payload);
        showToast('Nova licitação criada com sucesso!');
      }

      setIsModalOpen(false);
      await fetchLicitacoes();
    } catch (err) {
      console.error('Erro ao guardar licitação:', err);

      setError(
        err.response?.data?.error ||
        'Erro ao guardar licitação. Verifique os dados e tente novamente.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (itemOrId, newStatus) => {
    try {
      const item = typeof itemOrId === 'object'
        ? itemOrId
        : licitacoes.find((l) => l._id === itemOrId);

      const id = typeof itemOrId === 'object'
        ? itemOrId._id
        : itemOrId;

      if (!id) {
        alert('Não foi possível identificar a licitação.');
        return;
      }

      let removeSchedule = false;

      if (item && item.status === 'Aprovada' && newStatus !== 'Aprovada') {
        removeSchedule = window.confirm(
          'Esta licitação estava aprovada e possui um agendamento associado.\n\n' +
          'Deseja eliminar também o agendamento vinculado a esta licitação?'
        );
      }

      await api.put(`/api/bids/${id}`, {
        status: newStatus,
        removeSchedule
      });

      showToast(`Estado alterado para "${newStatus}" com sucesso!`);
      await fetchLicitacoes();
    } catch (err) {
      console.error('Erro ao atualizar estado:', err);
      alert(
        err.response?.data?.error ||
        'Erro ao alterar o estado da licitação.'
      );
    }
  };

  const handleDeleteBid = async (id) => {
    if (!window.confirm('Tem a certeza que deseja eliminar esta licitação?')) {
      return;
    }

    try {
      await api.delete(`/api/bids/${id}`);
      showToast('Licitação eliminada com sucesso!');
      await fetchLicitacoes();
    } catch (err) {
      console.error('Erro ao eliminar licitação:', err);
      alert('Erro ao eliminar a licitação.');
    }
  };

  const uniqueOrgans = Array.from(
    new Set(licitacoes.map((item) => item.organ).filter(Boolean))
  );

  const filteredLicitacoes = licitacoes
    .filter((item) => {
      const term = searchTerm.toLowerCase();

      const matchesSearch =
        item.title?.toLowerCase().includes(term) ||
        item.organ?.toLowerCase().includes(term);

      const itemCompanyId = item.company?._id || item.company;
      const matchesCompany =
        !selectedCompany || itemCompanyId === selectedCompany;

      const matchesOrgan =
        !selectedOrgan || item.organ === selectedOrgan;

      const itemStatus = normalizeStatus(item.status);
      const matchesStatus =
        !selectedStatus || itemStatus === selectedStatus;

      return (
        matchesSearch &&
        matchesCompany &&
        matchesOrgan &&
        matchesStatus
      );
    })
    .sort((a, b) => {
      if (sortBy === 'date-asc') {
        return new Date(a.openingDate || 0) -
          new Date(b.openingDate || 0);
      }

      if (sortBy === 'date-desc') {
        return new Date(b.openingDate || 0) -
          new Date(a.openingDate || 0);
      }

      if (sortBy === 'value-desc') {
        return (Number(b.estimatedValue) || 0) -
          (Number(a.estimatedValue) || 0);
      }

      if (sortBy === 'value-asc') {
        return (Number(a.estimatedValue) || 0) -
          (Number(b.estimatedValue) || 0);
      }

      return 0;
    });

  return (
    <div className="p-8 max-w-7xl mx-auto relative">
      {successMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 animate-bounce">
          <Check size={18} />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Gestão de Licitações
          </h1>
          <p className="text-slate-500 mt-1">
            Garimpo de oportunidades e validação de viabilidade com clientes.
          </p>
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

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 mb-6 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por objeto ou órgão..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="relative">
            <Building2 className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="">Todas as Empresas</option>
              {companies.map((comp) => (
                <option key={comp._id} value={comp._id}>
                  {comp.companyName || comp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <select
              value={selectedOrgan}
              onChange={(e) => setSelectedOrgan(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="">Todos os Órgãos</option>
              {uniqueOrgans.map((org, index) => (
                <option key={index} value={org}>
                  {org}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Estado:
            </span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="">Todos os Estados</option>
              <option value="Em Análise">Em Análise</option>
              <option value="Aprovada">Aprovada</option>
              <option value="Vencedora">Vencedora</option>
              <option value="Perdida">Perdida</option>
              <option value="Rejeitada">Rejeitada</option>
              <option value="Concluída">Concluída</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown size={14} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Ordenar por:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="date-asc">Data de Abertura (Mais Próxima)</option>
              <option value="date-desc">Data de Abertura (Mais Distante)</option>
              <option value="value-desc">Maior Valor Estimado</option>
              <option value="value-asc">Menor Valor Estimado</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-400">
          <p>A carregar licitações do MongoDB...</p>
        </div>
      ) : filteredLicitacoes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-8 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">
            Nenhuma licitação encontrada
          </h3>
          <p className="text-slate-500 text-sm mt-1 mb-6">
            Tente ajustar os filtros ou registe uma nova oportunidade.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-all cursor-pointer"
          >
            Criar Licitação
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLicitacoes.map((item) => {
            const normalizedStatus = normalizeStatus(item.status);
            const isWinner = normalizedStatus === 'Vencedora';
            const isApproved = item.status === 'Aprovada';

            return (
              <div
                key={item._id}
                className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit ${getStatusClasses(item.status)}`}
                    >
                      {isWinner && (
                        <Trophy size={13} className="text-emerald-600" />
                      )}
                      {normalizedStatus}
                    </span>

                    <div className="flex items-center gap-1">
                      {!isApproved &&
                        !isWinner &&
                        normalizedStatus !== 'Concluída' && (
                          <button
                            onClick={() => handleUpdateStatus(item, 'Aprovada')}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                            title="Aprovar Licitação"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}

                      {isApproved && (
                        <button
                          onClick={() => handleUpdateStatus(item, 'Em Análise')}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                          title="Reverter para Em Análise"
                        >
                          <Clock size={16} />
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                        title="Editar Licitação"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => handleDeleteBid(item._id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        title="Eliminar Licitação"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-slate-800 text-base line-clamp-2 mb-2">
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-600 flex items-center gap-1.5 mb-2 font-medium">
                    <Building2 size={16} className="text-blue-600 shrink-0" />
                    <span className="truncate">
                      {item.company?.companyName ||
                        item.company?.name ||
                        'Cliente não atribuído'}
                    </span>
                  </p>

                  <p className="text-xs text-slate-500 mb-4 truncate">
                    <span className="font-semibold text-slate-700">Órgão:</span>{' '}
                    {item.organ}
                  </p>

                  {item.editalUrl && (
                    <a
                      href={
                        item.editalUrl.startsWith('http')
                          ? item.editalUrl
                          : `https://${item.editalUrl}`
                      }
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
                    <Calendar size={14} />
                    {item.openingDate
                      ? new Date(item.openingDate).toLocaleDateString('pt-BR')
                      : 'A definir'}
                  </span>

                  <span className="font-bold text-emerald-600">
                    {item.estimatedValue
                      ? Number(item.estimatedValue).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })
                      : 'R$ 0,00'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">
                {editingId
                  ? 'Editar Licitação'
                  : 'Nova Licitação / Oportunidade'}
              </h3>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveBid} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Objeto / Título da Licitação
                </label>
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
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Órgão Licitante
                  </label>
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
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Valor Estimado (R$)
                  </label>
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
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Empresa Cliente
                  </label>
                  <select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
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
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Estado da Licitação
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="Em Análise">Em Análise</option>
                    <option value="Aprovada">Aprovada</option>
                    <option value="Vencedora">Vencedora 🏆</option>
                    <option value="Perdida">Perdida</option>
                    <option value="Rejeitada">Rejeitada</option>
                    <option value="Concluída">Concluída</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Data de Abertura
                </label>
                <input
                  type="datetime-local"
                  value={openingDate}
                  onChange={(e) => setOpeningDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Link do Edital
                </label>
                <input
                  type="url"
                  value={editalUrl}
                  onChange={(e) => setEditalUrl(e.target.value)}
                  placeholder="https://pncp.gov.br/app/editais/..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Notas / Observações
                </label>
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
                  {submitting
                    ? 'A guardar...'
                    : editingId
                    ? 'Guardar Alterações'
                    : 'Salvar Licitação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
