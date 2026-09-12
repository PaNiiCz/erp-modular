import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Produto, ProdutoForm, Categoria, Marca, Fornecedor } from '../../types/produto';
import { listarCategorias, listarMarcas, listarFornecedores } from '../../services/produtos';
import api from '../../services/api';

interface Props {
  produto: Produto | null;
  onClose: () => void;
  onSalvar: (dados: ProdutoForm) => Promise<void>;
}

const vazio: ProdutoForm = {
  sku: '',
  codigo_barras: '',
  nome: '',
  descricao: '',
  categoria: null,
  marca: null,
  fornecedor: null,
  imagem: null,
  preco_custo: '0.00',
  preco_venda: '0.00',
  unidade: 'UN',
  estoque_minimo: 0,
  status: 'ATIVO',
};

function formatarMoeda(digitos: string): string {
  const limpo = digitos.replace(/\D/g, '');
  if (!limpo) return '';
  const numero = Number(limpo) / 100;
  return numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function paraFormatoBackend(exibido: string): string {
  const limpo = exibido.replace(/\D/g, '');
  if (!limpo) return '0.00';
  return (Number(limpo) / 100).toFixed(2);
}

function paraExibicao(valorBackend: string): string {
  const numero = Number(valorBackend || '0');
  return numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Monta a URL completa da imagem salva no back-end (o campo vem como caminho relativo, ex: /media/produtos/x.jpg)
function obterUrlImagem(caminho: string | null): string | null {
  if (!caminho) return null;
  if (caminho.startsWith('http')) return caminho; // já é uma URL completa
  const baseUrl = (api.defaults.baseURL ?? '').replace(/\/api\/?$/, '');
  return `${baseUrl}${caminho}`;
}

export default function ProdutoFormModal({ produto, onClose, onSalvar }: Props) {
  const [form, setForm] = useState<ProdutoForm>(vazio);
  const [custoExibido, setCustoExibido] = useState('');
  const [vendaExibido, setVendaExibido] = useState('');
  const [estoqueExibido, setEstoqueExibido] = useState('');
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [imagemArquivo, setImagemArquivo] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);

  useEffect(() => {
    listarCategorias().then(setCategorias).catch(() => setCategorias([]));
    listarMarcas().then(setMarcas).catch(() => setMarcas([]));
    listarFornecedores().then(setFornecedores).catch(() => setFornecedores([]));
  }, []);

  useEffect(() => {
    if (produto) {
      const { id, criado_em, atualizado_em, categoria_nome, marca_nome, fornecedor_nome, ...resto } = produto;
      setForm(resto);
      setCustoExibido(paraExibicao(produto.preco_custo));
      setVendaExibido(paraExibicao(produto.preco_venda));
      setEstoqueExibido(produto.estoque_minimo ? String(produto.estoque_minimo) : '');
      setImagemPreview(obterUrlImagem(produto.imagem));
      setImagemArquivo(null);
    } else {
      setForm(vazio);
      setCustoExibido('');
      setVendaExibido('');
      setEstoqueExibido('');
      setImagemPreview(null);
      setImagemArquivo(null);
    }
  }, [produto]);

  const campo = <K extends keyof ProdutoForm>(name: K, valor: ProdutoForm[K]) => {
    setForm((f) => ({ ...f, [name]: valor }));
  };

  const handleCustoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitos = e.target.value.replace(/\D/g, '');
    setCustoExibido(formatarMoeda(digitos));
    campo('preco_custo', paraFormatoBackend(digitos));
  };

  const handleVendaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitos = e.target.value.replace(/\D/g, '');
    setVendaExibido(formatarMoeda(digitos));
    campo('preco_venda', paraFormatoBackend(digitos));
  };

  const handleEstoqueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitos = e.target.value.replace(/\D/g, '');
    setEstoqueExibido(digitos);
    campo('estoque_minimo', digitos ? Number(digitos) : 0);
  };

  const handleCodigoBarrasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitos = e.target.value.replace(/\D/g, '').slice(0, 14);
    campo('codigo_barras', digitos);
  };

  const handleImagemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setImagemArquivo(arquivo);
    setImagemPreview(URL.createObjectURL(arquivo));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await onSalvar({ ...form, imagem: imagemArquivo as unknown as string | null });
    } catch {
      setErro('Não foi possível salvar. Verifique se o SKU já não está em uso.');
    } finally {
      setSalvando(false);
    }
  };

  const input = 'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-text-primary text-sm font-sans outline-none focus:border-primary';
  const label = 'text-text-secondary text-xs font-sans block mb-1';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-primary text-lg font-bold font-sans">
            {produto ? 'Editar produto' : 'Novo produto'}
          </h2>
          <button type="button" onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        {erro && <p className="text-danger text-sm font-sans mb-3">{erro}</p>}

        <div className="mb-4 flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
            {imagemPreview ? (
              <img src={imagemPreview} alt="Preview do produto" className="w-full h-full object-cover" />
            ) : (
              <span className="text-text-secondary text-xs font-sans text-center px-1">Sem imagem</span>
            )}
          </div>
          <div>
            <label className={label}>Imagem do produto</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImagemChange}
              className="text-text-secondary text-xs font-sans file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-white file:text-xs file:font-semibold file:cursor-pointer hover:file:opacity-90"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className={label}>SKU</label>
            <input className={input} value={form.sku} onChange={(e) => campo('sku', e.target.value)} required />
          </div>
          <div>
            <label className={label}>Código de barras</label>
            <input
              className={input}
              value={form.codigo_barras ?? ''}
              onChange={handleCodigoBarrasChange}
              inputMode="numeric"
              placeholder="Ex: 7891234567895"
              maxLength={14}
            />
          </div>
        </div>

        <div className="mb-3">
          <label className={label}>Nome</label>
          <input className={input} value={form.nome} onChange={(e) => campo('nome', e.target.value)} required />
        </div>

        <div className="mb-3">
          <label className={label}>Descrição</label>
          <textarea className={input} rows={2} value={form.descricao ?? ''} onChange={(e) => campo('descricao', e.target.value)} />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <label className={label}>Categoria</label>
            <select className={input} value={form.categoria ?? ''} onChange={(e) => campo('categoria', e.target.value ? Number(e.target.value) : null)}>
              <option value="">Nenhuma</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Marca</label>
            <select className={input} value={form.marca ?? ''} onChange={(e) => campo('marca', e.target.value ? Number(e.target.value) : null)}>
              <option value="">Nenhuma</option>
              {marcas.map((m) => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Fornecedor</label>
            <select className={input} value={form.fornecedor ?? ''} onChange={(e) => campo('fornecedor', e.target.value ? Number(e.target.value) : null)}>
              <option value="">Nenhum</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className={label}>Preço de custo</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">R$</span>
              <input
                className={`${input} pl-9`}
                value={custoExibido}
                onChange={handleCustoChange}
                inputMode="numeric"
                placeholder="0,00"
                required
              />
            </div>
          </div>
          <div>
            <label className={label}>Preço de venda</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">R$</span>
              <input
                className={`${input} pl-9`}
                value={vendaExibido}
                onChange={handleVendaChange}
                inputMode="numeric"
                placeholder="0,00"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className={label}>Unidade</label>
            <select className={input} value={form.unidade} onChange={(e) => campo('unidade', e.target.value as ProdutoForm['unidade'])}>
              <option value="UN">Unidade</option>
              <option value="KG">Quilograma</option>
              <option value="L">Litro</option>
              <option value="CX">Caixa</option>
              <option value="PC">Pacote</option>
            </select>
          </div>
          <div>
            <label className={label}>Estoque mínimo</label>
            <input
              className={input}
              value={estoqueExibido}
              onChange={handleEstoqueChange}
              inputMode="numeric"
              placeholder="0"
            />
          </div>
          <div>
            <label className={label}>Status</label>
            <select className={input} value={form.status} onChange={(e) => campo('status', e.target.value as ProdutoForm['status'])}>
              <option value="ATIVO">Ativo</option>
              <option value="INATIVO">Inativo</option>
              <option value="DESCONTINUADO">Descontinuado</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-text-secondary font-sans text-sm hover:bg-white/5 transition">
            Cancelar
          </button>
          <button type="submit" disabled={salvando} className="px-5 py-2 rounded-xl bg-primary text-white font-sans text-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}