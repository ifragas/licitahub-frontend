import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Calendar, Plus, Clock, Building, MapPin, X } from 'lucide-react';

export default function Schedules() {
  const [schedules, setSchedules] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  
  // Estados para o Modal de Novo Agendamento
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Prazo');
  const [eventDate, setEventDate] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [locationOrUrl, setLocationOrUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSchedules();
    fetchCompanies();
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

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErro('');

    try {
      // Envia os dados exatamente como a API espera
      await api.post('/api/schedules', {
        title,
        type,
        eventDate,
        companyId,
        locationOrUrl,
        notes
      });

      // Fecha o modal, limpa os campos e atualiza a lista
      setIsModalOpen(false);
      setTitle('');
      setType('Prazo');
      setEventDate('');
      setCompanyId('');
      setLocationOrUrl('');
      setNotes('');
      fetchSchedules();
    } catch (err) {
      console.error('Erro ao criar agendamento:', err);
      setErro(err.response?.data?.error || 'Erro ao criar o agendamento. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 ml-20 transition-all duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Agendamentos</h1>
          <p className="text-sm text-slate-500">Gerencie os prazos e compromissos de licitações.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 shadow-sm cursor-pointer"
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {schedules.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Nenhum agendamento encontrado.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {schedules.map((schedule) => (
                <div key={schedule._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl mt-1">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-800">{schedule.title}</h4>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                          {schedule.type}
                        </span>
                      </div>
                      {schedule.company && (
                        <p className="text-xs text-blue-600 font-medium flex items-center gap-1 mt-1">
                          <Building size={14} /> {schedule.company.companyName}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Clock size={14} /> {new Date(schedule.eventDate).toLocaleString('pt-PT')}
                      </p>
                      {schedule.locationOrUrl && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin size={14} /> {schedule.locationOrUrl}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Criação de Agendamento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Novo Agendamento</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Título</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Entrega de proposta"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tipo</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="Prazo">Prazo</option>
                    <option value="Reunião">Reunião</option>
                    <option value="Sessão">Sessão</option>
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
                        {comp.companyName}
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
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Local ou URL</label>
                <input
                  type="text"
                  value={locationOrUrl}
                  onChange={(e) => setLocationOrUrl(e.target.value)}
                  placeholder="Ex: Sala virtual / Link da licitação"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Notas</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações adicionais..."
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
                  {submitting ? 'A guardar...' : 'Salvar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}