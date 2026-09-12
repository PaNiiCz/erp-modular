import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { listarProdutos, criarProduto, atualizarProduto, excluirProduto } from '../services/produtos';
import type { Produto, ProdutoForm } from '../types/produto';
import ProdutoFormModal from '../components/produtos/ProdutoFormModal';
import ConfirmModal from '../components/ConfirmModal';

const statusCor: Record<string, string> = {
  ATIVO: 'bg-secondary/20 text-secondary',
  INATIVO: 'bg-warning/20 text-warning',
  DESCONTINUADO: 'bg-danger/20 text-danger',
};

const statusLabel: Record<string, string> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  DESCONTINUADO: 'Descontinuado',
};

export default function Produtos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [produtoExcluindo, setProdutoExcluindo] = useState<Produto | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState('');

  const carregar = async () => {
    setCarregando(true);
    const dados = await listarProdutos(busca);
    setProdutos(dados.results);
    setCarregando(false);
  };

  useEffect(() => {
    const timeout = setTimeout(carregar, 300);
    return () => clearTimeout(timeout);
  }, [busca]);

  const abrirNovo = () => {
    setProdutoEditando(null);
    setModalAberto(true);
  };

  const abrirEdicao = (produto: Produto) => {
    setProdutoEditando(produto);
    setModalAberto(true);
  };

  const handleSalvar = async (dados: ProdutoForm) => {
    if (produtoEditando) {
      await atualizarProduto(produtoEditando.id, dados);
    } else {
      await criarProduto(dados);
    }
    setModalAberto(false);
    carregar();
  };

  const confirmarExclusao = async () => {
    if (!produtoExcluindo) return;
    setExcluindo(true);
    setErroExclusao('');
    try {
      await excluirProduto(produtoExcluindo.id);
      setProdutoExcluindo(null);
      carregar();
    } catch (err) {
      console.error('Erro ao excluir produto:', err);
      setErroExclusao('Não foi possível excluir. Verifique se o produto não está vinculado a vendas, compras ou estoque.');
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div className="app-bg min-h-screen p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-text-primary text-2xl font-bold font-sans">Produtos</h1>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-sans text-sm font-semibold hover:opacity-90 transition"
        >
          <Plus size={16} />
          Novo produto
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, SKU..."
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-text-primary text-sm font-sans outline-none focus:border-primary"
        />
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="text-text-secondary text-left border-b border-white/10">
              <th className="px-5 py-3 font-medium">SKU</th>
              <th className="px-5 py-3 font-medium">Nome</th>
              <th className="px-5 py-3 font-medium">Preço de venda</th>
              <th className="px-5 py-3 font-medium">Unidade</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-text-secondary">Carregando...</td>
              </tr>
            ) : produtos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-text-secondary">Nenhum produto encontrado.</td>
              </tr>
            ) : (
              produtos.map((produto) => (
                <tr key={produto.id} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="px-5 py-3 text-text-secondary">{produto.sku}</td>
                  <td className="px-5 py-3 text-text-primary">{produto.nome}</td>
                  <td className="px-5 py-3 text-text-secondary">R$ {produto.preco_venda}</td>
                  <td className="px-5 py-3 text-text-secondary">{produto.unidade}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${statusCor[produto.status]}`}>
                      {statusLabel[produto.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => abrirEdicao(produto)} className="text-text-secondary hover:text-accent-blue transition">
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setErroExclusao('');
                          setProdutoExcluindo(produto);
                        }}
                        className="text-text-secondary hover:text-danger transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <ProdutoFormModal
          produto={produtoEditando}
          onClose={() => setModalAberto(false)}
          onSalvar={handleSalvar}
        />
      )}

      {produtoExcluindo && (
        <ConfirmModal
          titulo="Excluir produto"
          mensagem={`Tem certeza que deseja excluir "${produtoExcluindo.nome}"? Esta ação não pode ser desfeita.${erroExclusao ? '\n\n' + erroExclusao : ''}`}
          confirmando={excluindo}
          onConfirmar={confirmarExclusao}
          onCancelar={() => {
            setProdutoExcluindo(null);
            setErroExclusao('');
          }}
        />
      )}
    </div>
  );
}