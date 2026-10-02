import CrudTab from './CrudTab';
import type { Coluna } from './CrudTab';
import DepartamentoFormModal from './DepartamentoFormModal';
import Selo from './Selo';
import { departamentosApi } from '../../services/rh';
import type { Departamento } from '../../types/rh';

const carregar = (busca: string) => departamentosApi.listar({ search: busca });

const colunas: Coluna<Departamento>[] = [
  { titulo: 'Nome', render: (d) => <span className="text-text-primary">{d.nome}</span> },
  { titulo: 'Descrição', render: (d) => d.descricao || '—' },
  { titulo: 'Funcionários', render: (d) => d.total_funcionarios },
  { titulo: 'Status', render: (d) => <Selo texto={d.ativo ? 'Ativo' : 'Inativo'} cor={d.ativo ? 'verde' : 'cinza'} /> },
];

export default function DepartamentosTab() {
  return (
    <CrudTab
      rotuloNovo="Novo departamento"
      placeholderBusca="Buscar departamento..."
      carregar={carregar}
      colunas={colunas}
      excluir={(d) => departamentosApi.excluir(d.id)}
      nomeItem={(d) => d.nome}
      Modal={DepartamentoFormModal}
    />
  );
}