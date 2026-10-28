
import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Building2,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileWarning,
  Filter,
  Printer,
  FileText,
  DollarSign,
  Trophy
} from 'lucide-react';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

import api from '../services/api';

export default function Reports() {
  const [reportType, setReportType] = useState('general');
  const [daysFilter, setDaysFilter] = useState(30);
  const [loading, setLoading] = useState(true);

  // Estados dos dados
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

      // 1. Resumo geral
      const summaryRes = await api
        .get('/api/reports/dashboard-summary')
        .catch(() => ({
          data: {
            totalCompanies: 0,
            totalPendingSchedules: 0,
            expiringDocsCount: 0,
            totalFinancialValue: 0
          }
        }));

      setSummary(summaryRes.data);

      // 2. Busca e filtragem das licitações
      const bidsRes = await api
        .get('/api/bids')
        .catch(() => ({ data: [] }));

      const allBids = Array.isArray(bidsRes.data)
        ? bidsRes.data
        : [];

      const now = new Date();

      const filteredBids = allBids.filter((item) => {
        if (
          (!item.createdAt && !item.openingDate) ||
          daysFilter === 0
        ) {
          return true;
        }

        const refDate = new Date(
          item.createdAt || item.openingDate
        );

        const diffDays =
          (now - refDate) / (1000 * 60 * 60 * 24);

        return diffDays <= daysFilter;
      });

      setBidsList(filteredBids);

      // 3. Documentos vencidos ou a vencer
      if (
        reportType === 'general' ||
        reportType === 'documents'
      ) {
        const docsRes = await api
          .get(
            `/api/reports/expiring-documents?days=${daysFilter}`
          )
          .catch(() => ({
            data: { documents: [] }
          }));

        setExpiringDocsList(
          docsRes.data.documents || []
        );
      }

      // 4. Empresas
      if (reportType === 'companies') {
        const compRes = await api
          .get('/companies')
          .catch(() => ({ data: [] }));

        const filtered = (compRes.data || []).filter(
          (item) => {
            if (!item.createdAt || daysFilter === 0) {
              return true;
            }

            const created = new Date(item.createdAt);

            const diffDays =
              (now - created) / (1000 * 60 * 60 * 24);

            return diffDays <= daysFilter;
          }
        );

        setCompaniesList(filtered);
      }

      // 5. Agendamentos
      if (reportType === 'schedules') {
        const schedRes = await api
          .get('/api/schedules')
          .catch(() => ({ data: [] }));

        const filtered = (schedRes.data || []).filter(
          (item) => {
            if (
              (!item.createdAt &&
                !item.eventDate &&
                !item.date) ||
              daysFilter === 0
            ) {
              return true;
            }

            const refDate = new Date(
              item.createdAt ||
              item.eventDate ||
              item.date
            );

            const diffDays =
              (now - refDate) / (1000 * 60 * 60 * 24);

            return diffDays <= daysFilter;
          }
        );

        setSchedulesList(filtered);
      }
    } catch (error) {
      console.error(
        'Erro ao carregar relatório:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // =====================================================
  // MÉTRICAS DE LICITAÇÕES
  // =====================================================

  // Mantém compatibilidade com registros antigos que usam Vencida.
  const wonBids = bidsList.filter((bid) =>
    ['Vencida', 'Vencedora', 'Concluída'].includes(
      bid.status
    )
  );

  const lostBids = bidsList.filter(
    (bid) => bid.status === 'Perdida'
  );

  // Soma dos valores estimados das licitações vencedoras
  const totalWonValue = wonBids.reduce(
    (total, bid) =>
      total + (Number(bid.estimatedValue) || 0),
    0
  );

  // Soma dos valores estimados das licitações perdidas
  const totalLostValue = lostBids.reduce(
    (total, bid) =>
      total + (Number(bid.estimatedValue) || 0),
    0
  );

  // Formatação monetária brasileira
  const formatCurrency = (value) =>
    (Number(value) || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

  // =====================================================
  // DADOS DOS GRÁFICOS
  // =====================================================

  const expiredCount = expiringDocsList.filter(
    (doc) => doc.status === 'VENCIDO'
  ).length;

  const warningCount = expiringDocsList.filter(
    (doc) => doc.status === 'A_VENCER'
  ).length;

  const pieData = [
    {
      name: 'Vencidos',
      value: expiredCount,
      color: '#ef4444'
    },
    {
      name: 'A Vencer',
      value: warningCount,
      color: '#f59e0b'
    }
  ];

  const barData = [
    {
      name: 'Agendamentos',
      Pendentes: summary.totalPendingSchedules
    },
    {
      name: 'Empresas',
      Total: summary.totalCompanies
    },
    {
      name: 'Vencedoras',
      Total: wonBids.length
    },
    {
      name: 'Perdidas',
      Total: lostBids.length
    }
  ];

  return (
    <div className="p-8 ml-20 min-h-screen bg-slate-50 print:p-0 print:ml-0 print:bg-white">

      {/* Cabeçalho para impressão */}
      <div className="hidden print:block mb-6 border-b border-slate-300 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">
          Gestorae — Relatório
        </h1>

        <p className="text-sm text-slate-600">
          Tipo: {
            reportType === 'general'
              ? 'Visão Geral Executiva'
              : reportType === 'companies'
              ? 'Listagem de Empresas'
              : reportType === 'schedules'
              ? 'Listagem de Agendamentos'
              : reportType === 'bids'
              ? 'Relatório de Licitações'
              : 'Alertas de Documentos'
          }

          {daysFilter > 0
            ? ` (Últimos ${daysFilter} dias)`
            : ' (Todo o Histórico)'}
        </p>

        <p className="text-xs text-slate-400 mt-1">
          Gerado em:{' '}
          {new Date().toLocaleDateString('pt-BR')}
          {' às '}
          {new Date().toLocaleTimeString('pt-BR')}
        </p>
      </div>

      {/* Cabeçalho, filtros e impressão */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <BarChart3
              className="text-blue-600"
              size={28}
            />
            Relatórios Customizados
          </h1>

          <p className="text-slate-500 text-sm mt-1">
            Selecione o módulo e o período para visualizar
            ou imprimir a listagem detalhada.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">

          {/* Tipo de relatório */}
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
            <FileText
              size={18}
              className="text-slate-400 ml-2"
            />

            <select
              value={reportType}
              onChange={(e) =>
                setReportType(e.target.value)
              }
              className="bg-slate-100 text-slate-700 text-sm font-semibold py-1.5 px-3 rounded-lg border-none focus:ring-2 focus:ring-blue-500 outline-hidden cursor-pointer"
            >
              <option value="general">
                Visão Geral (Dashboard)
              </option>
              <option value="bids">
                Licitações Vencedoras / Perdidas
              </option>
              <option value="companies">
                Empresas Cadastradas
              </option>
              <option value="schedules">
                Agendamentos / Licitações
              </option>
              <option value="documents">
                Alertas de Documentos
              </option>
            </select>
          </div>

          {/* Período */}
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
            <Filter
              size={18}
              className="text-slate-400 ml-2"
            />

            <select
              value={daysFilter}
              onChange={(e) =>
                setDaysFilter(Number(e.target.value))
              }
              className="bg-slate-100 text-slate-700 text-sm font-semibold py-1.5 px-3 rounded-lg border-none focus:ring-2 focus:ring-blue-500 outline-hidden cursor-pointer"
            >
              <option value={7}>Últimos 7 dias</option>
              <option value={15}>Últimos 15 dias</option>
              <option value={30}>Últimos 30 dias</option>
              <option value={60}>Últimos 60 dias</option>
              <option value={0}>Todo o Histórico</option>
            </select>
          </div>

          {/* Imprimir */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Printer size={18} />
            Imprimir Seção
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-slate-400 animate-pulse font-medium">
            A compilar dados do relatório...
          </p>
        </div>
      ) : (
        <>
          {/* =================================================
              VISÃO GERAL
          ================================================= */}
          {reportType === 'general' && (
            <>
              {/* Indicadores */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">

                {/* Cartão único: vencedoras */}
                <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-xs flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Licitações Vencedoras
                    </p>

                    <h3 className="text-2xl font-extrabold text-emerald-600 mt-2 break-words">
                      {formatCurrency(totalWonValue)}
                    </h3>

                    <span className="text-xs text-emerald-700 font-medium flex items-center gap-1 mt-2">
                      <Trophy size={14} />
                      {wonBids.length}{' '}
                      {wonBids.length === 1
                        ? 'licitação vencedora'
                        : 'licitações vencedoras'}
                    </span>
                  </div>

                  <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                    <Trophy size={24} />
                  </div>
                </div>

                {/* Cartão único: perdidas */}
                <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-xs flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Licitações Perdidas
                    </p>

                    <h3 className="text-2xl font-extrabold text-purple-700 mt-2 break-words">
                      {formatCurrency(totalLostValue)}
                    </h3>

                    <span className="text-xs text-purple-700 font-medium flex items-center gap-1 mt-2">
                      <FileWarning size={14} />
                      {lostBids.length}{' '}
                      {lostBids.length === 1
                        ? 'licitação perdida'
                        : 'licitações perdidas'}
                    </span>
                  </div>

                  <div className="p-4 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                    <FileWarning size={24} />
                  </div>
                </div>

                {/* Agendamentos */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Agendamentos
                    </p>

                    <h3 className="text-3xl font-extrabold text-slate-800 mt-2">
                      {summary.totalPendingSchedules}
                    </h3>

                    <span className="text-xs text-blue-600 font-medium flex items-center gap-1 mt-1">
                      <TrendingUp size={14} />
                      Pendentes
                    </span>
                  </div>

                  <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
                    <Calendar size={24} />
                  </div>
                </div>

                {/* Empresas */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Empresas
                    </p>

                    <h3 className="text-3xl font-extrabold text-slate-800 mt-2">
                      {summary.totalCompanies}
                    </h3>

                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
                      <CheckCircle2 size={14} />
                      Registradas
                    </span>
                  </div>

                  <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Building2 size={24} />
                  </div>
                </div>

                {/* Documentos */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Alertas de Documentos
                    </p>

                    <h3 className="text-3xl font-extrabold text-amber-600 mt-2">
                      {summary.expiringDocsCount}
                    </h3>

                    <span className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-1">
                      <AlertTriangle size={14} />
                      Requerem atenção
                    </span>
                  </div>

                  <div className="p-4 bg-amber-50 text-amber-600 rounded-xl">
                    <Clock size={24} />
                  </div>
                </div>
              </div>

              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 print:hidden">

                {/* Gráfico de documentos */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
                  <h3 className="text-base font-bold text-slate-800 mb-4">
                    Estado dos Documentos (
                    {daysFilter > 0
                      ? `${daysFilter}d`
                      : 'Geral'}
                    )
                  </h3>

                  <div className="h-56">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                            />
                          ))}
                        </Pie>

                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Gráfico geral */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
                  <h3 className="text-base font-bold text-slate-800 mb-4">
                    Métricas Gerais
                  </h3>

                  <div className="h-56">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <BarChart data={barData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                        />

                        <XAxis
                          dataKey="name"
                          stroke="#94a3b8"
                          fontSize={12}
                        />

                        <YAxis
                          stroke="#94a3b8"
                          fontSize={12}
                        />

                        <Tooltip />

                        <Legend />

                        <Bar
                          dataKey="Pendentes"
                          name="Pendentes"
                          fill="#2563eb"
                          radius={[6, 6, 0, 0]}
                        />

                        <Bar
                          dataKey="Total"
                          name="Total"
                          fill="#10b981"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* =================================================
              RELATÓRIO DETALHADO DE LICITAÇÕES
          ================================================= */}
          {reportType === 'bids' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6">

              <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Relatório Detalhado de Licitações{' '}
                    {daysFilter > 0
                      ? `(Últimos ${daysFilter} dias)`
                      : '(Histórico Completo)'}
                  </h3>

                  <p className="text-sm text-slate-500">
                    Acompanhamento financeiro e status das licitações por cliente.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">

                  {/* Resumo vencedoras */}
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-xl text-sm font-bold">
                    <div>Vencedoras: {wonBids.length}</div>
                    <div className="mt-1">
                      {formatCurrency(totalWonValue)}
                    </div>
                  </div>

                  {/* Resumo perdidas */}
                  <div className="bg-purple-50 border border-purple-100 text-purple-700 px-4 py-3 rounded-xl text-sm font-bold">
                    <div>Perdidas: {lostBids.length}</div>
                    <div className="mt-1">
                      {formatCurrency(totalLostValue)}
                    </div>
                  </div>
                </div>
              </div>

              {bidsList.length === 0 ? (
                <p className="text-slate-400 py-8 text-center">
                  Nenhuma licitação encontrada para o período selecionado.
                </p>
              ) : (
                <div className="overflow-x-auto">
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
                      {bidsList.map((bid) => (
                        <tr key={bid._id}>
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {bid.title}
                          </td>

                          <td className="py-3 px-4 text-slate-600">
                            {bid.company?.companyName ||
                              bid.company?.name ||
                              'N/A'}
                          </td>

                          <td className="py-3 px-4 text-slate-600">
                            {bid.organ || 'N/A'}
                          </td>

                          <td className="py-3 px-4 font-semibold text-slate-700">
                            {formatCurrency(bid.estimatedValue)}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                [
                                  'Vencida',
                                  'Vencedora',
                                  'Concluída'
                                ].includes(bid.status)
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                  : bid.status === 'Aprovada'
                                  ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                  : bid.status === 'Perdida'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                  : bid.status === 'Rejeitada'
                                  ? 'bg-red-50 text-red-600 border border-red-100'
                                  : 'bg-amber-50 text-amber-600 border border-amber-100'
                              }`}
                            >
                              {bid.status === 'Vencida'
                                ? 'Vencedora'
                                : bid.status || 'Em Análise'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* =================================================
              RELATÓRIO DE EMPRESAS
          ================================================= */}
          {reportType === 'companies' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">
                Relatório de Empresas{' '}
                {daysFilter > 0
                  ? `(Cadastradas nos últimos ${daysFilter} dias)`
                  : '(Histórico Completo)'}
              </h3>

              {companiesList.length === 0 ? (
                <p className="text-slate-400 py-8 text-center">
                  Nenhuma empresa encontrada para o período selecionado.
                </p>
              ) : (
                <div className="overflow-x-auto">
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
                      {companiesList.map((comp) => (
                        <tr key={comp._id}>
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {comp.companyName || comp.name || 'N/A'}
                          </td>

                          <td className="py-3 px-4 text-slate-600">
                            {comp.cnpj || 'N/A'}
                          </td>

                          <td className="py-3 px-4 text-slate-600">
                            {comp.email || 'N/A'}
                          </td>

                          <td className="py-3 px-4 text-slate-600">
                            {comp.phone || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* =================================================
              RELATÓRIO DE AGENDAMENTOS
          ================================================= */}
          {reportType === 'schedules' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">
                Relatório de Agendamentos{' '}
                {daysFilter > 0
                  ? `(Últimos ${daysFilter} dias)`
                  : '(Histórico Completo)'}
              </h3>

              {schedulesList.length === 0 ? (
                <p className="text-slate-400 py-8 text-center">
                  Nenhum agendamento encontrado para o período selecionado.
                </p>
              ) : (
                <div className="overflow-x-auto">
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
                      {schedulesList.map((sch) => (
                        <tr key={sch._id}>
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {sch.title || sch.organ || 'N/A'}
                          </td>

                          <td className="py-3 px-4 text-slate-600">
                            {sch.eventDate || sch.date
                              ? new Date(
                                  sch.eventDate || sch.date
                                ).toLocaleString('pt-BR')
                              : 'N/A'}
                          </td>

                          <td className="py-3 px-4 text-slate-600">
                            {sch.company?.companyName ||
                              sch.company?.name ||
                              'N/A'}
                          </td>

                          <td className="py-3 px-4 font-semibold text-slate-700">
                            {sch.type || sch.status || 'Prazo'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* =================================================
              ALERTAS DE DOCUMENTOS
          ================================================= */}
          {(reportType === 'general' ||
            reportType === 'documents') && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 mt-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FileWarning
                  className="text-amber-500"
                  size={20}
                />
                Documentos Vencidos ou a Vencer (
                {daysFilter > 0
                  ? `${daysFilter} Dias`
                  : 'Todos'}
                )
              </h3>

              {expiringDocsList.length === 0 ? (
                <p className="text-slate-400 py-8 text-center">
                  Nenhum documento em alerta para o período selecionado.
                </p>
              ) : (
                <div className="overflow-x-auto">
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
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {doc.title || doc.name || 'Sem título'}
                          </td>

                          <td className="py-3 px-4 text-slate-600">
                            {doc.company?.companyName ||
                              doc.company?.name ||
                              'N/A'}
                          </td>

                          <td className="py-3 px-4 text-slate-600">
                            {doc.expirationDate
                              ? new Date(
                                  doc.expirationDate
                                ).toLocaleDateString('pt-BR')
                              : 'N/A'}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                doc.status === 'VENCIDO'
                                  ? 'bg-red-50 text-red-600 border border-red-100'
                                  : 'bg-amber-50 text-amber-600 border border-amber-100'
                              }`}
                            >
                              {doc.status === 'VENCIDO'
                                ? 'VENCIDO'
                                : 'A VENCER'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
