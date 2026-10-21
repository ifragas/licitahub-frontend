import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { FileText, Search, Filter, Building, Download, Trash2, Calendar, AlertCircle, Clock } from 'lucide-react';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  // Estados de filtro e pesquisa
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [docsRes, compRes] = await Promise.all([
        api.get('/documents'),
        api.get('/companies')
      ]);
      setDocuments(docsRes.data);
      setCompanies(compRes.data);
    } catch (err) {
      console.error('Erro ao carregar documentos/empresas:', err);
      setErro('Erro ao carregar a lista de documentos.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Tem a certeza que pretende eliminar este documento?')) return;
    try {
      await api.delete(`/documents/${docId}`);
      setDocuments((prev) => prev.filter((doc) => doc._id !== docId));
    } catch (err) {
      console.error('Erro ao eliminar documento:', err);
      alert('Erro ao eliminar o documento.');
    }
  };

  // Filtragem dinâmica no frontend
  const filteredDocuments = documents.filter((doc) => {
    const matchesQuery =
      doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCompany =
      !selectedCompanyId ||
      doc.company?._id === selectedCompanyId ||
      doc.company === selectedCompanyId;

    const matchesCategory =
      !selectedCategory || doc.category === selectedCategory;

    return matchesQuery && matchesCompany && matchesCategory;
  });

  // Função auxiliar para verificar se o documento está caducado ou prestes a caducar
  const getExpirationStatus = (expirationDate) => {
    if (!expirationDate) return null;
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
          <AlertCircle size={12} /> Caducado
        </span>
      );
    } else if (diffDays <= 30) {
      return (
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
          <Clock size={12} /> Caduca em {diffDays}d
        </span>
      );
    }
    return (
      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md font-medium">
        Válido
      </span>
    );
  };

  return (
    <div className="p-8 ml-20 transition-all duration-300">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Documentos</h1>
          <p className="text-sm text-slate-500">Gestão global e consulta de documentos de todas as empresas.</p>
        </div>
      </div>

      {erro && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
          {erro}
        </div>
      )}

      {/* Painel de Filtros e Pesquisa */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Campo de Pesquisa Texto */}
          <div className="md:col-span-2 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por título ou observação..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
            />
          </div>

          {/* Filtro por Empresa */}
          <div className="relative">
            <Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all cursor-pointer"
            >
              <option value="">Todas as Empresas</option>
              {companies.map((comp) => (
                <option key={comp._id} value={comp._id}>
                  {comp.companyName}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Categoria */}
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all cursor-pointer"
            >
              <option value="">Todas as Categorias</option>
              <option value="Habilitação Jurídica">Habilitação Jurídica</option>
              <option value="Regularidade Fiscal">Regularidade Fiscal</option>
              <option value="Qualificação Técnica">Qualificação Técnica</option>
              <option value="Qualificação Econômico-Financeira">Qualificação Econômico-Financeira</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Documentos */}
      {loading ? (
        <p className="text-slate-500">A carregar documentos...</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {filteredDocuments.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              Nenum documento encontrado com os filtros selecionados.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredDocuments.map((doc) => (
                <div key={doc._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl mt-1">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-800">{doc.title}</h4>
                        {getExpirationStatus(doc.expirationDate)}
                      </div>

                      <p className="text-xs text-blue-600 font-medium flex items-center gap-1 mt-1">
                        <Building size={14} /> {doc.company?.companyName || 'Empresa não identificada'}
                      </p>

                      <p className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                        <span>Categoria: <strong className="text-slate-700">{doc.category}</strong></span>
                        {doc.expirationDate && (
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> Validade: {new Date(doc.expirationDate).toLocaleDateString('pt-PT')}
                          </span>
                        )}
                      </p>

                      {doc.notes && (
                        <p className="text-xs text-slate-400 mt-1 italic">Obs: {doc.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 rounded-xl text-xs font-medium transition-all flex items-center gap-1"
                        title="Descarregar / Ver Ficheiro"
                      >
                        <Download size={16} /> Ficheiro
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteDocument(doc._id)}
                      className="p-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 rounded-xl text-xs font-medium transition-all cursor-pointer"
                      title="Eliminar Documento"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}