import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { Compra, CompraForm, ItemCompraForm, FormaPagamentoCompra } from '../../types/compra';
import type { Fornecedor } from '../../types/produto';
import type { Produto } from '../../types/produto';
import { listarFornecedores, listarProdutos } from '../../services/produtos';
import SelectCampo from '../SelectCampo';

interface Props {
  compra: Compra | null;
  onClose: () => void;
  onSalvar: (dados: CompraForm) => Promise<void>;
}

const itemVazio: ItemCompraForm = { produto: null, quantidade: 1, preco_unitario: '0.00' };

const vazio: CompraForm = {
  fornecedor: null,
  forma_pagamento: 'BOLETO',
  desconto: '0.00',
  observacoes: '',
  itens: [{ ...itemVazio }],
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

export default function CompraFormModal({ compra, onClose, onSalvar }: Props) {
  const [form, setForm] = useState<CompraForm>(vazio);
  const [descontoExibido, setDescontoExibido] = useState('');
  const [precosExibidos, setPrecosExibidos] = useState<string[]>(['']);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    listarFornecedores().then(setFornecedores).catch(() => setFornecedores([]));
    listarProdutos().then((dados) => setProdutos(dados.results)).catch(() => setProdutos([]));
  }, []);

  useEffect(() => {
    if (compra) {
      setForm({
        fornecedor: compra.fornecedor,
        forma_pagamento: compra.forma_pagamento,
        desconto: compra.desconto,
        observacoes: compra.observacoes ?? '',
        itens: compra.itens.map((i) => ({ produto: i.produto, quantidade: i.quantidade, preco_unitario: i.preco_unitario })),
      });
      setDescontoExibido(paraExibicao(compra.desconto));
      setPrecosExibidos(compra.itens.map((i) => paraExibicao(i.preco_unitario)));
    } else {
      setForm(vazio);
      setDescontoExibido('');
      setPrecosExibidos(['']);
    }
  }, [compra]);

  const campo = <K extends keyof CompraForm>(name: K, valor: CompraForm[K]) => {
    setForm((f) => ({ ...f, [name]: valor }));
  };

  const handleDescontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitos = e.target.value.replace(/\D/g, '');
    setDescontoExibido(formatarMoeda(digitos));
    campo('desconto', paraFormatoBackend(digitos));
  };

  const atualizarItem = (index: number, mudanca: Partial<ItemCompraForm>) => {
    setForm((f) => {
      const itens = [...f.itens];
      itens[index] = { ...itens[index], ...mudanca };
      return { ...f, itens };
    });
  };

  const handleProdutoItemChange = (index: number, produtoId: number) => {
    const produto = produtos.find((p) => p.id === produtoId);
    // na compra, sugere o preço de custo (é o que a empresa paga ao fornecedor), não o de venda
    atualizarItem(index, { produto: produtoId, preco_unitario: produto ? produto.preco_custo : '0.00' });
    setPrecosExibidos((precos) => {
      const novo = [...precos];
      novo[index] = produto ? paraExibicao(produto.preco_custo) : '';
      return novo;
    });
  };

  const handlePrecoItemChange = (index: number, valor: string) => {
    const digitos = valor.replace(/\D/g, '');
    setPrecosExibidos((precos) => {
      const novo = [...precos];
      novo[index] = formatarMoeda(digitos);
      return novo;
    });
    atualizarItem(index, { preco_unitario: paraFormatoBackend(digitos) });
  };

  const adicionarItem = () => {
    setForm((f) => ({ ...f, itens: [...f.itens, { ...itemVazio }] }));
    setPrecosExibidos((precos) => [...precos, '']);
  };

  const removerItem = (index: number) => {
    if (form.itens.length === 1) return;
    setForm((f) => ({ ...f, itens: f.itens.filter((_, i) => i !== index) }));
    setPrecosExibidos((precos) => precos.filter((_, i) => i !== index));
  };

  const subtotalItem = (index: number) => {
    const item = form.itens[index];
    if (!item) return 0;
    return item.quantidade * Number(item.preco_unitario || 0);
  };

  const totalCompra = form.itens.reduce((acc, _item, i) => acc + subtotalItem(i), 0) - Number(form.desconto || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!form.fornecedor) {
      setErro('Selecione um fornecedor.');
      return;
    }
    if (form.itens.some((i) => !i.produto || i.quantidade <= 0)) {
      setErro('Preencha produto e quantidade em todos os itens.');
      return;
    }
    setSalvando(true);
    try {
      await onSalvar(form);
    } catch {
      setErro('Não foi possível salvar a compra.');
    } finally {
      setSalvando(false);
    }
  };

  const input = 'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-text-primary text-sm font-sans outline-none focus:border-primary';
  const label = 'text-text-secondary text-xs font-sans block mb-1';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-primary text-lg font-bold font-sans">
            {compra ? `Editar compra #${compra.id}` : 'Nova compra'}
          </h2>
          <button type="button" onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        {erro && <p className="text-danger text-sm font-sans mb-3">{erro}</p>}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className={label}>Fornecedor</label>
            <SelectCampo
              className="w-full"
              value={form.fornecedor ?? ''}
              onChange={(e) => campo('fornecedor', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Selecione um fornecedor</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </SelectCampo>
          </div>
          <div>
            <label className={label}>Forma de pagamento</label>
            <SelectCampo
              className="w-full"
              value={form.forma_pagamento}
              onChange={(e) => campo('forma_pagamento', e.target.value as FormaPagamentoCompra)}
            >
              <option value="DINHEIRO">Dinheiro</option>
              <option value="PIX">Pix</option>
              <option value="CARTAO_CREDITO">Cartão de Crédito</option>
              <option value="CARTAO_DEBITO">Cartão de Débito</option>
              <option value="BOLETO">Boleto</option>
            </SelectCampo>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <label className={label}>Itens da compra</label>
            <button
              type="button"
              onClick={adicionarItem}
              className="flex items-center gap-1 text-primary text-xs font-sans font-semibold hover:opacity-80 transition"
            >
              <Plus size={14} />
              Adicionar item
            </button>
          </div>

          <div className="space-y-2">
            {form.itens.map((item, index) => (
              <div key={index} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 items-end bg-white/5 rounded-xl p-2">
                <div>
                  {index === 0 && <label className={label}>Produto</label>}
                  <SelectCampo
                    className="w-full"
                    value={item.produto ?? ''}
                    onChange={(e) => handleProdutoItemChange(index, Number(e.target.value))}
                  >
                    <option value="">Selecione</option>
                    {produtos.map((p) => (
                      <option key={p.id} value={p.id}>{p.sku} — {p.nome}</option>
                    ))}
                  </SelectCampo>
                </div>
                <div>
                  {index === 0 && <label className={label}>Qtd.</label>}
                  <input
                    className={input}
                    type="number"
                    min={1}
                    value={item.quantidade}
                    onChange={(e) => atualizarItem(index, { quantidade: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  {index === 0 && <label className={label}>Preço unit.</label>}
                  <input
                    className={input}
                    value={precosExibidos[index] ?? ''}
                    onChange={(e) => handlePrecoItemChange(index, e.target.value)}
                    inputMode="numeric"
                    placeholder="0,00"
                    required
                  />
                </div>
                <div>
                  {index === 0 && <label className={label}>Subtotal</label>}
                  <div className={`${input} bg-transparent border-transparent text-text-secondary`}>
                    R$ {subtotalItem(index).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removerItem(index)}
                  disabled={form.itens.length === 1}
                  className="text-text-secondary hover:text-danger transition disabled:opacity-30 h-9"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className={label}>Desconto</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">R$</span>
              <input
                className={`${input} pl-9`}
                value={descontoExibido}
                onChange={handleDescontoChange}
                inputMode="numeric"
                placeholder="0,00"
              />
            </div>
          </div>
          <div className="flex flex-col justify-end">
            <label className={label}>Total da compra</label>
            <div className="px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 text-text-primary text-sm font-sans font-bold">
              R$ {totalCompra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className={label}>Observações</label>
          <textarea
            className={input}
            rows={2}
            value={form.observacoes}
            onChange={(e) => campo('observacoes', e.target.value)}
          />
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