
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  startPncpSearch,
  getPncpSearchProgress,
} from '../services/api';
import api from '../services/api';

import {
  Search,
  MapPin,
  Building,
  Calendar,
  DollarSign,
  ExternalLink,
  PlusCircle,
  Loader2,
  Eye,
  X,
  FileText,
  Bookmark,
  BookmarkCheck,
  Trash2,
  AlertCircle,
  Clock,
  CalendarClock,
  Filter,
  ArrowUpDown,
  CalendarX,
  CalendarCheck,
  Check,
} from 'lucide-react';

const UFS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN',
  'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
];

const MODALIDADES = [
  { id: 1, nome: 'Leilão - Eletrônico' },
  { id: 2, nome: 'Diálogo Competitivo' },
  { id: 3, nome: 'Concurso' },
  { id: 4, nome: 'Concorrência - Eletrônica' },
  { id: 5, nome: 'Pregão - Presencial' },
  { id: 6, nome: 'Pregão - Eletrônico' },
  { id: 8, nome: 'Dispensa de Licitação' },
  { id: 13, nome: 'Inexigibilidade' },
];

const ESPERA_POLLING_MS = 2000;
const TAMANHO_PAGINA = 50;
const DIAS_PRAZO_PROXIMO = 3;

function dataLocalISO(data = new Date()) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

function aguardar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function obterDataAbertura(item) {
  return (
    item?.dataAberturaProposta ||
    item?.dataInicioRecebimentoPropostas ||
    item?.dataInicioProposta ||
    item?.dataHoraAberturaProposta ||
    item?.dataAbertura ||
    null
  );
}

function interpretarData(valor) {
  if (!valor) return null;

  const texto = String(valor).trim();
  const somenteData = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  const data = somenteData
    ? new Date(
        Number(somenteData[1]),
        Number(somenteData[2]) - 1,
        Number(somenteData[3])
      )
    : new Date(texto);

  return Number.isNaN(data.getTime()) ? null : data;
}

function formatarDataHora(valor, incluirHora = true) {
  const data = interpretarData(valor);

  if (!data) return 'Não informada';

  const temHorario = /T\d{2}:\d{2}| \d{2}:\d{2}/.test(String(valor));

  if (incluirHora && temHorario) {
    return data.toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  return data.toLocaleDateString('pt-BR');
}

function classificarAbertura(valor) {
  if (!valor) {
    return {
      codigo: 'sem_data',
      texto: 'Data não informada',
      descricao: 'O PNCP não informou uma data de abertura.',
      classe: 'bg-gray-100 text-gray-600 border-gray-200',
      icone: Calendar,
      timestamp: Infinity,
    };
  }

  const data = interpretarData(valor);

  if (!data) {
    return {
      codigo: 'sem_data',
      texto: 'Data inválida',
      descricao: 'Não foi possível interpretar a data informada.',
      classe: 'bg-gray-100 text-gray-600 border-gray-200',
      icone: AlertCircle,
      timestamp: Infinity,
    };
  }

  const agora = new Date();
  const somenteData = /^\d{4}-\d{2}-\d{2}$/.test(String(valor).trim());

  const hoje = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate()
  );

  const dataSemHora = new Date(
    data.getFullYear(),
    data.getMonth(),
    data.getDate()
  );

  const diferencaDias = Math.round(
    (dataSemHora.getTime() - hoje.getTime()) / 86400000
  );

  const encerrada = somenteData
    ? dataSemHora.getTime() < hoje.getTime()
    : data.getTime() < agora.getTime();

  if (encerrada) {
    return {
      codigo: 'encerrada',
      texto: 'Data passada',
      descricao: 'A data informada já passou. Confira a situação no edital.',
      classe: 'bg-red-50 text-red-700 border-red-200',
      icone: CalendarX,
      timestamp: data.getTime(),
    };
  }

  if (diferencaDias === 0) {
    return {
      codigo: 'hoje',
      texto: 'Abertura hoje',
      descricao: 'A data informada para abertura é hoje.',
      classe: 'bg-amber-50 text-amber-700 border-amber-200',
      icone: Clock,
      timestamp: data.getTime(),
    };
  }

  if (diferencaDias <= DIAS_PRAZO_PROXIMO) {
    return {
      codigo: 'proxima',
      texto: 'Prazo próximo',
      descricao: `A data informada está prevista para daqui a ${diferencaDias} dia(s).`,
      classe: 'bg-orange-50 text-orange-700 border-orange-200',
      icone: CalendarClock,
      timestamp: data.getTime(),
    };
  }

  return {
    codigo: 'futura',
    texto: 'Abertura futura',
    descricao: 'A data informada está prevista para uma data futura.',
    classe: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icone: CalendarCheck,
    timestamp: data.getTime(),
  };
}

function formatarMoeda(valor) {
  if (valor === null || valor === undefined || valor === '') {
    return 'Não informado';
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero) || numero === 0) {
    return 'Não informado';
  }

  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function obterNomeEmpresa(emp) {
  return (
    emp?.name ||
    emp?.razaoSocial ||
    emp?.companyName ||
    emp?.corporateName ||
    emp?.nomeFantasia ||
    emp?.tradeName ||
    emp?.nome ||
    'Empresa sem nome'
  );
}

function obterChaveResultado(item, index = 0) {
  return (
    item?.numeroControlePNCP ||
    item?.id ||
    [
      item?.codigoModalidadeContratacao,
      item?.orgaoEntidade?.cnpj,
      item?.anoCompra,
      item?.sequencialCompra,
      item?.objetoCompra,
    ].filter(Boolean).join('-') ||
    `resultado-${index}`
  );
}

function removerDuplicados(lista) {
  const unicos = new Map();

  lista.forEach((item, index) => {
    const chave = obterChaveResultado(item, index);

    if (!unicos.has(chave)) {
      unicos.set(chave, item);
    }
  });

  return Array.from(unicos.values());
}

function ordenarResultados(lista, ordenacao) {
  return [...lista].sort((a, b) => {
    const dataA = a.classificacaoPrazo.timestamp;
    const dataB = b.classificacaoPrazo.timestamp;

    const semDataA = !Number.isFinite(dataA);
    const semDataB = !Number.isFinite(dataB);

    if (semDataA && !semDataB) return 1;
    if (!semDataA && semDataB) return -1;
    if (semDataA && semDataB) return 0;

    if (ordenacao === 'recentes') return dataB - dataA;

    return dataA - dataB;
  });
}

function normalizarModalidades(busca) {
  if (Array.isArray(busca?.modalidades)) {
    return busca.modalidades.map(String);
  }

  if (
    busca?.modalidades &&
    typeof busca.modalidades === 'string'
  ) {
    return busca.modalidades
      .split(',')
      .map((valor) => valor.trim())
      .filter(Boolean);
  }

  if (busca?.modalidade !== undefined && busca?.modalidade !== null) {
    return [String(busca.modalidade)];
  }

  return ['6'];
}

export default function Garimpo() {
  const hojeStr = dataLocalISO();
  const dataFutura = new Date();
  dataFutura.setDate(dataFutura.getDate() + 30);

  const [termo, setTermo] = useState('');
  const [uf, setUf] = useState('RS');
  const [modalidades, setModalidades] = useState(['6']);
  const [todasModalidades, setTodasModalidades] = useState(false);

  const [dataInicial, setDataInicial] = useState(hojeStr);
  const [dataFinal, setDataFinal] = useState(dataLocalISO(dataFutura));

  const [pagina, setPagina] = useState(1);
  const [resultados, setResultados] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importandoId, setImportandoId] = useState(null);

  const [progresso, setProgresso] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [erroPesquisa, setErroPesquisa] = useState('');

  const [buscasSalvas, setBuscasSalvas] = useState([]);
  const [salvandoBusca, setSalvandoBusca] = useState(false);

  const [filtroPrazo, setFiltroPrazo] = useState('todos');
  const [ordenacao, setOrdenacao] = useState('urgentes');

  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [modalImportacaoAberto, setModalImportacaoAberto] = useState(false);
  const [itemParaImportar, setItemParaImportar] = useState(null);
  const [empresasCadastradas, setEmpresasCadastradas] = useState([]);
  const [empresaSelecionadaId, setEmpresaSelecionadaId] = useState('');

  const buscaEmAndamentoRef = useRef(false);

  useEffect(() => {
    carregarBuscasSalvas();
  }, []);

  const carregarBuscasSalvas = async () => {
    try {
      const res = await api.get('/api/saved-searches');
      setBuscasSalvas(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Erro ao carregar pesquisas salvas:', err);
    }
  };

  const alternarModalidade = (id) => {
    const valor = String(id);

    setTodasModalidades(false);

    setModalidades((atuais) =>
      atuais.includes(valor)
        ? atuais.filter((item) => item !== valor)
        : [...atuais, valor]
    );
  };

  const handleSaveSearch = async () => {
    if (!termo.trim()) {
      return alert('Digite ao menos uma palavra-chave para salvar.');
    }

    const titulo = prompt(
      'Dê um nome para esta pesquisa salva:',
      'Minha Pesquisa Diária'
    );

    if (!titulo?.trim()) return;

    setSalvandoBusca(true);

    try {
      await api.post('/api/saved-searches', {
        title: titulo.trim(),
        termo,
        uf,
        modalidades: todasModalidades ? [] : modalidades,
        dataInicial,
        dataFinal,
      });

      await carregarBuscasSalvas();
      alert('Pesquisa salva com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar pesquisa:', err);
      alert('Erro ao salvar pesquisa.');
    } finally {
      setSalvandoBusca(false);
    }
  };

  const handleCarregarBusca = (busca) => {
    const modalidadesSalvas = normalizarModalidades(busca);

    setTermo(busca.termo || '');
    setUf(busca.uf || '');
    setDataInicial(busca.dataInicial || hojeStr);
    setDataFinal(busca.dataFinal || dataLocalISO(dataFutura));

    if (Array.isArray(busca.modalidades) && busca.modalidades.length === 0) {
      setTodasModalidades(true);
      setModalidades([]);
    } else {
      setTodasModalidades(false);
      setModalidades(modalidadesSalvas);
    }

    executarPesquisa({
      termo: busca.termo || '',
      uf: busca.uf || '',
      modalidades:
        Array.isArray(busca.modalidades) && busca.modalidades.length === 0
          ? []
          : modalidadesSalvas,
      todas:
        Array.isArray(busca.modalidades) && busca.modalidades.length === 0,
      dataInicial: busca.dataInicial || hojeStr,
      dataFinal: busca.dataFinal || dataLocalISO(dataFutura),
    });
  };

  const handleExcluirBusca = async (id, e) => {
    e.stopPropagation();

    if (!window.confirm('Deseja excluir esta pesquisa salva?')) return;

    try {
      await api.delete(`/api/saved-searches/${id}`);
      await carregarBuscasSalvas();
    } catch (err) {
      console.error('Erro ao excluir pesquisa:', err);
      alert('Erro ao excluir pesquisa.');
    }
  };

  const atualizarDadosJob = (dados) => {
    const itens = Array.isArray(dados?.data) ? dados.data : null;

    if (itens) {
      const unicos = removerDuplicados(itens);
      setResultados(unicos);
    }

    const paginasConcluidas = Number(dados?.paginasConcluidas) || 0;
    const paginasEstimadas = Number(dados?.paginasEstimadas) || 0;
    const totalEncontrado = Number(dados?.totalResultados) ||
      (itens ? itens.length : 0);

    setProgresso({
      status: dados.status || 'running',
      percentual: Number(dados.progresso) || 0,
      paginasConcluidas,
      totalPaginasConsulta: paginasEstimadas,
      totalEncontrado,
      proximaTentativaEm: dados.proximaTentativaEm || null,
      etapaAtual: dados.etapaAtual || null,
    });

    if (dados.status === 'completed') {
      const resultadosUnicos = removerDuplicados(itens || []);

      setResultados(resultadosUnicos);
      setPagina(1);
      setMeta({
        totalRegistros: resultadosUnicos.length,
        totalPaginas: Math.max(
          1,
          Math.ceil(resultadosUnicos.length / TAMANHO_PAGINA)
        ),
      });
    } else if (itens) {
      setMeta({
        totalRegistros: totalEncontrado,
        totalPaginas: Math.max(
          1,
          Math.ceil(itens.length / TAMANHO_PAGINA)
        ),
      });
    }
  };

  const executarPesquisa = async ({
    termo: termoBusca,
    uf: ufBusca,
    modalidades: modalidadesBusca,
    todas = false,
    dataInicial: inicioBusca,
    dataFinal: fimBusca,
  }) => {
    if (buscaEmAndamentoRef.current) return;

    if (inicioBusca && fimBusca && inicioBusca > fimBusca) {
      alert('A data inicial não pode ser posterior à data final.');
      return;
    }

    buscaEmAndamentoRef.current = true;
    setLoading(true);
    setErroPesquisa('');
    setProgresso(null);
    setJobId(null);
    setPagina(1);
    setResultados([]);
    setMeta(null);
    setFiltroPrazo('todos');
    setOrdenacao('urgentes');

    try {
      const inicio = await startPncpSearch({
        termo: termoBusca,
        uf: ufBusca,
        modalidades: todas ? [] : modalidadesBusca,
        dataInicial: inicioBusca,
        dataFinal: fimBusca,
      });

      const idPesquisa = inicio?.id || inicio?.jobId;

      if (!idPesquisa) {
        throw new Error(
          'O servidor não retornou o identificador da pesquisa.'
        );
      }

      setJobId(idPesquisa);

      setProgresso({
        status: inicio.status || 'queued',
        percentual: 0,
        paginasConcluidas: 0,
        totalPaginasConsulta: 0,
        totalEncontrado: 0,
      });

      let finalizado = false;

      while (!finalizado) {
        await aguardar(ESPERA_POLLING_MS);

        const dados = await getPncpSearchProgress(idPesquisa);
        atualizarDadosJob(dados);

        if (dados.status === 'completed') {
          finalizado = true;
          setErroPesquisa('');
          break;
        }

        if (dados.status === 'failed') {
          throw new Error(
            dados.erro || 'O servidor não conseguiu concluir a pesquisa.'
          );
        }

        if (!['queued', 'running', 'paused'].includes(dados.status)) {
          throw new Error(
            `O servidor retornou um estado inesperado: ${dados.status || 'vazio'}.`
          );
        }
      }
    } catch (err) {
      console.error(
        'Erro ao consultar o PNCP:',
        err.response?.data || err.message
      );

      const mensagem =
        err.response?.data?.message ||
        err.response?.data?.erro ||
        err.message ||
        'Não foi possível consultar o PNCP. Tente novamente.';

      setErroPesquisa(mensagem);

      setProgresso((atual) => ({
        ...(atual || {}),
        status: 'failed',
      }));
    } finally {
      setLoading(false);
      buscaEmAndamentoRef.current = false;
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();

    executarPesquisa({
      termo,
      uf,
      modalidades,
      todas: todasModalidades,
      dataInicial,
      dataFinal,
    });
  };

  const abrirModalImportacao = async (item) => {
    setItemParaImportar(item);

    try {
      const res = await api.get('/companies');
      const empresas = Array.isArray(res.data) ? res.data : [];

      setEmpresasCadastradas(empresas);
      setEmpresaSelecionadaId(empresas.length > 0 ? empresas[0]._id : '');
      setModalImportacaoAberto(true);
    } catch (err) {
      console.error('Erro ao carregar empresas:', err);
      alert('Erro ao carregar as empresas cadastradas.');
    }
  };

  const handleConfirmarImportacao = async (e) => {
    e.preventDefault();

    if (!empresaSelecionadaId) {
      return alert('Selecione a empresa cliente para esta licitação.');
    }

    if (!itemParaImportar) {
      return alert('Nenhuma licitação foi selecionada.');
    }

    const idImportacao =
      itemParaImportar.numeroControlePNCP ||
      itemParaImportar.id ||
      'importando';

    setImportandoId(idImportacao);

    try {
      const valorEstimado =
        itemParaImportar.valorTotalEstimado ||
        itemParaImportar.valorGlobal ||
        0;

      let linkSistema =
        itemParaImportar.linkSistemaOrigem ||
        itemParaImportar.linkEdital ||
        itemParaImportar.urlEdital ||
        itemParaImportar.link ||
        '';

      if (!linkSistema && itemParaImportar.numeroControlePNCP) {
        linkSistema =
          `https://pncp.gov.br/app/editais/${itemParaImportar.numeroControlePNCP}`;
      }

      const payload = {
        title: itemParaImportar.modalidadeNome
          ? `${itemParaImportar.modalidadeNome} - ${itemParaImportar.numeroCompra || ''}`
          : 'Licitação PNCP',
        description: itemParaImportar.objetoCompra || 'Sem descrição',
        organ:
          itemParaImportar.orgaoEntidade?.razaoSocial ||
          'Órgão não informado',
        company: empresaSelecionadaId,
        estimatedValue: valorEstimado,
        editalUrl: linkSistema,
        openingDate: obterDataAbertura(itemParaImportar) || new Date(),
        status: 'Em Análise',
      };

      await api.post('/api/bids', payload);

      alert('Licitação importada com sucesso para a empresa selecionada!');
      setModalImportacaoAberto(false);
      setItemParaImportar(null);
    } catch (err) {
      console.error(
        'Erro na importação:',
        err.response?.data || err.message
      );

      alert(
        `Erro ao importar licitação: ${
          JSON.stringify(err.response?.data || err.message)
        }`
      );
    } finally {
      setImportandoId(null);
    }
  };

  const resultadosExibidos = useMemo(() => {
    let lista = resultados.map((item) => ({
      ...item,
      classificacaoPrazo: classificarAbertura(obterDataAbertura(item)),
    }));

    if (filtroPrazo !== 'todos') {
      lista = lista.filter(
        (item) => item.classificacaoPrazo.codigo === filtroPrazo
      );
    }

    return ordenarResultados(lista, ordenacao);
  }, [resultados, filtroPrazo, ordenacao]);

  const contagemPrazos = useMemo(() => {
    const contagem = {
      todos: resultados.length,
      encerrada: 0,
      hoje: 0,
      proxima: 0,
      futura: 0,
      sem_data: 0,
    };

    resultados.forEach((item) => {
      const classificacao = classificarAbertura(obterDataAbertura(item));
      contagem[classificacao.codigo] =
        (contagem[classificacao.codigo] || 0) + 1;
    });

    return contagem;
  }, [resultados]);

  const totalPaginasExibicao = Math.max(
    1,
    Math.ceil(resultadosExibidos.length / TAMANHO_PAGINA)
  );

  const resultadosDaPagina = resultadosExibidos.slice(
    (pagina - 1) * TAMANHO_PAGINA,
    pagina * TAMANHO_PAGINA
  );

  const renderizarSeloPrazo = (item) => {
    const classificacao =
      item.classificacaoPrazo ||
      classificarAbertura(obterDataAbertura(item));

    const Icone = classificacao.icone;

    return (
      <span
        title={classificacao.descricao}
        className={`inline-flex items-center gap-1 border rounded-md px-2 py-1 text-xs font-semibold ${classificacao.classe}`}
      >
        <Icone className="w-3.5 h-3.5 shrink-0" />
        {classificacao.texto}
      </span>
    );
  };

  const obterLinkEdital = (item) =>
    item?.linkSistemaOrigem ||
    item?.linkEdital ||
    item?.urlEdital ||
    item?.link ||
    (item?.numeroControlePNCP
      ? `https://pncp.gov.br/app/editais/${item.numeroControlePNCP}`
      : '');

  return (
    <div className="p-4 md:p-5 max-w-[1600px] mx-auto space-y-4">
      {/* CABEÇALHO */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
          Garimpo de Licitações (PNCP)
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Pesquise oportunidades, acompanhe os resultados e importe licitações
          para as empresas assessoradas.
        </p>
      </div>

      {/* PESQUISAS SALVAS */}
      {buscasSalvas.length > 0 && (
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-blue-600" />
            Minhas pesquisas salvas
          </h3>

          <div className="flex flex-wrap gap-2">
            {buscasSalvas.map((busca) => (
              <div
                key={busca._id}
                onClick={() => handleCarregarBusca(busca)}
                className="bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 text-xs px-3 py-1.5 rounded-lg cursor-pointer transition flex items-center gap-2 group"
              >
                <span className="font-semibold">{busca.title}</span>
                <span className="text-slate-400 text-[10px]">
                  ({busca.uf || 'BR'})
                </span>
                <button
                  type="button"
                  onClick={(e) => handleExcluirBusca(busca._id, e)}
                  className="text-slate-300 hover:text-red-500 transition ml-1"
                  title="Excluir pesquisa salva"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FORMULÁRIO DE PESQUISA */}
      <form
        onSubmit={handleSearch}
        className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-200 space-y-3"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* TERMOS */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Termos da pesquisa
            </label>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
              <textarea
                rows={2}
                placeholder={'Ex.: areia, "pavimentação pedra irregular", transporte escolar'}
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                className="w-full h-[62px] pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition"
              />
            </div>
          </div>

          {/* UF */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Estado (UF)
            </label>

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <select
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                className="w-full h-[62px] pl-9 pr-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="">Todas as UFs</option>
                {UFS.map((sigla) => (
                  <option key={sigla} value={sigla}>
                    {sigla}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* MODALIDADES */}
        <div className="border border-gray-200 rounded-lg p-3 space-y-2">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <FileText className="w-4 h-4 text-gray-500" />
              Modalidades
            </div>

            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={todasModalidades}
                onChange={(e) => {
                  setTodasModalidades(e.target.checked);
                  if (e.target.checked) setModalidades([]);
                  else setModalidades(['6']);
                }}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Todas as modalidades
            </label>
          </div>

          {!todasModalidades && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {MODALIDADES.map((modalidade) => (
                <label
                  key={modalidade.id}
                  className="min-h-9 flex items-center gap-2 rounded-md border border-gray-200 px-2 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={modalidades.includes(String(modalidade.id))}
                    onChange={() => alternarModalidade(modalidade.id)}
                    className="h-3.5 w-3.5 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="leading-tight">{modalidade.nome}</span>
                </label>
              ))}
            </div>
          )}

          {!todasModalidades && modalidades.length === 0 && (
            <p className="text-xs text-red-600">
              Selecione pelo menos uma modalidade ou marque “Todas as modalidades”.
            </p>
          )}
        </div>

        {/* DATAS E AÇÕES */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-2 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Data inicial
              </label>
              <input
                type="date"
                value={dataInicial}
                onChange={(e) => setDataInicial(e.target.value)}
                className="w-full h-9 px-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Data final
              </label>
              <input
                type="date"
                value={dataFinal}
                min={dataInicial || undefined}
                onChange={(e) => setDataFinal(e.target.value)}
                className="w-full h-9 px-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:justify-end">
            <button
              type="submit"
              disabled={loading || (!todasModalidades && modalidades.length === 0)}
              className="h-9 bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Search className="w-4 h-4" />}
              {loading ? 'Pesquisando...' : 'Buscar'}
            </button>

            <button
              type="button"
              onClick={handleSaveSearch}
              disabled={salvandoBusca}
              className="h-9 border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 rounded-lg text-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              title="Salvar esta busca"
            >
              {salvandoBusca
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <BookmarkCheck className="w-4 h-4 text-blue-600" />}
              Salvar
            </button>
          </div>
        </div>
      </form>

      {/* ERROS DA PESQUISA */}
      {erroPesquisa && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{erroPesquisa}</span>
          </div>
        </div>
      )}

      {/* RESUMO E FILTROS */}
      {meta && (
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm space-y-3">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div>
              <h2 className="font-semibold text-gray-800 text-sm">
                Resultado da pesquisa
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {resultados.length} resultados carregados.
              </p>
            </div>

            <span className="text-xs text-gray-500">
              Página {pagina} de {totalPaginasExibicao}
            </span>
          </div>

          {/* CONTAGEM POR SITUAÇÃO */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              {
                id: 'todos',
                label: 'Todos',
                count: contagemPrazos.todos,
                style: 'border-gray-200 bg-gray-50 text-gray-700',
              },
              {
                id: 'encerrada',
                label: 'Data passada',
                count: contagemPrazos.encerrada,
                style: 'border-red-200 bg-red-50 text-red-700',
              },
              {
                id: 'hoje',
                label: 'Abertura hoje',
                count: contagemPrazos.hoje,
                style: 'border-amber-200 bg-amber-50 text-amber-700',
              },
              {
                id: 'proxima',
                label: 'Até 3 dias',
                count: contagemPrazos.proxima,
                style: 'border-orange-200 bg-orange-50 text-orange-700',
              },
              {
                id: 'futura',
                label: 'Futura',
                count: contagemPrazos.futura,
                style: 'border-emerald-200 bg-emerald-50 text-emerald-700',
              },
              {
                id: 'sem_data',
                label: 'Sem data',
                count: contagemPrazos.sem_data,
                style: 'border-slate-200 bg-slate-50 text-slate-600',
              },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setFiltroPrazo(item.id);
                  setPagina(1);
                }}
                className={`rounded-lg border p-2 text-left transition ${
                  item.style
                } ${
                  filtroPrazo === item.id
                    ? 'ring-2 ring-blue-500 ring-offset-1'
                    : 'hover:brightness-95'
                }`}
              >
                <span className="block text-xs">{item.label}</span>
                <span className="block text-lg font-bold mt-0.5">
                  {item.count}
                </span>
              </button>
            ))}
          </div>

          {/* FILTROS E ORDENAÇÃO */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Filter className="w-3.5 h-3.5" />
              Filtrar
            </div>

            <select
              value={filtroPrazo}
              onChange={(e) => {
                setFiltroPrazo(e.target.value);
                setPagina(1);
              }}
              className="h-9 border border-gray-300 rounded-lg px-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todas as situações</option>
              <option value="encerrada">Data passada</option>
              <option value="hoje">Abertura hoje</option>
              <option value="proxima">Prazo próximo (até 3 dias)</option>
              <option value="futura">Abertura futura</option>
              <option value="sem_data">Data não informada</option>
            </select>

            <div className="flex items-center gap-1.5 text-xs text-gray-500 ml-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              Ordenar
            </div>

            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value)}
              className="h-9 border border-gray-300 rounded-lg px-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="urgentes">Mais próximas primeiro</option>
              <option value="futuras">Datas futuras primeiro</option>
              <option value="recentes">Datas mais distantes primeiro</option>
            </select>

            <span className="text-xs text-gray-500 sm:ml-auto">
              Exibindo {resultadosDaPagina.length} de {resultadosExibidos.length}
            </span>
          </div>
        </div>
      )}

      {/* RESULTADOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {resultadosDaPagina.map((item, index) => {
          const dataAbertura = obterDataAbertura(item);
          const classificacao =
            item.classificacaoPrazo ||
            classificarAbertura(dataAbertura);

          return (
            <div
              key={obterChaveResultado(item, index)}
              className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition"
            >
              <div className="space-y-2.5">
                <div className="flex justify-between items-start gap-2">
                  <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md font-semibold">
                    {item.modalidadeNome || 'Modalidade não informada'}
                  </span>

                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-medium shrink-0">
                    {item.unidadeOrgao?.ufSigla || item.uf || uf || 'BR'}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-800 text-sm line-clamp-3">
                  {item.objetoCompra || 'Objeto não informado'}
                </h3>

                <div className="space-y-2 text-xs text-gray-500">
                  <p className="flex items-start gap-1.5">
                    <Building className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <span>
                      {item.orgaoEntidade?.razaoSocial || 'Órgão não informado'}
                    </span>
                  </p>

                  {renderizarSeloPrazo(item)}

                  <div
                    className={`rounded-lg border p-2 ${
                      classificacao.codigo === 'encerrada'
                        ? 'bg-red-50/60 border-red-100'
                        : classificacao.codigo === 'hoje' ||
                            classificacao.codigo === 'proxima'
                          ? 'bg-amber-50/60 border-amber-100'
                          : 'bg-gray-50 border-gray-100'
                    }`}
                  >
                    <p className="flex flex-wrap items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-semibold">Data informada:</span>
                      <span>{formatarDataHora(dataAbertura)}</span>
                    </p>

                    {classificacao.codigo === 'encerrada' && (
                      <p className="mt-1 text-red-700">
                        Confira no edital se ainda existe possibilidade de participação.
                      </p>
                    )}
                  </div>

                  <p className="flex items-center gap-1.5 font-semibold text-emerald-600">
                    <DollarSign className="w-3.5 h-3.5 shrink-0" />
                    Valor estimado:{' '}
                    {formatarMoeda(
                      item.valorTotalEstimado || item.valorGlobal
                    )}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setItemSelecionado(item)}
                  className="text-xs text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1.5 transition font-medium"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Ver detalhes
                </button>

                <div className="flex items-center gap-2">
                  {obterLinkEdital(item) && (
                    <a
                      href={obterLinkEdital(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1 p-1.5"
                      title="Abrir edital"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => abrirModalImportacao(item)}
                    disabled={
                      importandoId === (
                        item.numeroControlePNCP || item.id || 'importando'
                      )
                    }
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {importandoId === (
                      item.numeroControlePNCP || item.id || 'importando'
                    )
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <PlusCircle className="w-3.5 h-3.5" />}
                    Importar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PAGINAÇÃO */}
      {meta && totalPaginasExibicao > 1 && (
        <div className="flex items-center justify-center gap-3 py-1">
          <button
            type="button"
            disabled={loading || pagina <= 1}
            onClick={() => setPagina((atual) => Math.max(1, atual - 1))}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50 transition"
          >
            Anterior
          </button>

          <span className="text-sm text-gray-600">
            Página {pagina} de {totalPaginasExibicao}
          </span>

          <button
            type="button"
            disabled={loading || pagina >= totalPaginasExibicao}
            onClick={() =>
              setPagina((atual) =>
                Math.min(totalPaginasExibicao, atual + 1)
              )
            }
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50 transition"
          >
            Próxima
          </button>
        </div>
      )}

      {/* NENHUM RESULTADO */}
      {resultadosDaPagina.length === 0 && meta && !loading && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <CalendarClock className="w-8 h-8 text-gray-300 mx-auto mb-2" />

          <p className="text-sm font-medium text-gray-700">
            Nenhuma licitação corresponde a este filtro.
          </p>

          <p className="text-xs text-gray-500 mt-1">
            Tente outra situação ou faça uma nova pesquisa.
          </p>

          {filtroPrazo !== 'todos' && (
            <button
              type="button"
              onClick={() => {
                setFiltroPrazo('todos');
                setPagina(1);
              }}
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              Limpar filtro
            </button>
          )}
        </div>
      )}

      {/* MODAL DE DETALHES */}
      {itemSelecionado && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 md:p-6 space-y-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setItemSelecionado(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              aria-label="Fechar detalhes"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pr-8">
              <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-md font-semibold">
                {itemSelecionado.modalidadeNome || 'Modalidade não informada'}
              </span>

              <h2 className="text-lg font-bold text-gray-800 mt-2">
                Detalhes da oportunidade
              </h2>

              <p className="text-xs text-gray-400 font-mono mt-1 break-all">
                PNCP: {itemSelecionado.numeroControlePNCP || 'Não informado'}
              </p>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <strong className="text-gray-700 block mb-1">
                  Objeto da licitação:
                </strong>

                <p className="text-gray-600 bg-gray-50 p-3 rounded-xl border leading-relaxed text-justify">
                  {itemSelecionado.objetoCompra || 'Objeto não informado'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <strong className="text-gray-700 block text-xs mb-1">
                    Órgão / Entidade
                  </strong>

                  <span className="text-gray-600">
                    {itemSelecionado.orgaoEntidade?.razaoSocial || 'Não informado'}
                  </span>

                  <span className="block text-xs text-gray-400 mt-0.5">
                    CNPJ: {itemSelecionado.orgaoEntidade?.cnpj || 'Não informado'}
                  </span>
                </div>

                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <strong className="text-gray-700 block text-xs mb-1">
                    Localidade
                  </strong>

                  <span className="text-gray-600">
                    {itemSelecionado.unidadeOrgao?.nomeUnidade || 'Não informada'}
                  </span>

                  <span className="block text-xs text-gray-400 mt-0.5">
                    {itemSelecionado.unidadeOrgao?.municipioNome || ''}
                    {itemSelecionado.unidadeOrgao?.ufSigla
                      ? ` - ${itemSelecionado.unidadeOrgao.ufSigla}`
                      : ''}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <strong className="text-gray-700 block text-xs mb-1">
                    Valor estimado
                  </strong>

                  <span className="text-emerald-600 font-semibold">
                    {formatarMoeda(
                      itemSelecionado.valorTotalEstimado ||
                      itemSelecionado.valorGlobal
                    )}
                  </span>
                </div>

                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <strong className="text-gray-700 block text-xs mb-1">
                    Processo / Número
                  </strong>

                  <span className="text-gray-600">
                    Proc. {itemSelecionado.processo || 'N/A'}
                    {' '}(Comp. {itemSelecionado.numeroCompra || 'N/A'})
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-3 space-y-2">
                <strong className="text-gray-700 block text-xs">
                  Situação da data informada
                </strong>

                {renderizarSeloPrazo(itemSelecionado)}

                <p className="text-xs text-gray-500">
                  {classificarAbertura(
                    obterDataAbertura(itemSelecionado)
                  ).descricao}
                </p>

                <p className="text-sm text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>
                    Data informada:{' '}
                    <strong>
                      {formatarDataHora(obterDataAbertura(itemSelecionado))}
                    </strong>
                  </span>
                </p>

                <p className="text-xs text-gray-500">
                  Confirme o prazo vigente e o horário no edital oficial antes
                  de decidir pela participação.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 flex flex-wrap justify-end gap-2">
              {obterLinkEdital(itemSelecionado) && (
                <a
                  href={obterLinkEdital(itemSelecionado)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-blue-600 hover:bg-blue-50 font-medium flex items-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  Acessar edital externo
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  const item = itemSelecionado;
                  setItemSelecionado(null);
                  abrirModalImportacao(item);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                Importar para o sistema
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE IMPORTAÇÃO */}
      {modalImportacaoAberto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 md:p-6 space-y-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setModalImportacaoAberto(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              aria-label="Fechar importação"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pr-8">
              <h2 className="text-lg font-bold text-gray-800">
                Vincular licitação à empresa
              </h2>

              <p className="text-xs text-gray-500 mt-1">
                Selecione qual empresa assessorada será vinculada à oportunidade.
              </p>
            </div>

            <form onSubmit={handleConfirmarImportacao} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Empresa cliente:
                </label>

                <select
                  value={empresaSelecionadaId}
                  onChange={(e) => setEmpresaSelecionadaId(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Selecione uma empresa...</option>

                  {empresasCadastradas.map((empresa) => (
                    <option key={empresa._id} value={empresa._id}>
                      {obterNomeEmpresa(empresa)}
                      {(empresa.cnpj || empresa.cnpjNumber)
                        ? ` - CNPJ: ${empresa.cnpj || empresa.cnpjNumber}`
                        : ''}
                    </option>
                  ))}
                </select>

                {empresasCadastradas.length === 0 && (
                  <p className="text-xs text-amber-700 mt-2">
                    Nenhuma empresa encontrada. Cadastre uma empresa antes de importar.
                  </p>
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
                <p>
                  <strong>Objeto:</strong>{' '}
                  {itemParaImportar?.objetoCompra || 'Não informado'}
                </p>

                <p>
                  <strong>Órgão:</strong>{' '}
                  {itemParaImportar?.orgaoEntidade?.razaoSocial || 'Não informado'}
                </p>

                <p>
                  <strong>Data informada:</strong>{' '}
                  {formatarDataHora(obterDataAbertura(itemParaImportar))}
                </p>

                {itemParaImportar && renderizarSeloPrazo(itemParaImportar)}
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalImportacaoAberto(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100 font-medium"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    !empresaSelecionadaId ||
                    importandoId === (
                      itemParaImportar?.numeroControlePNCP ||
                      itemParaImportar?.id ||
                      'importando'
                    )
                  }
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {importandoId === (
                    itemParaImportar?.numeroControlePNCP ||
                    itemParaImportar?.id ||
                    'importando'
                  )
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Check className="w-4 h-4" />}
                  Confirmar importação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
