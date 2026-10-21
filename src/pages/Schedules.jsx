import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Calendar, Plus, Clock, Building, Link as LinkIcon, X, Pencil, Trash2, ExternalLink, FileText } from 'lucide-react';

export default function Schedules() {
  const [schedules, setSchedules] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  
  // Estados para o Modal (Criação / Edição)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Abertura de Propostas');
  const [eventDate, setEventDate] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [bidId, setBidId] = useState('');
  const [editalUrl, setEditalUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSchedules();
    fetchCompanies();
    fetchBids();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await api.get('/api/schedules');
      setSchedules(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err);
      setErro('Erro ao carregar os agendamentos.');
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      setCompanies(response.data);
    } catch (err) {
      console.error('Erro ao buscar empresas:', err);
    }
  };

  const fetchBids = async () => {
    try {
      const response = await api.get('/api/bids');
      setBids(response.data);
    } catch (err) {
      console.error('Erro ao buscar licitações:', err);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setType('Abertura de Propostas');
    setEventDate('');
    setCompanyId('');
    setBidId('');
    setEditalUrl('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (schedule) => {
    setEditingId(schedule._id);
    setTitle(schedule.title || '');
    setType(schedule.type || 'Abertura de Propostas');
    if (schedule.eventDate) {
      const dateObj = new Date(schedule.eventDate);
      const tzOffset = dateObj.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(dateObj - tzOffset)).toISOString().slice(0, 16);
      setEventDate(localISOTime);
    } else {
      setEventDate('');
    }
    setCompanyId(schedule.company?._id || schedule.company || '');
    setBidId(schedule.bid?._id || schedule.bid || '');
    setEditalUrl(schedule.locationOrUrl || schedule.editalUrl || '');
    setNotes(schedule.notes || '');
    setIsModalOpen(true);
  };

  // Quando o utilizador seleciona uma licitação, podemos preencher automaticamente alguns campos
  const handleSelectBid = (selectedBidId) => {
    setBidId(selectedBidId);
    if (!selectedBidId) return;

    const selected = bids.find(b => b._id === selectedBidId);
    if (selected) {
      setTitle(selected.title || '');
      if (selected.company) {
        setCompanyId(selected.company._id || selected.company);
      }
      if (selected.editalUrl) {
        setEditalUrl(selected.editalUrl);
      }
      if (selected.openingDate) {
        const dateObj = new Date(selected.openingDate);
        const tzOffset = dateObj.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(dateObj - tzOffset)).toISOString().slice(0, 16);
        setEventDate(localISOTime);
      }
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Tem certeza que deseja eliminar este agendamento?')) return;
    try {
      await api.delete(`/api/schedules/${id}`);
      fetchSchedules();
    } catch (err) {
      console.error('Erro ao eliminar agendamento:', err);
      alert('Erro ao eliminar o agendamento.');
    }
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErro('');

    const payload = {
      title,
      type,
      eventDate,
      companyId,
      bidId: bidId || null,
      locationOrUrl: editalUrl,
      notes
    };

    try {
      if (editingId) {
        await api.put(`/api/schedules/${editingId}`, payload);
      } else {
        await api.post('/api/schedules', payload);
      }

      setIsModalOpen(false);
      fetchSchedules();
    } catch (err) {
      console.error('Erro ao salvar agendamento:', err);
      setErro(err.response?.data?.error || 'Erro ao guardar o agendamento. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Agendamentos / Licitações</h1>
          <p className="text-sm text-slate-500 mt-1">Gerencie os prazos, sessões e links de editais das licitações.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <Plus size={18} /> Novo Agendamento
        </button>
      </div>

      {erro && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
          {erro}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">A carregar agendamentos...</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          {schedules.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              Nenhum agendamento encontrado.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {schedules.map((schedule) => (
                <div key={schedule._id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl mt-1">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-800 text-base">{schedule.title}</h4>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                          {schedule.type}
                        </span>
                      </div>
                      {schedule.company && (
                        <p className="text-xs text-blue-600 font-medium flex items-center gap-1 mt-1.5">
                          <Building size={14} /> {schedule.company.companyName || schedule.company.name}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Clock size={14} /> {new Date(schedule.eventDate).toLocaleString('pt-PT')}
                      </p>
                      {schedule.locationOrUrl && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <LinkIcon size={14} />{' '}
                          <a 
                            href={schedule.locationOrUrl.startsWith('http') ? schedule.locationOrUrl : `https://${schedule.locationOrUrl}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                          >
                            Aceder ao Edital <ExternalLink size={12} />
                          </a>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Botões de Ação no Cartão */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(schedule)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                      title="Editar Agendamento"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteSchedule(schedule._id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                      title="Eliminar Agendamento"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">
                {editingId ? 'Editar Agendamento' : 'Novo Agendamento'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="p-6 space-y-4">
              {/* Selecionar Licitação Opcional */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Vincular a Licitação (Opcional)</label>
                <select
                  value={bidId}
                  onChange={(e) => handleSelectBid(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="">Nenhuma (Criar agendamento livre)</option>
                  {bids.map((bid) => (
                    <option key={bid._id} value={bid._id}>
                      {bid.title} ({bid.status || 'Em Análise'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Título da Licitação / Processo</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Pavimentação Capão da Canoa"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tipo de Evento</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="Abertura de Propostas">Abertura de Propostas</option>
                    <option value="Disputa / Lances">Disputa / Lances</option>
                    <option value="Habilitação">Habilitação</option>
                    <option value="Impugnação / Esclarecimento">Impugnação / Esclarecimento</option>
                    <option value="Resultado / Homologação">Resultado / Homologação</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Empresa</label>
                  <select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="">Selecione uma empresa</option>
                    {companies.map((comp) => (
                      <option key={comp._id} value={comp._id}>
                        {comp.companyName || comp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Data e Hora do Evento</label>
                <input
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Link do Edital (PNCP / Portal)</label>
                <input
                  type="url"
                  value={editalUrl}
                  onChange={(e) => setEditalUrl(e.target.value)}
                  placeholder="https://pncp.gov.br/app/editais/..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Notas / Objeto da Licitação</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Objeto: Contratação de empresa para..."
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
                  {submitting ? 'A guardar...' : editingId ? 'Guardar Alterações' : 'Salvar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}