import React, { useState, useEffect } from 'react';
import { getPncpBids } from '../services/api';
import api from '../services/api';
import { Search, MapPin, Building, Calendar, DollarSign, ExternalLink, PlusCircle, Loader2, Eye, X, FileText, Bookmark, BookmarkCheck, Trash2 } from 'lucide-react';

const UFS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 
  'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'
];

const MODALIDADES = [
  { id: 1, nome: 'Leilão - Eletrônico' },
  { id: 2, nome: 'Diálogo Competitivo' },
  { id: 3, nome: 'Concurso' },
  { id: 4, nome: 'Concorrência - Eletrônica' },
  { id: 5, nome: 'Pregão - Presencial' },
  { id: 6, nome: 'Pregão - Eletrônico' },
  { id: 8, nome: 'Dispensa de Licitação' },
  { id: 13, nome: 'Inexigibilidade' }
];

export default function Garimpo() {
  const [termo, setTermo] = useState('');
  const [uf, setUf] = useState('RS');
  const [modalidade, setModalidade] = useState('6');
  const [pagina, setPagina] = useState(1);
  const [resultados, setResultados] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importandoId, setImportandoId] = useState(null);
  
  // Estado para pesquisas salvas
  const [buscasSalvas, setBuscasSalvas] = useState([]);
  const [salvandoBusca, setSalvandoBusca] = useState(false);
  
  // Estado para o Modal de Detalhes
  const [itemSelecionado, setItemSelecionado] = useState(null);

  // Estados para o Modal de Importação e Empresas
  const [modalImportacaoAberto, setModalImportacaoAberto] = useState(false);
  const [itemParaImportar, setItemParaImportar] = useState(null);
  const [empresasCadastradas, setEmpresasCadastradas] = useState([]);
  const [empresaSelecionadaId, setEmpresaSelecionadaId] = useState('');

  useEffect(() => {
    carregarBuscasSalvas();
  }, []);

  const carregarBuscasSalvas = async () => {
    try {
      const res = await api.get('/api/saved-searches');
      setBuscasSalvas(res.data);
    } catch (err) {
      console.error('Erro ao carregar pesquisas salvas');
    }
  };

  const handleSaveSearch = async () => {
    if (!termo.trim()) return alert('Digite ao menos uma palavra-chave para salvar.');
    const titulo = prompt('Dê um nome para esta pesquisa salva:', 'Minha Pesquisa Diária');
    if (!titulo) return;

    setSalvandoBusca(true);
    try {
      await api.post('/api/saved-searches', { title: titulo, termo, uf, modalidade });
      carregarBuscasSalvas();
      alert('Pesquisa salva com sucesso!');
    } catch (err) {
      alert('Erro ao salvar pesquisa.');
    } finally {
      setSalvandoBusca(false);
    }
  };

  const handleCarregarBusca = (b) => {
    setTermo(b.termo);
    setUf(b.uf || 'RS');
    setModalidade(b.modalidade || '6');
    handleSearch(null, 1, b.termo, b.uf || 'RS', b.modalidade || '6');
  };

  const handleExcluirBusca = async (id, e) => {
    e.stopPropagation();
    if (confirm('Deseja excluir esta pesquisa salva?')) {
      try {
        await api.delete(`/api/saved-searches/${id}`);
        carregarBuscasSalvas();
      } catch (err) {
        alert('Erro ao excluir pesquisa.');
      }
    }
  };

  const handleSearch = async (e, novaPagina = 1, t = termo, u = uf, m = modalidade) => {
    if (e) e.preventDefault();
    setLoading(true);
    setPagina(novaPagina);

    try {
      const data = await getPncpBids({ termo: t, uf: u, modalidade: m, pagina: novaPagina });
      setResultados(data.data || []);
      setMeta({
        totalRegistros: data.totalRegistros,
        totalPaginas: data.totalPaginas,
        numeroPagina: data.numeroPagina
      });
    } catch (err) {
      alert('Erro ao consultar o PNCP.');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalImportacao = async (item) => {
    setItemParaImportar(item);
    try {
      const res = await api.get('/companies');
      setEmpresasCadastradas(res.data || []);
      if (res.data && res.data.length > 0) {
        setEmpresaSelecionadaId(res.data[0]._id);
      }
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

    setImportandoId(itemParaImportar.numeroControlePNCP);
    try {
      const valorEstimado = itemParaImportar.valorTotalEstimado || itemParaImportar.valorGlobal || 0;

      // Extração flexível do link do edital
      let linkSistema = 
        itemParaImportar.linkSistemaOrigem || 
        itemParaImportar.linkEdital || 
        itemParaImportar.urlEdital || 
        itemParaImportar.link || 
        '';

      // Fallback para o link do próprio PNCP caso a origem não informe a URL
      if (!linkSistema && itemParaImportar.numeroControlePNCP) {
        linkSistema = `https://pncp.gov.br/app/editais/${itemParaImportar.numeroControlePNCP}`;
      }

      const payload = {
        title: itemParaImportar.modalidadeNome ? `${itemParaImportar.modalidadeNome} - ${itemParaImportar.numeroCompra || ''}` : 'Licitação PNCP',
        description: itemParaImportar.objetoCompra || 'Sem descrição',
        organ: itemParaImportar.orgaoEntidade?.razaoSocial || 'Órgão não informado',
        company: empresaSelecionadaId,
        
        // Atende ao campo do seu Schema Mongoose
        estimatedValue: valorEstimado,
        
        // Campo exato exigido pelo seu Schema Bid:
        editalUrl: linkSistema,

        openingDate: itemParaImportar.dataAberturaProposta || new Date(),
        status: 'Em Análise'
      };

      await api.post('/api/bids', payload);
      alert('Licitação importada com sucesso para a empresa selecionada!');
      setModalImportacaoAberto(false);
      setItemParaImportar(null);
    } catch (err) {
      console.error('Erro detalhado na importação:', err.response?.data || err.message);
      alert(`Erro ao importar licitação: ${JSON.stringify(err.response?.data || err.message)}`);
    } finally {
      setImportandoId(null);
    }
  };
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Garimpo de Licitações (PNCP)</h1>
          <p className="text-gray-500 text-sm">Pesquise oportunidades do Portal Nacional de Contratações Públicas e importe para o sistema.</p>
        </div>
      </div>

      {/* PAINEL DE PESQUISAS SALVAS */}
      {buscasSalvas.length > 0 && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-blue-600" /> Minhas Pesquisas Salvas
          </h3>
          <div className="flex flex-wrap gap-2">
            {buscasSalvas.map((b) => (
              <div
                key={b._id}
                onClick={() => handleCarregarBusca(b)}
                className="bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 text-xs px-3 py-1.5 rounded-lg cursor-pointer transition flex items-center gap-2 group shadow-sm"
              >
                <span className="font-semibold">{b.title}</span>
                <span className="text-slate-400 text-[10px]">({b.uf || 'BR'})</span>
                <button
                  onClick={(e) => handleExcluirBusca(b._id, e)}
                  className="text-slate-300 hover:text-red-500 transition ml-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FORMULÁRIO DE BUSCA */}
      <form onSubmit={(e) => handleSearch(e, 1)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
          <textarea
            rows={2}
            placeholder='Separe por vírgula ou use aspas para expressões exatas. Ex: areia, "pavimentação pedra irregular", "transporte%alunos"'
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="w-36 relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select
            value={uf}
            onChange={(e) => setUf(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos UFs</option>
            {UFS.map((sigla) => (
              <option key={sigla} value={sigla}>{sigla}</option>
            ))}
          </select>
        </div>

        <div className="w-52 relative">
          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select
            value={modalidade}
            onChange={(e) => setModalidade(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MODALIDADES.map((m) => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Buscar
          </button>

          <button
            type="button"
            onClick={handleSaveSearch}
            disabled={salvandoBusca}
            className="border border-slate-200 hover:bg-slate-100 text-slate-700 px-3 py-2.5 rounded-lg text-sm transition flex items-center gap-1.5 disabled:opacity-50"
            title="Salvar esta busca"
          >
            {salvandoBusca ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkCheck className="w-4 h-4 text-blue-600" />}
            Salvar
          </button>
        </div>
      </form>

      {meta && (
        <div className="text-sm text-gray-500 flex justify-between items-center">
          <span>Encontradas <strong>{meta.totalRegistros}</strong> licitações</span>
          <span>Página {meta.numeroPagina} de {meta.totalPaginas}</span>
        </div>
      )}

      {/* RESULTADOS DA BUSCA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resultados.map((item) => (
          <div key={item.numeroControlePNCP} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-2">
                <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-md font-semibold">
                  {item.modalidadeNome}
                </span>
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded font-medium">
                  {item.unidadeOrgao?.ufSigla || uf}
                </span>
              </div>

              <h3 className="font-semibold text-gray-800 text-sm line-clamp-2">
                {item.objetoCompra}
              </h3>

              <div className="space-y-1 text-xs text-gray-500">
                <p className="flex items-center gap-1.5 truncate">
                  <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{item.orgaoEntidade?.razaoSocial}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  Abertura: {item.dataAberturaProposta ? new Date(item.dataAberturaProposta).toLocaleDateString('pt-BR') : 'Não informada'}
                </p>
                <p className="flex items-center gap-1.5 font-semibold text-emerald-600">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Valor Estimado: {item.valorTotalEstimado ? item.valorTotalEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Não informado'}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between gap-2">
              <button
                onClick={() => setItemSelecionado(item)}
                className="text-xs text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition font-medium"
              >
                <Eye className="w-3.5 h-3.5 text-gray-500" /> Ver Detalhes
              </button>

              <div className="flex items-center gap-2">
                {item.linkSistemaOrigem && (
                  <a
                    href={item.linkSistemaOrigem}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 p-1.5"
                    title="Abrir Edital"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => abrirModalImportacao(item)}
                  disabled={importandoId === item.numeroControlePNCP}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {importandoId === item.numeroControlePNCP ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                  Importar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE INSPEÇÃO DETALHADA */}
      {itemSelecionado && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setItemSelecionado(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-md font-semibold">
                {itemSelecionado.modalidadeNome}
              </span>
              <h2 className="text-lg font-bold text-gray-800 mt-2">Detalhes da Oportunidade</h2>
              <p className="text-xs text-gray-400 font-mono mt-1">PNCP: {itemSelecionado.numeroControlePNCP}</p>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <strong className="text-gray-700 block mb-1">Objeto da Licitação:</strong>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-xl border leading-relaxed text-justify">
                  {itemSelecionado.objetoCompra}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-xl border">
                  <strong className="text-gray-700 block text-xs mb-1">Órgão / Entidade:</strong>
                  <span className="text-gray-600">{itemSelecionado.orgaoEntidade?.razaoSocial}</span>
                  <span className="block text-xs text-gray-400 mt-0.5">CNPJ: {itemSelecionado.orgaoEntidade?.cnpj}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border">
                  <strong className="text-gray-700 block text-xs mb-1">Localidade:</strong>
                  <span className="text-gray-600">{itemSelecionado.unidadeOrgao?.nomeUnidade}</span>
                  <span className="block text-xs text-gray-400 mt-0.5">{itemSelecionado.unidadeOrgao?.municipioName || ''} - {itemSelecionado.unidadeOrgao?.ufSigla}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded-xl border">
                  <strong className="text-gray-700 block text-xs mb-1">Valor Estimado:</strong>
                  <span className="text-emerald-600 font-semibold">
                    {itemSelecionado.valorTotalEstimado ? itemSelecionado.valorTotalEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Não informado'}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border">
                  <strong className="text-gray-700 block text-xs mb-1">Abertura Proposta:</strong>
                  <span className="text-gray-600">
                    {itemSelecionado.dataAberturaProposta ? new Date(itemSelecionado.dataAberturaProposta).toLocaleString('pt-BR') : 'Não informada'}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border">
                  <strong className="text-gray-700 block text-xs mb-1">Processo / Número:</strong>
                  <span className="text-gray-600">Proc. {itemSelecionado.processo || 'N/A'} (Comp. {itemSelecionado.numeroCompra || 'N/A'})</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end gap-3">
              {itemSelecionado.linkSistemaOrigem && (
                <a
                  href={itemSelecionado.linkSistemaOrigem}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border rounded-lg text-sm text-blue-600 hover:bg-blue-50 font-medium flex items-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" /> Acessar Edital Externo
                </a>
              )}
              <button
                onClick={() => {
                  abrirModalImportacao(itemSelecionado);
                  setItemSelecionado(null);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" /> Importar para o Sistema
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ESCOLHA DA EMPRESA PARA IMPORTAÇÃO */}
      {modalImportacaoAberto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setModalImportacaoAberto(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-lg font-bold text-gray-800">Vincular Licitação à Empresa</h2>
              <p className="text-xs text-gray-500 mt-1">Selecione qual das empresas assessoradas irá concorrer/participar desta oportunidade.</p>
            </div>

            <form onSubmit={handleConfirmarImportacao} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Empresa Cliente:</label>
                <select
  value={empresaSelecionadaId}
  onChange={(e) => setEmpresaSelecionadaId(e.target.value)}
  className="w-full p-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
  required
>
  <option value="">Selecione uma empresa...</option>
  {empresasCadastradas.map((emp) => {
    // Tenta encontrar o nome legível da empresa através de vários possíveis campos
    const nomeEmpresa = 
      emp.name || 
      emp.razaoSocial || 
      emp.companyName || 
      emp.corporateName || 
      emp.nomeFantasia || 
      emp.tradeName || 
      emp.nome || 
      'Empresa sem nome';

    const cnpjEmpresa = emp.cnpj || emp.cnpjNumber || '';

    return (
      <option key={emp._id} value={emp._id}>
        {nomeEmpresa} {cnpjEmpresa ? `- CNPJ: ${cnpjEmpresa}` : ''}
      </option>
    );
  })}
</select>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border text-xs text-slate-600 space-y-1">
                <p><strong>Objeto resumido:</strong> {itemParaImportar?.objetoCompra?.substring(0, 100)}...</p>
                <p><strong>Órgão:</strong> {itemParaImportar?.orgaoEntidade?.razaoSocial}</p>
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalImportacaoAberto(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={importandoId === itemParaImportar?.numeroControlePNCP}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {importandoId === itemParaImportar?.numeroControlePNCP ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                  Confirmar Importação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}