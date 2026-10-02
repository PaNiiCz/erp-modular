import CrudTab from './CrudTab';
import type { Coluna } from './CrudTab';
import CargoFormModal from './CargoFormModal';
import Selo from './Selo';
import { formatarMoeda } from './utilidades';
import { cargosApi } from '../../services/rh';
import type { Cargo } from '../../types/rh';

const carregar = (busca: string) => cargosApi.listar({ search: busca });

const colunas: Coluna<Cargo>[] = [
  { titulo: 'Cargo', render: (c) => <span className="text-text-primary">{c.nome}</span> },
  { titulo: 'Departamento', render: (c) => c.departamento_nome ?? 'Geral' },
  { titulo: 'Salário base', render: (c) => formatarMoeda(c.salario_base) },
  { titulo: 'Status', render: (c) => <Selo texto={c.ativo ? 'Ativo' : 'Inativo'} cor={c.ativo ? 'verde' : 'cinza'} /> },
];

export default function CargosTab() {
  return (
    <CrudTab
      rotuloNovo="Novo cargo"
      placeholderBusca="Buscar cargo..."
      carregar={carregar}
      colunas={colunas}
      excluir={(c) => cargosApi.excluir(c.id)}
      nomeItem={(c) => c.nome}
      Modal={CargoFormModal}
    />
  );
}