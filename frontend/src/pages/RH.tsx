import { useState } from 'react';
import type { ComponentType } from 'react';
import FuncionariosTab from '../components/rh/FuncionariosTab';
import DepartamentosTab from '../components/rh/DepartamentosTab';
import CargosTab from '../components/rh/CargosTab';
import FeriasTab from '../components/rh/FeriasTab';
import EscalasTab from '../components/rh/EscalasTab';
import DocumentosTab from '../components/rh/DocumentosTab';

const abas: { id: string; label: string; Conteudo: ComponentType }[] = [
  { id: 'funcionarios', label: 'Funcionários', Conteudo: FuncionariosTab },
  { id: 'departamentos', label: 'Departamentos', Conteudo: DepartamentosTab },
  { id: 'cargos', label: 'Cargos', Conteudo: CargosTab },
  { id: 'ferias', label: 'Férias', Conteudo: FeriasTab },
  { id: 'escalas', label: 'Escalas', Conteudo: EscalasTab },
  { id: 'documentos', label: 'Documentos', Conteudo: DocumentosTab },
];

export default function RHPage() {
  const [abaAtiva, setAbaAtiva] = useState('funcionarios');
  const Conteudo = abas.find((a) => a.id === abaAtiva)?.Conteudo ?? FuncionariosTab;

  return (
    <div className="app-bg min-h-screen p-8">
      <h1 className="text-text-primary text-2xl font-bold font-sans mb-6">Recursos Humanos</h1>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {abas.map((aba) => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            className={`px-4 py-2 rounded-xl text-sm font-sans font-semibold transition ${
              abaAtiva === aba.id ? 'bg-primary text-white' : 'text-text-secondary hover:bg-white/5'
            }`}
          >
            {aba.label}
          </button>
        ))}
      </div>

      <Conteudo key={abaAtiva} />
    </div>
  );
}