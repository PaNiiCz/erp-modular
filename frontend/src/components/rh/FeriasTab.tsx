import CrudTab from './CrudTab';
import type { Coluna } from './CrudTab';
import FeriasFormModal from './FeriasFormModal';
import Selo from './Selo';
import { formatarData, statusFerias } from './utilidades';
import { feriasApi, mensagemErro } from '../../services/rh';
import type { Ferias } from '../../types/rh';

const carregar = (busca: string, status: string) =>
  feriasApi.listar({ search: busca, status: status || undefined });

const colunas: Coluna<Ferias>[] = [
  { titulo: 'Funcionário', render: (f) => <span className="text-text-primary">{f.funcionario_nome}</span> },
  { titulo: 'Período', render: (f) => `${formatarData(f.data_inicio)} a ${formatarData(f.data_fim)}` },
  { titulo: 'Dias', render: (f) => f.dias },
  { titulo: 'Status', render: (f) => <Selo texto={statusFerias[f.status].label} cor={statusFerias[f.status].cor} /> },
];

const opcoesStatus = Object.entries(statusFerias).map(([valor, info]) => ({ valor, label: info.label }));

const botao = 'px-2 py-1 rounded-lg text-xs font-sans transition hover:bg-white/5';

const mudar = async (
  id: number,
  acao: 'aprovar' | 'rejeitar' | 'cancelar',
  recarregar: () => void,
  setErro: (mensagem: string) => void
) => {
  try {
    await feriasApi.mudarStatus(id, acao);
    recarregar();
  } catch (e) {
    setErro(mensagemErro(e));
  }
};

export default function FeriasTab() {
  return (
    <CrudTab
      rotuloNovo="Nova solicitação"
      placeholderBusca="Buscar por funcionário..."
      carregar={carregar}
      colunas={colunas}
      excluir={(f) => feriasApi.excluir(f.id)}
      nomeItem={(f) => `${f.funcionario_nome} (${formatarData(f.data_inicio)})`}
      Modal={FeriasFormModal}
      filtro={{ placeholderTodos: 'Todos os status', opcoes: opcoesStatus }}
      acoes={(f, { recarregar, setErro }) => (
        <>
          {f.status === 'SOLICITADA' && (
            <>
              <button className={`${botao} text-secondary`} onClick={() => mudar(f.id, 'aprovar', recarregar, setErro)}>
                Aprovar
              </button>
              <button className={`${botao} text-danger`} onClick={() => mudar(f.id, 'rejeitar', recarregar, setErro)}>
                Rejeitar
              </button>
            </>
          )}
          {(f.status === 'SOLICITADA' || f.status === 'APROVADA') && (
            <button className={`${botao} text-text-secondary`} onClick={() => mudar(f.id, 'cancelar', recarregar, setErro)}>
              Cancelar
            </button>
          )}
        </>
      )}
    />
  );
}