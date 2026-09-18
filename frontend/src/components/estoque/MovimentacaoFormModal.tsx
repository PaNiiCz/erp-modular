import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { MovimentacaoForm, TipoMovimentacao } from '../../types/estoque';
import type { Produto } from '../../types/produto';
import { listarProdutos } from '../../services/produtos';

interface Props {
  onClose: () => void;
  onSalvar: (dados: MovimentacaoForm) => Promise<void>;
}

const vazio: MovimentacaoForm = {
  produto: null,
  tipo: 'ENTRADA',
  quantidade: 0,
  motivo: '',
  observacoes: '',
};

const tipoInfo: Record<TipoMovimentacao, { label: string; descricao: string }> = {
  ENTRADA: { label: 'Entrada', descricao: 'Soma a quantidade ao estoque atual' },
  SAIDA: { label: 'Saída', descricao: 'Subtrai a quantidade do estoque atual' },
  AJUSTE: { label: 'Ajuste', descricao: 'Define a quantidade informada como o novo total' },
  TRANSFERENCIA: { label: 'Transferência', descricao: 'Subtrai a quantidade do estoque atual (saída para outro local)' },
};

export default function MovimentacaoFormModal({ onClose, onSalvar }: Props) {
  const [form, setForm] = useState<MovimentacaoForm>(vazio);
  const [quantidadeExibida, setQuantidadeExibida] = useState('');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    listarProdutos().then((dados) => setProdutos(dados.results)).catch(() => setProdutos([]));
  }, []);

  const campo = <K extends keyof MovimentacaoForm>(name: K, valor: MovimentacaoForm[K]) => {
    setForm((f) => ({ ...f, [name]: valor }));
  };

  const handleQuantidadeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitos = e.target.value.replace(/\D/g, '');
    setQuantidadeExibida(digitos);
    campo('quantidade', digitos ? Number(digitos) : 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!form.produto) {
      setErro('Selecione um produto.');
      return;
    }
    if (!form.quantidade || form.quantidade <= 0) {
      setErro('Informe uma quantidade maior que zero.');
      return;
    }
    setSalvando(true);
    try {
      await onSalvar(form);
    } catch {
      setErro('Não foi possível registrar a movimentação.');
    } finally {
      setSalvando(false);
    }
  };

  const input = 'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-text-primary text-sm font-sans outline-none focus:border-primary';
  const label = 'text-text-secondary text-xs font-sans block mb-1';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-primary text-lg font-bold font-sans">Nova movimentação</h2>
          <button type="button" onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        {erro && <p className="text-danger text-sm font-sans mb-3">{erro}</p>}

        <div className="mb-3">
          <label className={label}>Produto</label>
          <select
            className={input}
            value={form.produto ?? ''}
            onChange={(e) => campo('produto', e.target.value ? Number(e.target.value) : null)}
            required
          >
            <option value="">Selecione um produto</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>{p.sku} — {p.nome}</option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className={label}>Tipo de movimentação</label>
          <select
            className={input}
            value={form.tipo}
            onChange={(e) => campo('tipo', e.target.value as TipoMovimentacao)}
          >
            {(Object.keys(tipoInfo) as TipoMovimentacao[]).map((tipo) => (
              <option key={tipo} value={tipo}>{tipoInfo[tipo].label}</option>
            ))}
          </select>
          <p className="text-text-secondary text-xs font-sans mt-1">{tipoInfo[form.tipo].descricao}</p>
        </div>

        <div className="mb-3">
          <label className={label}>Quantidade</label>
          <input
            className={input}
            value={quantidadeExibida}
            onChange={handleQuantidadeChange}
            inputMode="numeric"
            placeholder="0"
            required
          />
        </div>

        <div className="mb-3">
          <label className={label}>Motivo</label>
          <input
            className={input}
            value={form.motivo}
            onChange={(e) => campo('motivo', e.target.value)}
            placeholder="Ex: Compra do fornecedor, Perda, Balanço..."
          />
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
            {salvando ? 'Salvando...' : 'Registrar'}
          </button>
        </div>
      </form>
    </div>
  );
}