import CrudTab from './CrudTab';
import type { Coluna } from './CrudTab';
import FuncionarioFormModal from './FuncionarioFormModal';
import Selo from './Selo';
import { formatarData, formatarMoeda, mascararCpf, statusFuncionario } from './utilidades';
import { funcionariosApi } from '../../services/rh';
import type { Funcionario } from '../../types/rh';

const carregar = (busca: string, status: string) =>
  funcionariosApi.listar({ search: busca, status: status || undefined });

const colunas: Coluna<Funcionario>[] = [
  {
    titulo: 'Nome',
    render: (f) => (
      <div>
        <p className="text-text-primary">{f.nome}</p>
        <p className="text-text-secondary text-xs">{f.email}</p>
      </div>
    ),
  },
  { titulo: 'CPF', render: (f) => mascararCpf(f.cpf) },
  {
    titulo: 'Cargo',
    render: (f) => (
      <div>
        <p>{f.cargo_nome}</p>
        <p className="text-xs">{f.departamento_nome}</p>
      </div>
    ),
  },
  { titulo: 'Salário', render: (f) => formatarMoeda(f.salario) },
  { titulo: 'Admissão', render: (f) => formatarData(f.data_admissao) },
  {
    titulo: 'Status',
    render: (f) => <Selo texto={statusFuncionario[f.status].label} cor={statusFuncionario[f.status].cor} />,
  },
];

const opcoesStatus = Object.entries(statusFuncionario).map(([valor, info]) => ({ valor, label: info.label }));

export default function FuncionariosTab() {
  return (
    <CrudTab
      rotuloNovo="Novo funcionário"
      placeholderBusca="Buscar por nome, CPF, e-mail..."
      carregar={carregar}
      colunas={colunas}
      excluir={(f) => funcionariosApi.excluir(f.id)}
      nomeItem={(f) => f.nome}
      Modal={FuncionarioFormModal}
      filtro={{ placeholderTodos: 'Todos os status', opcoes: opcoesStatus }}
    />
  );
}