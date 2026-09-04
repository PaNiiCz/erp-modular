import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { listarClientes, criarCliente, atualizarCliente, excluirCliente } from '../services/clientes';
import type { Cliente, ClienteForm } from '../types/cliente';
import ClienteFormModal from '../components/clientes/ClienteFormModal';
import ConfirmModal from '../components/ConfirmModal';

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [clienteExcluindo, setClienteExcluindo] = useState<Cliente | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState('');

  const carregar = async () => {
    setCarregando(true);
    const dados = await listarClientes(busca);
    setClientes(dados.results);
    setCarregando(false);
  };

  useEffect(() => {
    const timeout = setTimeout(carregar, 300);
    return () => clearTimeout(timeout);
  }, [busca]);

  const abrirNovo = () => {
    setClienteEditando(null);
    setModalAberto(true);
  };

  const abrirEdicao = (cliente: Cliente) => {
    setClienteEditando(cliente);
    setModalAberto(true);
  };

  const handleSalvar = async (dados: ClienteForm) => {
    if (clienteEditando) {
      await atualizarCliente(clienteEditando.id, dados);
    } else {
      await criarCliente(dados);
    }
    setModalAberto(false);
    carregar();
  };

  const confirmarExclusao = async () => {
    if (!clienteExcluindo) return;
    setExcluindo(true);
    setErroExclusao('');
    try {
      await excluirCliente(clienteExcluindo.id);
      setClienteExcluindo(null);
      carregar();
    } catch (err) {
      console.error('Erro ao excluir cliente:', err);
      setErroExclusao('Não foi possível excluir. Verifique se o cliente não está vinculado a vendas ou lançamentos financeiros.');
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div className="app-bg min-h-screen p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-text-primary text-2xl font-bold font-sans">Clientes</h1>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-sans text-sm font-semibold hover:opacity-90 transition"
        >
          <Plus size={16} />
          Novo cliente
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, CPF/CNPJ, cidade..."
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-text-primary text-sm font-sans outline-none focus:border-primary"
        />
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="text-text-secondary text-left border-b border-white/10">
              <th className="px-5 py-3 font-medium">Nome</th>
              <th className="px-5 py-3 font-medium">CPF/CNPJ</th>
              <th className="px-5 py-3 font-medium">E-mail</th>
              <th className="px-5 py-3 font-medium">Cidade</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-text-secondary">Carregando...</td>
              </tr>
            ) : clientes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-text-secondary">Nenhum cliente encontrado.</td>
              </tr>
            ) : (
              clientes.map((cliente) => (
                <tr key={cliente.id} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="px-5 py-3 text-text-primary">{cliente.nome}</td>
                  <td className="px-5 py-3 text-text-secondary">{cliente.cpf_cnpj}</td>
                  <td className="px-5 py-3 text-text-secondary">{cliente.email}</td>
                  <td className="px-5 py-3 text-text-secondary">{cliente.cidade}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${cliente.ativo ? 'bg-secondary/20 text-secondary' : 'bg-danger/20 text-danger'}`}>
                      {cliente.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => abrirEdicao(cliente)} className="text-text-secondary hover:text-accent-blue transition">
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setErroExclusao('');
                          setClienteExcluindo(cliente);
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
        <ClienteFormModal
          cliente={clienteEditando}
          onClose={() => setModalAberto(false)}
          onSalvar={handleSalvar}
        />
      )}

      {clienteExcluindo && (
        <ConfirmModal
          titulo="Excluir cliente"
          mensagem={`Tem certeza que deseja excluir "${clienteExcluindo.nome}"? Esta ação não pode ser desfeita.${erroExclusao ? '\n\n' + erroExclusao : ''}`}
          confirmando={excluindo}
          onConfirmar={confirmarExclusao}
          onCancelar={() => {
            setClienteExcluindo(null);
            setErroExclusao('');
          }}
        />
      )}
    </div>
  );
}