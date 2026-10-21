import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  Building2, Plus, Search, Mail, Phone, MapPin, 
  X, Pencil, Trash2, Loader2, FileText, Upload, Calendar, AlertCircle, Download
} from 'lucide-react';

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // Estados para o Modal (Criação / Edição de Empresa)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Campos do Formulário de Empresa
  const [cnpj, setCnpj] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  
  const [searchingCnpj, setSearchingCnpj] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Estados para o Modal de Gestão/Adição de Documentos
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [selectedCompanyForDocs, setSelectedCompanyForDocs] = useState(null);
  const [companyDocuments, setCompanyDocuments] = useState([]);
  
  // Campos do Formulário de Novo Documento (com suporte a múltiplos ficheiros)
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('Habilitação Jurídica');
  const [expirationDate, setExpirationDate] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [docFiles, setDocFiles] = useState([]); // Guarda múltiplos ficheiros
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
      setError('Erro ao carregar a lista de empresas.');
      setLoading(false);
    }
  };

  // Consulta automática de CNPJ na Receita Federal
  const handleFetchCnpj = async () => {
    const cleanCnpj = cnpj.replace(/\D/g, '');

    if (cleanCnpj.length !== 14) {
      alert('Por favor, introduza um CNPJ válido com 14 dígitos.');
      return;
    }

    setSearchingCnpj(true);
    setError('');

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
      
      if (!response.ok) {
        throw new Error('CNPJ não encontrado na Receita Federal.');
      }

      const data = await response.json();

      setCompanyName(data.razao_social || '');
      setTradeName(data.nome_fantasia || data.razao_social || '');
      
      if (data.ddd_telefone_1) setPhone(data.ddd_telefone_1);

      if (data.logradouro) {
        const fullAddress = `${data.logradouro}${data.numero ? `, ${data.numero}` : ''}${data.bairro ? ` - ${data.bairro}` : ''}`;
        setAddress(fullAddress);
      }
      if (data.municipio) setCity(data.municipio);
      if (data.uf) setState(data.uf);

      let foundEmail = data.email && typeof data.email === 'string' && data.email.trim() !== '' ? data.email.toLowerCase() : '';

      if (!foundEmail) {
        try {
          const cnpjaRes = await fetch(`https://open.cnpja.com/office/${cleanCnpj}`).catch(() => null);
          if (cnpjaRes && cnpjaRes.ok) {
            const cnpjaData = await cnpjaRes.json();
            if (cnpjaData?.emails?.[0]?.address) {
              foundEmail = cnpjaData.emails[0].address;
            }
          }
        } catch (e) {
          console.warn('Busca secundária de e-mail não retornou resultados:', e);
        }
      }

      setEmail(foundEmail);

    } catch (err) {
      console.error('Erro ao consultar CNPJ:', err);
      alert('Não foi possível obter os dados deste CNPJ automaticamente. Verifique o número ou preencha manualmente.');
    } finally {
      setSearchingCnpj(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setCnpj('');
    setCompanyName('');
    setTradeName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setCity('');
    setState('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (company) => {
    setEditingId(company._id);
    setCnpj(company.cnpj || '');
    setCompanyName(company.companyName || company.name || '');
    setTradeName(company.tradeName || '');
    setEmail(company.email || '');
    setPhone(company.phone || '');
    setAddress(company.address || '');
    setCity(company.city || '');
    setState(company.state || '');
    setIsModalOpen(true);
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const payload = {
      cnpj,
      companyName,
      name: companyName,
      tradeName,
      email,
      phone,
      address,
      city,
      state
    };

    try {
      if (editingId) {
        await api.put(`/companies/${editingId}`, payload);
      } else {
        await api.post('/companies', payload);
      }

      setIsModalOpen(false);
      fetchCompanies();
    } catch (err) {
      console.error('Erro ao guardar empresa:', err);
      setError(err.response?.data?.error || 'Erro ao guardar dados da empresa.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCompany = async (id) => {
    if (!window.confirm('Tem a certeza que deseja eliminar esta empresa? Todos os documentos e dados associados podem ser afetados.')) return;
    try {
      await api.delete(`/companies/${id}`);
      fetchCompanies();
    } catch (err) {
      console.error('Erro ao eliminar empresa:', err);
      alert('Erro ao eliminar a empresa.');
    }
  };

  // Funções para gerir documentos
  const handleOpenDocsModal = async (company) => {
    setSelectedCompanyForDocs(company);
    setDocTitle('');
    setDocCategory('Habilitação Jurídica');
    setExpirationDate('');
    setDocNotes('');
    setDocFiles([]);
    setIsDocsModalOpen(true);

    try {
      const res = await api.get('/documents');
      const filtered = (res.data || []).filter(d => 
        d.company?._id === company._id || d.company === company._id
      );
      setCompanyDocuments(filtered);
    } catch (err) {
      console.error('Erro ao buscar documentos da empresa:', err);
      setCompanyDocuments([]);
    }
  };

  // Submeter múltiplos ficheiros (ou um ficheiro sem fechar nem bloquear)
  const handleAddDocumentToCompany = async (e) => {
    e.preventDefault();
    if (!selectedCompanyForDocs) return;

    setUploadingDoc(true);
    try {
      // Se foram selecionados ficheiros
      if (docFiles.length > 0) {
        for (let i = 0; i < docFiles.length; i++) {
          const file = docFiles[i];
          const formData = new FormData();
          
          // Se houver mais do que 1 ficheiro selecionado, anexa o nome do ficheiro ao título
          const titleToUse = docFiles.length > 1 
            ? `${docTitle} (${file.name})`
            : (docTitle || file.name);

          formData.append('title', titleToUse);
          formData.append('category', docCategory);
          formData.append('expirationDate', expirationDate);
          formData.append('companyId', selectedCompanyForDocs._id);
          if (docNotes) formData.append('notes', docNotes);
          formData.append('file', file);

          await api.post('/documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      } else {
        // Envio sem ficheiro (apenas registo textual do documento/certidão)
        const formData = new FormData();
        formData.append('title', docTitle);
        formData.append('category', docCategory);
        formData.append('expirationDate', expirationDate);
        formData.append('companyId', selectedCompanyForDocs._id);
        if (docNotes) formData.append('notes', docNotes);

        await api.post('/documents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // Recarrega a lista de documentos atualizada
      const res = await api.get('/documents');
      const filtered = (res.data || []).filter(d => 
        d.company?._id === selectedCompanyForDocs._id || d.company === selectedCompanyForDocs._id
      );
      setCompanyDocuments(filtered);

      // Limpa os campos de input para permitir cadastrar novos logo de seguida
      setDocTitle('');
      setDocNotes('');
      setDocFiles([]);
      
      alert(docFiles.length > 1 ? `${docFiles.length} documentos registados com sucesso!` : 'Documento registado com sucesso!');
    } catch (err) {
      console.error('Erro ao guardar documento(s):', err.response?.data || err);
      alert(err.response?.data?.error || 'Erro ao guardar documento(s). Verifique os campos.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Tem a certeza que pretende eliminar este documento?')) return;
    try {
      await api.delete(`/documents/${docId}`);
      setCompanyDocuments(prev => prev.filter(d => d._id !== docId));
    } catch (err) {
      console.error('Erro ao eliminar documento:', err);
      alert('Erro ao eliminar o documento.');
    }
  };

  // Filtrar empresas
  const filteredCompanies = companies.filter(comp => {
    const nameStr = (comp.companyName || comp.name || '').toLowerCase();
    const cnpjStr = (comp.cnpj || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return nameStr.includes(term) || cnpjStr.includes(term);
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Topo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestão de Empresas Clientes</h1>
          <p className="text-slate-500 mt-1">Cadastre empresas, consulte a Receita Federal e gira múltiplos documentos por cliente.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <Plus size={18} /> Nova Empresa
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
            placeholder="Buscar por Razão Social, Nome Fantasia ou CNPJ..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Lista de Empresas em Grelha */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-400">
          <p>A carregar empresas...</p>
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-8 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Nenhuma empresa cadastrada</h3>
          <p className="text-slate-500 text-sm mt-1 mb-6">Registe o seu primeiro cliente introduzindo apenas o CNPJ.</p>
          <button
            onClick={handleOpenCreateModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-all cursor-pointer"
          >
            Cadastrar Empresa
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((comp) => (
            <div key={comp._id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1">
                    <FileText size={12} /> {comp.cnpj || 'CNPJ não informado'}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(comp)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                      title="Editar Empresa"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCompany(comp._id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                      title="Eliminar Empresa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-800 text-lg mb-1 line-clamp-1">{comp.companyName || comp.name}</h3>
                {comp.tradeName && (
                  <p className="text-xs text-slate-500 font-medium mb-4 line-clamp-1">
                    Fantasia: {comp.tradeName}
                  </p>
                )}

                <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3 mt-2">
                  {comp.email && (
                    <p className="flex items-center gap-2 truncate">
                      <Mail size={14} className="text-slate-400 shrink-0" />
                      <span>{comp.email}</span>
                    </p>
                  )}
                  {comp.phone && (
                    <p className="flex items-center gap-2 truncate">
                      <Phone size={14} className="text-slate-400 shrink-0" />
                      <span>{comp.phone}</span>
                    </p>
                  )}
                  {(comp.address || comp.city) && (
                    <p className="flex items-start gap-2 line-clamp-2">
                      <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                      <span>{comp.address} {comp.city && `- ${comp.city}/${comp.state || ''}`}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Botão para gerir documentos */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleOpenDocsModal(comp)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload size={14} /> Gerir Documentos
                </button>
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Cliente Ativo</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição de Empresa */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">
                {editingId ? 'Editar Empresa' : 'Nova Empresa Cliente'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">CNPJ</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    required
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleFetchCnpj}
                    disabled={searchingCnpj}
                    className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold text-xs rounded-xl transition-all border border-blue-100 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {searchingCnpj ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> A consultar...
                      </>
                    ) : (
                      <>
                        <Search size={14} /> Buscar CNPJ
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Preencha o CNPJ e clique em Buscar para preencher automaticamente via Receita Federal.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Razão Social</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Razão Social da Empresa"
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
                  placeholder="Nome Fantasia (Opcional)"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contacto@empresa.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Telefone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Endereço</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, Número, Bairro"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Cidade</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Cidade"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="RS"
                    maxLength={2}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
                  {submitting ? 'A guardar...' : editingId ? 'Guardar Alterações' : 'Salvar Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Gerir e Adicionar Múltiplos Documentos */}
      {isDocsModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Documentos da Empresa</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedCompanyForDocs?.companyName || selectedCompanyForDocs?.name}</p>
              </div>
              <button
                onClick={() => setIsDocsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Formulário para Adicionar Múltiplos Documentos */}
              <form onSubmit={handleAddDocumentToCompany} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Adicionar Novo Documento</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Título / Nome Geral</label>
                    <input
                      type="text"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder="Ex: Certidão Negativa ou Contrato"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Categoria</label>
                    <select
                      value={docCategory}
                      onChange={(e) => setDocCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                    >
                      <option value="Habilitação Jurídica">Habilitação Jurídica</option>
                      <option value="Regularidade Fiscal">Regularidade Fiscal</option>
                      <option value="Qualificação Técnica">Qualificação Técnica</option>
                      <option value="Qualificação Econômico-Financeira">Qualificação Econômico-Financeira</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Validade / Expiração</label>
                    <input
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Ficheiros (Pode selecionar vários)
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setDocFiles(Array.from(e.target.files))}
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600 focus:outline-none cursor-pointer"
                    />
                    {docFiles.length > 0 && (
                      <p className="text-[10px] text-blue-600 font-medium mt-1">
                        {docFiles.length} {docFiles.length === 1 ? 'ficheiro selecionado' : 'ficheiros selecionados'}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Observações (Opcional)</label>
                  <input
                    type="text"
                    value={docNotes}
                    onChange={(e) => setDocNotes(e.target.value)}
                    placeholder="Detalhes adicionais..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={uploadingDoc}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Plus size={14} /> {uploadingDoc ? 'A enviar...' : 'Adicionar Documento(s)'}
                  </button>
                </div>
              </form>

              {/* Lista de Documentos da empresa */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Documentos Anexados ({companyDocuments.length})</h4>
                {companyDocuments.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    Nenhum documento registado para esta empresa ainda.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {companyDocuments.map((doc) => (
                      <div key={doc._id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs shadow-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">{doc.title}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                              {doc.category}
                            </span>
                          </div>
                          {doc.expirationDate && (
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                              <Calendar size={12} /> Validade: {new Date(doc.expirationDate).toLocaleDateString('pt-PT')}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {doc.fileUrl && (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition-all"
                              title="Descarregar Ficheiro"
                            >
                              <Download size={14} />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc._id)}
                            className="p-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg transition-all cursor-pointer"
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

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDocsModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Concluir / Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}