import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Building2, Calendar, 
  TrendingUp, AlertTriangle, CheckCircle2, Clock, 
  FileWarning, Filter, Printer, FileText, DollarSign, Trophy
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import api from '../services/api';

export default function Reports() {
  const [reportType, setReportType] = useState('general'); // 'general', 'companies', 'schedules', 'documents', 'bids'
  const [daysFilter, setDaysFilter] = useState(30);
  const [loading, setLoading] = useState(true);

  // Estados de dados
  const [summary, setSummary] = useState({ 
    totalCompanies: 0, 
    totalPendingSchedules: 0, 
    expiringDocsCount: 0,
    totalFinancialValue: 0 
  });
  const [bidsList, setBidsList] = useState([]);
  const [companiesList, setCompaniesList] = useState([]);
  const [schedulesList, setSchedulesList] = useState([]);
  const [expiringDocsList, setExpiringDocsList] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, [reportType, daysFilter]);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // 1. Resumo Geral
      const summaryRes = await api.get('/api/reports/dashboard-summary').catch(() => ({
        data: { totalCompanies: 0, totalPendingSchedules: 0, expiringDocsCount: 0, totalFinancialValue: 0 }
      }));
      setSummary(summaryRes.data);

      // 2. Busca de Licitações (Bids) para contabilizar Vencidas e Valores
      const bidsRes = await api.get('/api/bids').catch(() => ({ data: [] }));
      const allBids = bidsRes.data || [];
      
      const now = new Date();
      const filteredBids = allBids.filter(item => {
        if (!item.createdAt && !item.openingDate || daysFilter === 0) return true;
        const refDate = new Date(item.createdAt || item.openingDate);
        const diffDays = (now - refDate) / (1000 * 60 * 60 * 24);
        return diffDays <= daysFilter;
      });
      setBidsList(filteredBids);

      // 3. Procura dados específicos com base no relatório selecionado
      if (reportType === 'general' || reportType === 'documents') {
        const docsRes = await api.get(`/api/reports/expiring-documents?days=${daysFilter}`).catch(() => ({ data: { documents: [] } }));
        setExpiringDocsList(docsRes.data.documents || []);
      }

      if (reportType === 'companies') {
        const compRes = await api.get('/companies').catch(() => ({ data: [] }));
        const filtered = (compRes.data || []).filter(item => {
          if (!item.createdAt || daysFilter === 0) return true;
          const created = new Date(item.createdAt);
          const diffDays = (now - created) / (1000 * 60 * 60 * 24);
          return diffDays <= daysFilter;
        });
        setCompaniesList(filtered);
      }

      if (reportType === 'schedules') {
        const schedRes = await api.get('/api/schedules').catch(() => ({ data: [] }));
        const filtered = (schedRes.data || []).filter(item => {
          if (!item.createdAt && !item.eventDate && !item.date || daysFilter === 0) return true;
          const refDate = new Date(item.createdAt || item.eventDate || item.date);
          const diffDays = (now - refDate) / (1000 * 60 * 60 * 24);
          return diffDays <= daysFilter;
        });
        setSchedulesList(filtered);
      }

    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Métricas e Totais de Licitações Vencidas (Ganhas)
  const wonBids = bidsList.filter(b => b.status === 'Vencida' || b.status === 'Concluída');
  const totalWonValue = wonBids.reduce((acc, curr) => acc + (Number(curr.estimatedValue) || 0), 0);

  // Dados para os Gráficos do Modo Geral
  const expiredCount = expiringDocsList.filter(d => d.status === 'VENCIDO').length;
  const warningCount = expiringDocsList.filter(d => d.status === 'A_VENCER').length;
  const pieData = [
    { name: 'Vencidos', value: expiredCount, color: '#ef4444' },
    { name: 'A Vencer', value: warningCount, color: '#f59e0b' },
  ];
  const barData = [
    { name: 'Agendamentos', Pendentes: summary.totalPendingSchedules },
    { name: 'Empresas', Total: summary.totalCompanies },
    { name: 'Licitações Vencidas', Total: wonBids.length },
  ];

  return (
    <div className="p-8 ml-20 min-h-screen bg-slate-50 print:p-0 print:ml-0 print:bg-white">
      
      {/* Cabeçalho do Relatório Otimizado para Impressão */}
      <div className="hidden print:block mb-6 border-b border-slate-300 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">LicitaHub — Relatório Oficial</h1>
        <p className="text-sm text-slate-600">
          Tipo: {
            reportType === 'general' ? 'Visão Geral Executiva' : 
            reportType === 'companies' ? 'Listagem de Empresas' : 
            reportType === 'schedules' ? 'Listagem de Agendamentos' : 
            reportType === 'bids' ? 'Relatório de Licitações Vencidas / Oportunidades' :
            'Alertas de Documentos'
          } 
          {daysFilter > 0 ? ` (Últimos ${daysFilter} dias)` : ' (Todo o Histórico)'}
        </p>
        <p className="text-xs text-slate-400 mt-1">Gerado em: {new Date().toLocaleDateString('pt-PT')} às {new Date().toLocaleTimeString('pt-PT')}</p>
      </div>

      {/* Controlo de Ações / Filtros (Oculto na Impressão) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <BarChart3 className="text-blue-600" size={28} />
            Relatórios Customizados
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Selecione o módulo e o período para visualizar ou imprimir a listagem detalhada.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Seletor de Tipo de Relatório */}
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
            <FileText size={18} className="text-slate-400 ml-2" />
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="bg-slate-100 text-slate-700 text-sm font-semibold py-1.5 px-3 rounded-lg border-none focus:ring-2 focus:ring-blue-500 outline-hidden cursor-pointer"
            >
              <option value="general">Visão Geral (Dashboard)</option>
              <option value="bids">Licitações Vencidas / Oportunidades</option>
              <option value="companies">Empresas Cadastradas</option>
              <option value="schedules">Agendamentos / Licitações</option>
              <option value="documents">Alertas de Documentos</option>
            </select>
          </div>

          {/* Seletor de Período */}
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
            <Filter size={18} className="text-slate-400 ml-2" />
            <select 
              value={daysFilter} 
              onChange={(e) => setDaysFilter(Number(e.target.value))}
              className="bg-slate-100 text-slate-700 text-sm font-semibold py-1.5 px-3 rounded-lg border-none focus:ring-2 focus:ring-blue-500 outline-hidden cursor-pointer"
            >
              <option value={7}>Últimos 7 dias</option>
              <option value={15}>Últimos 15 dias</option>
              <option value={30}>Últimos 30 dias</option>
              <option value={60}>Últimos 60 dias</option>
              <option value={0}>Todo o Histórico</option>
            </select>
          </div>

          {/* Botão de Impressão */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Printer size={18} />
            Imprimir Secção
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-slate-400 animate-pulse font-medium">A compilar dados do relatório...</p>
        </div>
      ) : (
        <>
          {/* MODO 1: VISÃO GERAL */}
          {reportType === 'general' && (
            <>
              {/* Cartões de Indicadores (KPIs) incluindo Licitações Vencidas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Cartão 1: Licitações Vencidas (Montante R$) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Licitações Vencidas</p>
                    <h3 className="text-2xl font-extrabold text-emerald-600 mt-2">
                      {totalWonValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </h3>
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
                      <Trophy size={14} /> {wonBids.length} contrato(s) ganho(s)
                    </span>
                  </div>
                  <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
                    <DollarSign size={24} />
                  </div>
                </div>

                {/* Cartão 2: Agendamentos Pendentes */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Agendamentos</p>
                    <h3 className="text-3xl font-extrabold text-slate-800 mt-2">{summary.totalPendingSchedules}</h3>
                    <span className="text-xs text-blue-600 font-medium flex items-center gap-1 mt-1">
                      <TrendingUp size={14} /> Pendentes
                    </span>
                  </div>
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><Calendar size={24} /></div>
                </div>

                {/* Cartão 3: Empresas Cadastradas */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Empresas</p>
                    <h3 className="text-3xl font-extrabold text-slate-800 mt-2">{summary.totalCompanies}</h3>
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
                      <CheckCircle2 size={14} /> Registadas
                    </span>
                  </div>
                  <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl"><Building2 size={24} /></div>
                </div>

                {/* Cartão 4: Documentos em Alerta */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Alertas Doc.</p>
                    <h3 className="text-3xl font-extrabold text-amber-600 mt-2">{summary.expiringDocsCount}</h3>
                    <span className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-1">
                      <AlertTriangle size={14} /> Requerem atenção
                    </span>
                  </div>
                  <div className="p-4 bg-amber-50 text-amber-600 rounded-xl"><Clock size={24} /></div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 print:hidden">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
                  <h3 className="text-base font-bold text-slate-800 mb-4">Estado dos Documentos ({daysFilter > 0 ? `${daysFilter}d` : 'Geral'})</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                          {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip /><Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
                  <h3 className="text-base font-bold text-slate-800 mb-4">Métricas Gerais</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="Pendentes" fill="#2563eb" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="Total" fill="#10b981" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* MODO ESPECÍFICO: RELATÓRIO DE LICITAÇÕES */}
          {reportType === 'bids' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Relatório Detalhado de Licitações {daysFilter > 0 ? `(Últimos ${daysFilter} dias)` : '(Histórico Completo)'}
                  </h3>
                  <p className="text-sm text-slate-500">Acompanhamento financeiro e status de homologação por cliente.</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold">
                  Total Vencido: {totalWonValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>

              {bidsList.length === 0 ? (
                <p className="text-slate-400 py-8 text-center">Nenhuma licitação encontrada para o período selecionado.</p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                      <th className="py-3 px-4">Objeto / Título</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Órgão</th>
                      <th className="py-3 px-4">Valor Estimado</th>
                      <th className="py-3 px-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {bidsList.map(bid => (
                      <tr key={bid._id}>
                        <td className="py-3 px-4 font-medium text-slate-800">{bid.title}</td>
                        <td className="py-3 px-4 text-slate-600">{bid.company?.companyName || bid.company?.name || 'N/A'}</td>
                        <td className="py-3 px-4 text-slate-600">{bid.organ || 'N/A'}</td>
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {bid.estimatedValue ? Number(bid.estimatedValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            bid.status === 'Vencida' || bid.status === 'Concluída' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            bid.status === 'Aprovada' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                            bid.status === 'Rejeitada' ? 'bg-red-50 text-red-600 border border-red-100' :
                            'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                            {bid.status || 'Em Análise'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* MODO 2: EMPRESAS CADASTRADAS */}
          {reportType === 'companies' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">
                Relatório de Empresas {daysFilter > 0 ? `(Cadastradas nos últimos ${daysFilter} dias)` : '(Histórico Completo)'}
              </h3>
              {companiesList.length === 0 ? (
                <p className="text-slate-400 py-8 text-center">Nenhuma empresa encontrada para o período selecionado.</p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                      <th className="py-3 px-4">Nome da Empresa</th>
                      <th className="py-3 px-4">CNPJ</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Telefone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {companiesList.map(comp => (
                      <tr key={comp._id}>
                        <td className="py-3 px-4 font-medium text-slate-800">{comp.companyName || comp.name || 'N/A'}</td>
                        <td className="py-3 px-4 text-slate-600">{comp.cnpj || 'N/A'}</td>
                        <td className="py-3 px-4 text-slate-600">{comp.email || 'N/A'}</td>
                        <td className="py-3 px-4 text-slate-600">{comp.phone || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* MODO 3: AGENDAMENTOS */}
          {reportType === 'schedules' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">
                Relatório de Agendamentos {daysFilter > 0 ? `(Últimos ${daysFilter} dias)` : '(Histórico Completo)'}
              </h3>
              {schedulesList.length === 0 ? (
                <p className="text-slate-400 py-8 text-center">Nenhum agendamento encontrado para o período selecionado.</p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                      <th className="py-3 px-4">Título / Processo</th>
                      <th className="py-3 px-4">Data e Hora</th>
                      <th className="py-3 px-4">Empresa</th>
                      <th className="py-3 px-4">Tipo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {schedulesList.map(sch => (
                      <tr key={sch._id}>
                        <td className="py-3 px-4 font-medium text-slate-800">{sch.title || sch.organ || 'N/A'}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {sch.eventDate || sch.date ? new Date(sch.eventDate || sch.date).toLocaleString('pt-PT') : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{sch.company?.companyName || sch.company?.name || 'N/A'}</td>
                        <td className="py-3 px-4 font-semibold text-slate-700">{sch.type || sch.status || 'Prazo'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* MODO 4: ALERTAS DE DOCUMENTOS */}
          {(reportType === 'general' || reportType === 'documents') && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 mt-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FileWarning className="text-amber-500" size={20} />
                Documentos Vencidos ou a Vencer ({daysFilter > 0 ? `${daysFilter} Dias` : 'Todos'})
              </h3>
              {expiringDocsList.length === 0 ? (
                <p className="text-slate-400 py-8 text-center">Nenhum documento em alerta para o período selecionado.</p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                      <th className="py-3 px-4">Documento</th>
                      <th className="py-3 px-4">Empresa</th>
                      <th className="py-3 px-4">Data de Expiração</th>
                      <th className="py-3 px-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {expiringDocsList.map((doc) => (
                      <tr key={doc._id}>
                        <td className="py-3 px-4 font-medium text-slate-800">{doc.title || doc.name || 'Sem título'}</td>
                        <td className="py-3 px-4 text-slate-600">{doc.company?.companyName || doc.company?.name || 'N/A'}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {doc.expirationDate ? new Date(doc.expirationDate).toLocaleDateString('pt-PT') : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${doc.status === 'VENCIDO' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                            {doc.status === 'VENCIDO' ? 'VENCIDO' : 'A VENCER'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}