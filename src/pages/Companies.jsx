import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Building2, Plus, FileText, Phone, Mail, FolderOpen, Upload, Download, Trash2, X, Search, Filter } from 'lucide-react';

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  // Estados para o Modal de Nova Empresa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [taxRegime, setTaxRegime] = useState('ME');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Estados para o Modal de Gestão de Documentos
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyDocs, setCompanyDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Estados de Filtro/Pesquisa nos Documentos
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');

  // Estados do formulário de novo(s) documento(s)
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('Regularidade Fiscal');
  const [docExpirationDate, setDocExpirationDate] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [docFiles, setDocFiles] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      setCompanies(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar empresas:', err);
      setErro('Erro ao carregar as empresas.');
      setLoading(false);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErro('');

    try {
      await api.post('/companies', {
        companyName,
        tradeName,
        cnpj,
        taxRegime,
        contactEmail,
        contactPhone
      });

      setIsModalOpen(false);
      setCompanyName('');
      setTradeName('');
      setCnpj('');
      setTaxRegime('ME');
      setContactEmail('');
      setContactPhone('');
      fetchCompanies();
    } catch (err) {
      console.error('Erro ao criar empresa:', err);
      setErro(err.response?.data?.error || 'Erro ao criar a empresa. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDocumentsModal = async (company) => {
    setSelectedCompany(company);
    setSearchQuery('');
    setCategoryFilter('Todos');
    setIsDocModalOpen(true);
    fetchCompanyDocuments(company._id);
  };

  const fetchCompanyDocuments = async (companyId) => {
    setLoadingDocs(true);
    try {
      const response = await api.get(`/documents?companyId=${companyId}`);
      setCompanyDocs(response.data);
    } catch (err) {
      console.error('Erro ao buscar documentos:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (docFiles.length === 0 || !selectedCompany) return;

    setUploadingDoc(true);
    try {
      const uploadPromises = Array.from(docFiles).map((file, index) => {
        const formData = new FormData();
        const titleToUse = docFiles.length > 1 && docTitle
          ? `${docTitle} (${index + 1})`
          : (docTitle || file.name);

        formData.append('title', titleToUse);
        formData.append('category', docCategory);
        formData.append('expirationDate', docExpirationDate);
        formData.append('companyId', selectedCompany._id);
        formData.append('notes', docNotes);
        formData.append('file', file);

        return api.post('/documents', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      });

      await Promise.all(uploadPromises);

      setDocTitle('');
      setDocCategory('Regularidade Fiscal');
      setDocExpirationDate('');
      setDocNotes('');
      setDocFiles([]);
      fetchCompanyDocuments(selectedCompany._id);
    } catch (err) {
      console.error('Erro ao enviar documento(s):', err);
      alert(err.response?.data?.error || 'Erro ao fazer upload do(s) documento(s).');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Tem certeza que deseja eliminar este documento?')) return;
    try {
      await api.delete(`/documents/${docId}`);
      fetchCompanyDocuments(selectedCompany._id);
    } catch (err) {
      console.error('Erro ao eliminar documento:', err);
    }
  };

  // Filtragem dinâmica dos documentos
  const filteredDocs = companyDocs.filter((doc) => {
    const matchesQuery = doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'Todos' || doc.category === categoryFilter;
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="p-8 ml-20 transition-all duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Empresas</h1>
          <p className="text-sm text-slate-500">Gerencie as empresas e clientes para as licitações.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <Plus size={18} /> Nova Empresa
        </button>
      </div>

      {erro && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
          {erro}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">A carregar empresas...</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {companies.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Nenhuma empresa encontrada.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {companies.map((comp) => (
                <div key={comp._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl mt-1">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-800">{comp.companyName}</h4>
                        {comp.taxRegime && (
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                            {comp.taxRegime}
                          </span>
                        )}
                      </div>
                      {comp.tradeName && (
                        <p className="text-xs text-slate-500 mt-0.5">Nome Fantasia: {comp.tradeName}</p>
                      )}
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <FileText size={14} /> CNPJ: {comp.cnpj}
                      </p>
                      {comp.contactEmail && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <Mail size={14} /> {comp.contactEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => openDocumentsModal(comp)}
                    className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-xl text-xs font-medium transition-all cursor-pointer"
                  >
                    <FolderOpen size={16} /> Documentos
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Criação de Empresa */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Nova Empresa</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Razão Social</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Consultoria Exemplo Ltda"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nome Fantasia</label>
                <input
                  type="text"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  placeholder="Ex: Exemplo Licitações"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Porte / Enquadramento</label>
                  <select
                    value={taxRegime}
                    onChange={(e) => setTaxRegime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="ME">ME (Microempresa)</option>
                    <option value="EPP">EPP (Empresa de Pequeno Porte)</option>
                    <option value="Demais">Demais</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">E-mail de Contacto</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="empresa@email.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Telefone de Contacto</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
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
                  {submitting ? 'A guardar...' : 'Salvar Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Gestão de Documentos da Empresa */}
      {isDocModalOpen && selectedCompany && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Documentos da Empresa</h3>
                <p className="text-xs text-slate-500">{selectedCompany.companyName} (CNPJ: {selectedCompany.cnpj})</p>
              </div>
              <button
                onClick={() => setIsDocModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Formulário para Enviar Documentos */}
              <form onSubmit={handleUploadDocument} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                  <Upload size={16} /> Adicionar Documento(s)
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Título do Documento</label>
                    <input
                      type="text"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder="Ex: Certidão Negativa"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Categoria</label>
                    <select
                      value={docCategory}
                      onChange={(e) => setDocCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Habilitação Jurídica">Habilitação Jurídica</option>
                      <option value="Regularidade Fiscal">Regularidade Fiscal</option>
                      <option value="Qualificação Técnica">Qualificação Técnica</option>
                      <option value="Qualificação Econômico-Financeira">Qualificação Econômico-Financeira</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Data de Validade</label>
                    <input
                      type="date"
                      value={docExpirationDate}
                      onChange={(e) => setDocExpirationDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Ficheiro(s)</label>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setDocFiles(e.target.files)}
                      required
                      className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Notas / Observações</label>
                  <input
                    type="text"
                    value={docNotes}
                    onChange={(e) => setDocNotes(e.target.value)}
                    placeholder="Notas adicionais sobre o documento..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={uploadingDoc}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {uploadingDoc ? 'A enviar...' : `Enviar (${docFiles.length || 0}) Ficheiro(s)`}
                  </button>
                </div>
              </form>

              {/* Seção de Pesquisa e Filtros */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm text-slate-800">
                    Documentos Registados ({filteredDocs.length})
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Campo de Pesquisa por Nome/Notas */}
                  <div className="md:col-span-2 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Pesquisar documento por nome ou observação..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    />
                  </div>

                  {/* Seleção de Categoria */}
                  <div className="relative">
                    <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="Todos">Todas as Categorias</option>
                      <option value="Habilitação Jurídica">Habilitação Jurídica</option>
                      <option value="Regularidade Fiscal">Regularidade Fiscal</option>
                      <option value="Qualificação Técnica">Qualificação Técnica</option>
                      <option value="Qualificação Econômico-Financeira">Qualificação Econômico-Financeira</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                </div>

                {/* Lista de Documentos Filtrados */}
                {loadingDocs ? (
                  <p className="text-xs text-slate-500">A carregar documentos...</p>
                ) : filteredDocs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    {companyDocs.length === 0
                      ? 'Nenhum documento associado a esta empresa.'
                      : 'Nenhum documento encontrado com os filtros selecionados.'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredDocs.map((doc) => (
                      <div key={doc._id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <FileText size={18} />
                          </div>
                          <div>
                            <h5 className="font-semibold text-xs text-slate-800">{doc.title}</h5>
                            <p className="text-[11px] text-slate-500">
                              Categoria: <span className="font-medium text-slate-700">{doc.category}</span>
                              {doc.expirationDate && ` • Validade: ${new Date(doc.expirationDate).toLocaleDateString('pt-PT')}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {doc.fileUrl && (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 rounded-lg text-xs transition-all flex items-center gap-1"
                              title="Descarregar / Ver Ficheiro"
                            >
                              <Download size={14} />
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteDocument(doc._id)}
                            className="p-2 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 rounded-lg text-xs transition-all cursor-pointer"
                            title="Eliminar Documento"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}