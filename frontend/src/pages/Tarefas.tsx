import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, X, Trash2, Clock, Search } from 'lucide-react';
import type { Tarefa, Status, Eu, Opcao, Item, Comentario } from '../services/tarefasApi';
import * as api from '../services/tarefasApi';
import { mensagemErro as msg } from '../services/http';
import SelectCampo from '../components/SelectCampo';
import ConfirmModal from '../components/ConfirmModal';

const COLUNAS: { id: Status; nome: string; cor: string }[] = [
  { id: 'A_FAZER', nome: 'A fazer', cor: 'bg-accent-blue' },
  { id: 'EM_ANDAMENTO', nome: 'Em andamento', cor: 'bg-amber-400' },
  { id: 'EM_REVISAO', nome: 'Em revisão', cor: 'bg-primary' },
  { id: 'CONCLUIDA', nome: 'Concluída', cor: 'bg-secondary' },
];
const PRIORIDADES = ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'];
const ROTULO_PRIO: Record<string, string> = { BAIXA: 'Baixa', MEDIA: 'Média', ALTA: 'Alta', URGENTE: 'Urgente' };
const COR_PRIO: Record<string, string> = {
  BAIXA: 'bg-white/10 text-text-secondary',
  MEDIA: 'bg-accent-blue/20 text-accent-blue',
  ALTA: 'bg-amber-400/20 text-amber-300',
  URGENTE: 'bg-danger/20 text-danger',
};

const campo =
  'w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-text-primary text-sm font-sans outline-none focus:border-primary [color-scheme:dark]';
const botaoPrincipal =
  'flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-sans text-sm font-semibold hover:opacity-90 transition';
const botaoSecundario =
  'px-4 py-2 rounded-xl text-text-secondary font-sans text-sm font-semibold hover:bg-white/5 transition';
const fundoModal = { background: '#141a4a' };

type Aba = 'TODAS' | 'TAREFA' | 'SOLICITACAO' | 'MINHAS';
const ABAS: [Aba, string][] = [
  ['TODAS', 'Todas'],
  ['TAREFA', 'Tarefas'],
  ['SOLICITACAO', 'Solicitações'],
  ['MINHAS', 'Minhas'],
];


function Rotulo({ texto, children }: { texto: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-text-secondary text-sm font-sans">{texto}</span>
      {children}
    </label>
  );
}

function dataCurta(d?: string | null) {
  return d ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : '';
}

export default function Tarefas() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [projetos, setProjetos] = useState<Opcao[]>([]);
  const [setores, setSetores] = useState<Opcao[]>([]);
  const [usuarios, setUsuarios] = useState<Opcao[]>([]);
  const [eu, setEu] = useState<Eu | null>(null);
  const [aba, setAba] = useState<Aba>('TODAS');
  const [projetoId, setProjetoId] = useState('');
  const [setorId, setSetorId] = useState('');
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState<Tarefa | 'nova' | null>(null);
  const [erro, setErro] = useState('');
  const [arrastando, setArrastando] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    try {
      const [t, p, s, u, e] = await Promise.all([
        api.listarTarefas(),
        api.listarProjetos(),
        api.listarSetores(),
        api.listarUsuarios(),
        api.obterEu(),
      ]);
      setTarefas(t);
      setProjetos(p);
      setSetores(s);
      setUsuarios(u);
      setEu(e);
      setErro('');
    } catch (e) {
      setErro(msg(e));
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const nomeUsuario = (id: number | null) => usuarios.find((u) => u.id === id)?.nome ?? '';
  const nomeSetor = (id: number | null) => setores.find((s) => s.id === id)?.nome ?? '';
  const hoje = new Date().toISOString().slice(0, 10);

  const visiveis = useMemo(
    () =>
      tarefas.filter((t) => {
        if (aba === 'TAREFA' && t.tipo !== 'TAREFA') return false;
        if (aba === 'SOLICITACAO' && t.tipo !== 'SOLICITACAO') return false;
        if (aba === 'MINHAS' && t.responsavel !== eu?.id) return false;
        if (projetoId && String(t.projeto) !== projetoId) return false;
        if (setorId && String(t.setor_destino) !== setorId) return false;
        if (busca && !t.titulo.toLowerCase().includes(busca.toLowerCase())) return false;
        return true;
      }),
    [tarefas, aba, projetoId, setorId, busca, eu]
  );

  async function soltar(status: Status) {
    if (arrastando === null) return;
    const t = tarefas.find((x) => x.id === arrastando);
    setArrastando(null);
    if (!t || t.status === status) return;
    const ordem = tarefas.filter((x) => x.status === status).length;
    setTarefas((prev) => prev.map((x) => (x.id === t.id ? { ...x, status } : x)));
    try {
      await api.moverTarefa(t.id, status, ordem);
      await carregar();
    } catch (e) {
      await carregar();
      setErro(msg(e));
    }
  }

  return (
    <div className="app-bg min-h-screen p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-text-primary text-2xl font-bold font-sans">Tarefas</h1>
        <button onClick={() => setModal('nova')} className={botaoPrincipal}>
          <Plus size={16} />
          Nova tarefa
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {ABAS.map(([id, nome]) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className={`px-4 py-2 rounded-xl text-sm font-sans font-semibold transition ${
              aba === id ? 'bg-primary text-white' : 'text-text-secondary hover:bg-white/5'
            }`}
          >
            {nome}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative max-w-sm flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-text-primary text-sm font-sans outline-none focus:border-primary"
          />
        </div>
        <SelectCampo className="w-48" value={projetoId} onChange={(e) => setProjetoId(e.target.value)}>
          <option value="">Todos os projetos</option>{projetos.map((o) => (<option key={o.id} value={o.id}>{o.nome}</option>))}
        </SelectCampo>
        <SelectCampo className="w-48" value={setorId} onChange={(e) => setSetorId(e.target.value)}>
          <option value="">Todos os setores</option>{setores.map((o) => (<option key={o.id} value={o.id}>{o.nome}</option>))}
        </SelectCampo>
      </div>

      {erro && <p className="text-danger text-sm font-sans mb-4">{erro}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUNAS.map((col) => {
          const cards = visiveis
            .filter((t) => t.status === col.id)
            .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
          return (
            <div
              key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => soltar(col.id)}
              className="glass-card rounded-2xl p-3 min-h-[300px] space-y-3"
            >
              <div className="flex items-center gap-2 text-text-primary text-sm font-sans font-semibold">
                <span className={`h-2 w-2 rounded-full ${col.cor}`} />
                {col.nome}
                <span className="ml-auto text-xs font-normal text-text-secondary">{cards.length}</span>
              </div>
              {cards.map((t) => {
                const atrasada = !!t.prazo && t.prazo.slice(0, 10) < hoje && t.status !== 'CONCLUIDA';
                return (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={() => setArrastando(t.id)}
                    onDragEnd={() => setArrastando(null)}
                    onClick={() => setModal(t)}
                    className="cursor-pointer space-y-2 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition"
                  >
                    <div className="text-text-primary text-sm font-sans font-medium">{t.titulo}</div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`px-2 py-1 rounded-full text-xs ${COR_PRIO[t.prioridade] ?? COR_PRIO.MEDIA}`}>
                        {ROTULO_PRIO[t.prioridade] ?? t.prioridade}
                      </span>
                      {t.tipo === 'SOLICITACAO' && (
                        <span className="px-2 py-1 rounded-full text-xs bg-primary/30 text-white">
                          Solicitação{t.setor_destino ? ` → ${nomeSetor(t.setor_destino)}` : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs font-sans text-text-secondary">
                      <span>{nomeUsuario(t.responsavel) || 'Sem responsável'}</span>
                      {t.prazo && (
                        <span className={`flex items-center gap-1 ${atrasada ? 'text-danger' : ''}`}>
                          <Clock size={12} /> {dataCurta(t.prazo)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {modal && (
        <TarefaModal
          tarefa={modal === 'nova' ? null : modal}
          eu={eu}
          projetos={projetos}
          setores={setores}
          usuarios={usuarios}
          onClose={() => setModal(null)}
          onSalvo={() => {
            setModal(null);
            carregar();
          }}
        />
      )}
    </div>
  );
}

function TarefaModal(props: {
  tarefa: Tarefa | null;
  eu: Eu | null;
  projetos: Opcao[];
  setores: Opcao[];
  usuarios: Opcao[];
  onClose: () => void;
  onSalvo: () => void;
}) {
  const { tarefa, eu, projetos, setores, usuarios, onClose, onSalvo } = props;
  const [titulo, setTitulo] = useState(tarefa?.titulo ?? '');
  const [descricao, setDescricao] = useState(tarefa?.descricao ?? '');
  const [tipo, setTipo] = useState<string>(tarefa?.tipo ?? 'TAREFA');
  const [prioridade, setPrioridade] = useState(tarefa?.prioridade ?? 'MEDIA');
  const [projeto, setProjeto] = useState(tarefa?.projeto ? String(tarefa.projeto) : '');
  const [responsavel, setResponsavel] = useState(tarefa?.responsavel ? String(tarefa.responsavel) : '');
  const [setor, setSetor] = useState(tarefa?.setor_destino ? String(tarefa.setor_destino) : '');
  const [prazo, setPrazo] = useState(tarefa?.prazo?.slice(0, 10) ?? '');
  const [erro, setErro] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  async function salvar() {
    if (!titulo.trim()) return setErro('Informe o título.');
    if (tipo === 'SOLICITACAO' && !setor && !responsavel)
      return setErro('Solicitação precisa de um setor de destino ou de um responsável.');
    const dados = {
      titulo: titulo.trim(),
      descricao,
      tipo,
      prioridade,
      projeto: projeto ? Number(projeto) : null,
      responsavel: responsavel ? Number(responsavel) : null,
      setor_destino: tipo === 'SOLICITACAO' && setor ? Number(setor) : null,
      prazo: prazo || null,
    };
    try {
      await api.salvarTarefa(tarefa?.id ?? null, dados);
      onSalvo();
    } catch (e) {
      setErro(msg(e));
    }
  }

  async function excluir() {
    if (!tarefa) return;
    setExcluindo(true);
    try {
      await api.excluirTarefa(tarefa.id);
      onSalvo();
    } catch (e) {
      setErro(msg(e));
      setConfirmando(false);
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        style={fundoModal}
        className="glass-card max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-text-primary text-xl font-bold font-sans">
            {tarefa ? 'Editar tarefa' : 'Nova tarefa'}
          </h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition">
            <X size={20} />
          </button>
        </div>

        <div className={`grid gap-6 ${tarefa ? 'md:grid-cols-2' : ''}`}>
          <div className="space-y-3">
            <Rotulo texto="Título">
              <input className={campo} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            </Rotulo>
            <Rotulo texto="Descrição">
              <textarea className={campo} rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </Rotulo>
            <div className="grid grid-cols-2 gap-3">
              <Rotulo texto="Tipo">
                <SelectCampo className="w-full" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  <option value="TAREFA">Tarefa</option>
                  <option value="SOLICITACAO">Solicitação para outro setor</option>
                </SelectCampo>
              </Rotulo>
              <Rotulo texto="Prioridade">
                <SelectCampo className="w-full" value={prioridade} onChange={(e) => setPrioridade(e.target.value)}>
                  {PRIORIDADES.map((p) => (
                    <option key={p} value={p}>
                      {ROTULO_PRIO[p]}
                    </option>
                  ))}
                </SelectCampo>
              </Rotulo>
            </div>
            {tipo === 'SOLICITACAO' && (
              <Rotulo texto="Setor de destino">
                <SelectCampo className="w-full" value={setor} onChange={(e) => setSetor(e.target.value)}>
                  <option value="">Escolha o setor</option>{setores.map((o) => (<option key={o.id} value={o.id}>{o.nome}</option>))}
                </SelectCampo>
              </Rotulo>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Rotulo texto="Responsável">
                <SelectCampo className="w-full" value={responsavel} onChange={(e) => setResponsavel(e.target.value)}>
                  <option value="">Ninguém</option>{usuarios.map((o) => (<option key={o.id} value={o.id}>{o.nome}</option>))}
                </SelectCampo>
              </Rotulo>
              <Rotulo texto="Projeto">
                <SelectCampo className="w-full" value={projeto} onChange={(e) => setProjeto(e.target.value)}>
                  <option value="">Sem projeto</option>{projetos.map((o) => (<option key={o.id} value={o.id}>{o.nome}</option>))}
                </SelectCampo>
              </Rotulo>
            </div>
            <Rotulo texto="Prazo">
              <input type="date" className={campo} value={prazo} onChange={(e) => setPrazo(e.target.value)} />
            </Rotulo>

            {erro && <p className="text-danger text-sm font-sans">{erro}</p>}

            <div className="flex items-center gap-2 pt-2">
              <button onClick={salvar} className={botaoPrincipal}>
                Salvar
              </button>
              <button onClick={onClose} className={botaoSecundario}>
                Cancelar
              </button>
              {tarefa && (
                <button
                  onClick={() => setConfirmando(true)}
                  className="ml-auto flex items-center gap-1 text-sm font-sans text-text-secondary hover:text-danger transition"
                >
                  <Trash2 size={16} /> Excluir
                </button>
              )}
            </div>
          </div>

          {tarefa && (
            <div className="space-y-6">
              <Checklist tarefaId={tarefa.id} />
              <Comentarios tarefaId={tarefa.id} eu={eu} />
            </div>
          )}
        </div>
      </div>

      {confirmando && tarefa && (
        <ConfirmModal
          titulo="Excluir tarefa"
          mensagem={`Tem certeza que deseja excluir "${tarefa.titulo}"? Esta ação não pode ser desfeita.`}
          confirmando={excluindo}
          onConfirmar={excluir}
          onCancelar={() => setConfirmando(false)}
        />
      )}
    </div>
  );
}

function Checklist({ tarefaId }: { tarefaId: number }) {
  const [itens, setItens] = useState<Item[]>([]);
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    try {
      setItens(await api.listarChecklist(tarefaId));
    } catch (e) {
      setErro(msg(e));
    }
  }, [tarefaId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function agir(fn: () => Promise<unknown>) {
    try {
      await fn();
      setErro('');
      await carregar();
    } catch (e) {
      setErro(msg(e));
    }
  }

  const feitos = itens.filter((i) => i.concluido).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-text-primary text-sm font-sans font-semibold">
        Checklist
        <span className="text-xs font-normal text-text-secondary">
          {feitos}/{itens.length}
        </span>
      </div>
      {itens.map((i) => (
        <div key={i.id} className="flex items-center gap-2 text-sm font-sans text-text-primary">
          <input type="checkbox" checked={i.concluido} onChange={() => agir(() => api.marcarItem(i.id, !i.concluido))} />
          <span className={i.concluido ? 'text-text-secondary line-through' : ''}>{i.texto}</span>
          <button onClick={() => agir(() => api.excluirItem(i.id))} className="ml-auto text-text-secondary hover:text-danger transition">
            <X size={14} />
          </button>
        </div>
      ))}
      <input
        className={campo}
        placeholder="Novo item (aperte Enter)"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && texto.trim()) {
            agir(() => api.criarItem(tarefaId, texto.trim()));
            setTexto('');
          }
        }}
      />
      {erro && <p className="text-danger text-xs font-sans">{erro}</p>}
    </div>
  );
}

function Comentarios({ tarefaId, eu }: { tarefaId: number; eu: Eu | null }) {
  const [lista, setLista] = useState<Comentario[]>([]);
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    try {
      setLista(await api.listarComentarios(tarefaId));
    } catch (e) {
      setErro(msg(e));
    }
  }, [tarefaId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function enviar() {
    if (!texto.trim()) return;
    try {
      await api.criarComentario(tarefaId, texto.trim());
      setTexto('');
      setErro('');
      await carregar();
    } catch (e) {
      setErro(msg(e));
    }
  }

  async function apagar(id: number) {
    try {
      await api.excluirComentario(id);
      await carregar();
    } catch (e) {
      setErro(msg(e));
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-text-primary text-sm font-sans font-semibold">Comentários</div>
      <div className="max-h-48 space-y-2 overflow-y-auto">
        {lista.map((c) => {
          const autorId = c.autor ?? c.usuario;
          const meu = autorId === undefined || autorId === eu?.id;
          return (
            <div key={c.id} className="rounded-xl border border-white/10 bg-white/5 p-2 text-sm font-sans">
              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span>
                  {c.autor_nome ?? 'Usuário'}
                  {c.criado_em
                    ? ` · ${new Date(c.criado_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`
                    : ''}
                </span>
                {meu && (
                  <button onClick={() => apagar(c.id)} className="hover:text-danger transition">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              <div className="whitespace-pre-wrap text-text-primary">{c.texto}</div>
            </div>
          );
        })}
      </div>
      <textarea
        className={campo}
        rows={2}
        placeholder="Escreva um comentário"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      <button onClick={enviar} className={botaoPrincipal}>
        Comentar
      </button>
      {erro && <p className="text-danger text-xs font-sans">{erro}</p>}
    </div>
  );
}