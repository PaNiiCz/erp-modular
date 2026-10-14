import { useEffect, useState } from 'react';
import { Lock, Search, ShieldCheck, ShieldMinus, ShieldPlus, UserCheck, UserX } from 'lucide-react';
import api from '../services/api';
import { administracaoApi } from '../services/administracaoApi';
import type { AcaoUsuario, Atividade, Resumo, UsuarioAdmin } from '../services/administracaoApi';
import { mensagemErro } from '../services/rh';
import ConfirmModal from '../components/ConfirmModal';
import SelectCampo from '../components/SelectCampo';

const TAMANHO = 20;
const inputBusca =
  'w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-text-primary text-sm font-sans outline-none focus:border-primary';
const inputData =
  'px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-text-primary text-sm font-sans outline-none focus:border-primary';
const cabecalho = 'text-text-secondary text-left border-b border-white/10 text-xs uppercase tracking-wider';

const ROTULOS: Record<string, { texto: string; classe: string }> = {
  LOGIN: { texto: 'Entrada', classe: 'bg-secondary/20 text-secondary' },
  LOGIN_FALHA: { texto: 'Login recusado', classe: 'bg-danger/20 text-danger' },
  LOGOUT: { texto: 'Saída', classe: 'bg-white/10 text-text-secondary' },
  USUARIO_ATIVADO: { texto: 'Usuário ativado', classe: 'bg-secondary/20 text-secondary' },
  USUARIO_DESATIVADO: { texto: 'Usuário desativado', classe: 'bg-danger/20 text-danger' },
  ADMIN_CONCEDIDO: { texto: 'Admin concedido', classe: 'bg-amber-400/20 text-amber-300' },
  ADMIN_REMOVIDO: { texto: 'Admin removido', classe: 'bg-amber-400/20 text-amber-300' },
  VENDA_CRIADA: { texto: 'Venda criada', classe: 'bg-accent-blue/20 text-accent-blue' },
  VENDA_CONFIRMADA: { texto: 'Venda confirmada', classe: 'bg-secondary/20 text-secondary' },
  VENDA_CANCELADA: { texto: 'Venda cancelada', classe: 'bg-danger/20 text-danger' },
  VENDA_EXCLUIDA: { texto: 'Venda excluída', classe: 'bg-danger/20 text-danger' },
  COMPRA_CRIADA: { texto: 'Compra criada', classe: 'bg-accent-blue/20 text-accent-blue' },
  COMPRA_CONFIRMADA: { texto: 'Compra confirmada', classe: 'bg-secondary/20 text-secondary' },
  COMPRA_CANCELADA: { texto: 'Compra cancelada', classe: 'bg-danger/20 text-danger' },
  COMPRA_EXCLUIDA: { texto: 'Compra excluída', classe: 'bg-danger/20 text-danger' },
};

const TEXTO_ACAO: Record<
  AcaoUsuario,
  { titulo: string; verbo: string; gerundio: string; cor: 'danger' | 'sucesso'; aviso: string }
> = {
  ativar: {
    titulo: 'Ativar usuário',
    verbo: 'Ativar',
    gerundio: 'Ativando...',
    cor: 'sucesso',
    aviso: 'O usuário poderá entrar no sistema novamente.',
  },
  desativar: {
    titulo: 'Desativar usuário',
    verbo: 'Desativar',
    gerundio: 'Desativando...',
    cor: 'danger',
    aviso: 'O acesso será bloqueado e as sessões abertas serão encerradas.',
  },
  'tornar-admin': {
    titulo: 'Conceder administração',
    verbo: 'Conceder',
    gerundio: 'Concedendo...',
    cor: 'danger',
    aviso: 'O usuário terá acesso total à área de Administração.',
  },
  'remover-admin': {
    titulo: 'Remover administração',
    verbo: 'Remover',
    gerundio: 'Removendo...',
    cor: 'danger',
    aviso: 'O usuário perderá o acesso à área de Administração.',
  },
};

const formatarData = (iso: string | null) => (iso ? new Date(iso).toLocaleString('pt-BR') : 'Nunca');

function Paginacao({ pagina, total, onMudar }: { pagina: number; total: number; onMudar: (p: number) => void }) {
  const paginas = Math.max(1, Math.ceil(total / TAMANHO));
  const botao =
    'px-3 py-1.5 rounded-xl hover:bg-white/5 transition disabled:opacity-40 disabled:cursor-not-allowed';
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 text-xs font-sans text-text-secondary">
      <span>
        {total} registro(s) · Página {pagina} de {paginas}
      </span>
      <div className="flex gap-2">
        <button disabled={pagina <= 1} onClick={() => onMudar(pagina - 1)} className={botao}>
          Anterior
        </button>
        <button disabled={pagina >= paginas} onClick={() => onMudar(pagina + 1)} className={botao}>
          Próxima
        </button>
      </div>
    </div>
  );
}

function CardResumo({ rotulo, valor }: { rotulo: string; valor?: number }) {
  return (
    <div className="glass-card rounded-2xl px-5 py-4">
      <p className="text-text-secondary text-xs font-sans uppercase tracking-wider">{rotulo}</p>
      <p className="text-text-primary text-2xl font-bold font-sans mt-1">{valor ?? '—'}</p>
    </div>
  );
}

function AbaUsuarios({ onAlterado }: { onAlterado: () => void }) {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState('');
  const [fAtivo, setFAtivo] = useState('');
  const [fPerfil, setFPerfil] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [recarga, setRecarga] = useState(0);
  const [eu, setEu] = useState<number | null>(null);
  const [pendente, setPendente] = useState<{ usuario: UsuarioAdmin; acao: AcaoUsuario } | null>(null);
  const [executando, setExecutando] = useState(false);
  const [erroAcao, setErroAcao] = useState('');

  useEffect(() => {
    api
      .get<{ id: number }>('/apoio/eu/')
      .then((res) => setEu(res.data.id))
      .catch(() => setEu(null));
  }, []);

  useEffect(() => {
    let ativo = true;
    const timeout = setTimeout(async () => {
      setCarregando(true);
      setErro('');
      try {
        const dados = await administracaoApi.usuarios({
          search: busca || undefined,
          ativo: fAtivo || undefined,
          admin: fPerfil || undefined,
          page: pagina,
        });
        if (ativo) {
          setUsuarios(dados.results);
          setTotal(dados.count);
        }
      } catch (e) {
        if (ativo) setErro(mensagemErro(e, 'Não foi possível carregar os usuários.'));
      } finally {
        if (ativo) setCarregando(false);
      }
    }, 300);
    return () => {
      ativo = false;
      clearTimeout(timeout);
    };
  }, [busca, fAtivo, fPerfil, pagina, recarga]);

  const abrir = (usuario: UsuarioAdmin, acao: AcaoUsuario) => {
    setErroAcao('');
    setPendente({ usuario, acao });
  };

  const confirmar = async () => {
    if (!pendente) return;
    setExecutando(true);
    setErroAcao('');
    try {
      await administracaoApi.alterarUsuario(pendente.usuario.id, pendente.acao);
      setPendente(null);
      setRecarga((n) => n + 1);
      onAlterado();
    } catch (e) {
      setErroAcao(mensagemErro(e));
    } finally {
      setExecutando(false);
    }
  };

  const perfil = (u: UsuarioAdmin) =>
    u.is_superuser
      ? { texto: 'Superusuário', classe: 'bg-primary/20 text-primary' }
      : u.is_staff
        ? { texto: 'Administrador', classe: 'bg-accent-blue/20 text-accent-blue' }
        : { texto: 'Comum', classe: 'bg-white/10 text-text-secondary' };

  const botaoAcao = 'text-text-secondary transition';

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative w-full max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(1);
            }}
            placeholder="Buscar por nome, usuário ou e-mail..."
            className={inputBusca}
          />
        </div>
        <SelectCampo
          className="w-44"
          value={fAtivo}
          onChange={(e) => {
            setFAtivo(e.target.value);
            setPagina(1);
          }}
        >
          <option value="">Todos os status</option>
          <option value="true">Ativos</option>
          <option value="false">Inativos</option>
        </SelectCampo>
        <SelectCampo
          className="w-48"
          value={fPerfil}
          onChange={(e) => {
            setFPerfil(e.target.value);
            setPagina(1);
          }}
        >
          <option value="">Todos os perfis</option>
          <option value="true">Administradores</option>
          <option value="false">Comuns</option>
        </SelectCampo>
      </div>

      {erro && <p className="text-danger text-sm font-sans mb-3">{erro}</p>}

      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className={cabecalho}>
              <th className="px-5 py-3 font-medium">Usuário</th>
              <th className="px-5 py-3 font-medium">E-mail</th>
              <th className="px-5 py-3 font-medium">Perfil</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Último acesso</th>
              <th className="px-5 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-text-secondary">Carregando...</td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-text-secondary">Nenhum usuário encontrado.</td>
              </tr>
            ) : (
              usuarios.map((u) => {
                const p = perfil(u);
                const sou_eu = eu === u.id;
                return (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-5 py-3">
                      <p className="text-text-primary">{u.nome_completo}</p>
                      <p className="text-text-secondary text-xs">@{u.username}</p>
                    </td>
                    <td className="px-5 py-3 text-text-secondary">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${p.classe}`}>{p.texto}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          u.is_active ? 'bg-secondary/20 text-secondary' : 'bg-danger/20 text-danger'
                        }`}
                      >
                        {u.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-text-secondary">{formatarData(u.last_login)}</td>
                    <td className="px-5 py-3">
                      {sou_eu ? (
                        <p className="text-right text-text-secondary text-xs">Sua conta</p>
                      ) : (
                        <div className="flex justify-end gap-3">
                          {u.is_active ? (
                            <button
                              title="Desativar usuário"
                              onClick={() => abrir(u, 'desativar')}
                              className={`${botaoAcao} hover:text-danger`}
                            >
                              <UserX size={16} />
                            </button>
                          ) : (
                            <button
                              title="Ativar usuário"
                              onClick={() => abrir(u, 'ativar')}
                              className={`${botaoAcao} hover:text-secondary`}
                            >
                              <UserCheck size={16} />
                            </button>
                          )}
                          {!u.is_superuser &&
                            (u.is_staff ? (
                              <button
                                title="Remover administração"
                                onClick={() => abrir(u, 'remover-admin')}
                                className={`${botaoAcao} hover:text-danger`}
                              >
                                <ShieldMinus size={16} />
                              </button>
                            ) : (
                              <button
                                title="Conceder administração"
                                onClick={() => abrir(u, 'tornar-admin')}
                                className={`${botaoAcao} hover:text-accent-blue`}
                              >
                                <ShieldPlus size={16} />
                              </button>
                            ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <Paginacao pagina={pagina} total={total} onMudar={setPagina} />
      </div>

      {pendente && (
        <ConfirmModal
          titulo={TEXTO_ACAO[pendente.acao].titulo}
          mensagem={`Usuário: ${pendente.usuario.nome_completo} (@${pendente.usuario.username})\n\n${
            TEXTO_ACAO[pendente.acao].aviso
          }${erroAcao ? '\n\n' + erroAcao : ''}`}
          confirmando={executando}
          textoConfirmar={TEXTO_ACAO[pendente.acao].verbo}
          textoConfirmando={TEXTO_ACAO[pendente.acao].gerundio}
          corConfirmar={TEXTO_ACAO[pendente.acao].cor}
          onConfirmar={confirmar}
          onCancelar={() => {
            setPendente(null);
            setErroAcao('');
          }}
        />
      )}
    </>
  );
}

function AbaAtividades() {
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState('');
  const [fAcao, setFAcao] = useState('');
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    const timeout = setTimeout(async () => {
      setCarregando(true);
      setErro('');
      try {
        const dados = await administracaoApi.atividades({
          search: busca || undefined,
          acao: fAcao || undefined,
          de: de || undefined,
          ate: ate || undefined,
          page: pagina,
        });
        if (ativo) {
          setAtividades(dados.results);
          setTotal(dados.count);
        }
      } catch (e) {
        if (ativo) setErro(mensagemErro(e, 'Não foi possível carregar as atividades.'));
      } finally {
        if (ativo) setCarregando(false);
      }
    }, 300);
    return () => {
      ativo = false;
      clearTimeout(timeout);
    };
  }, [busca, fAcao, de, ate, pagina]);

  const voltar = () => setPagina(1);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative w-full max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              voltar();
            }}
            placeholder="Buscar por descrição, usuário ou alvo..."
            className={inputBusca}
          />
        </div>
        <SelectCampo
          className="w-56"
          value={fAcao}
          onChange={(e) => {
            setFAcao(e.target.value);
            voltar();
          }}
        >
          <option value="">Todas as ações</option>
          <option value="LOGIN">Entrada</option>
          <option value="LOGIN_FALHA">Login recusado</option>
          <option value="LOGOUT">Saída</option>
          <option value="USUARIO_ATIVADO">Usuário ativado</option>
          <option value="USUARIO_DESATIVADO">Usuário desativado</option>
          <option value="ADMIN_CONCEDIDO">Admin concedido</option>
          <option value="ADMIN_REMOVIDO">Admin removido</option>
          <option value="VENDA_CRIADA">Venda criada</option>
          <option value="VENDA_CONFIRMADA">Venda confirmada</option>
          <option value="VENDA_CANCELADA">Venda cancelada</option>
          <option value="VENDA_EXCLUIDA">Venda excluída</option>
          <option value="COMPRA_CRIADA">Compra criada</option>
          <option value="COMPRA_CONFIRMADA">Compra confirmada</option>
          <option value="COMPRA_CANCELADA">Compra cancelada</option>
          <option value="COMPRA_EXCLUIDA">Compra excluída</option>
        </SelectCampo>
        <input
          type="date"
          value={de}
          onChange={(e) => {
            setDe(e.target.value);
            voltar();
          }}
          className={inputData}
          title="De"
        />
        <input
          type="date"
          value={ate}
          onChange={(e) => {
            setAte(e.target.value);
            voltar();
          }}
          className={inputData}
          title="Até"
        />
      </div>

      {erro && <p className="text-danger text-sm font-sans mb-3">{erro}</p>}

      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className={cabecalho}>
              <th className="px-5 py-3 font-medium">Data e hora</th>
              <th className="px-5 py-3 font-medium">Usuário</th>
              <th className="px-5 py-3 font-medium">Ação</th>
              <th className="px-5 py-3 font-medium">Descrição</th>
              <th className="px-5 py-3 font-medium">IP</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-text-secondary">Carregando...</td>
              </tr>
            ) : atividades.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-text-secondary">Nenhuma atividade encontrada.</td>
              </tr>
            ) : (
              atividades.map((a) => {
                const rotulo = ROTULOS[a.acao] ?? { texto: a.acao, classe: 'bg-white/10 text-text-secondary' };
                return (
                  <tr key={a.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-5 py-3 text-text-secondary whitespace-nowrap">{formatarData(a.criado_em)}</td>
                    <td className="px-5 py-3 text-text-primary">{a.usuario_nome}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${rotulo.classe}`}>
                        {rotulo.texto}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-text-secondary">{a.descricao}</td>
                    <td className="px-5 py-3 text-text-secondary">{a.ip ?? '—'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <Paginacao pagina={pagina} total={total} onMudar={setPagina} />
      </div>
    </>
  );
}

export default function Administracao() {
  const [aba, setAba] = useState<'usuarios' | 'atividades'>('usuarios');
  const [resumo, setResumo] = useState<Resumo | null>(null);

  const carregarResumo = () => {
    administracaoApi
      .resumo()
      .then(setResumo)
      .catch(() => setResumo(null));
  };

  useEffect(() => {
    carregarResumo();
  }, []);

  const classeAba = (ativa: boolean) =>
    `px-4 py-2 rounded-xl text-sm font-semibold font-sans transition ${
      ativa ? 'bg-primary text-white' : 'text-text-secondary hover:bg-white/5'
    }`;

  return (
    <div className="app-bg min-h-screen p-8">
      <div className="flex items-center gap-3 mb-4">
        <ShieldCheck size={24} className="text-text-primary" />
        <h1 className="text-text-primary text-2xl font-bold font-sans">Administração</h1>
      </div>

      <div className="flex items-center gap-2 mb-6 px-4 py-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-sans">
        <Lock size={14} />
        Área restrita à administração. Todas as ações realizadas aqui são registradas.
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <CardResumo rotulo="Usuários" valor={resumo?.usuarios_total} />
        <CardResumo rotulo="Ativos" valor={resumo?.usuarios_ativos} />
        <CardResumo rotulo="Inativos" valor={resumo?.usuarios_inativos} />
        <CardResumo rotulo="Administradores" valor={resumo?.administradores} />
        <CardResumo rotulo="Atividades (24h)" valor={resumo?.atividades_24h} />
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setAba('usuarios')} className={classeAba(aba === 'usuarios')}>
          Usuários
        </button>
        <button onClick={() => setAba('atividades')} className={classeAba(aba === 'atividades')}>
          Atividades
        </button>
      </div>

      {aba === 'usuarios' ? <AbaUsuarios onAlterado={carregarResumo} /> : <AbaAtividades />}
    </div>
  );
}