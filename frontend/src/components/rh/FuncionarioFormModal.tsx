import { useEffect, useState } from 'react';
import ModalBase, { CampoMoeda } from './ModalBase';
import SelectCampo from '../SelectCampo';
import { inputClasse, labelClasse, mascararCpf, mascararTelefone, statusFuncionario, useEnvio } from './utilidades';
import { cargosApi, departamentosApi, funcionariosApi } from '../../services/rh';
import type { Cargo, Departamento, Funcionario, StatusFuncionario } from '../../types/rh';

interface Props {
  item: Funcionario | null;
  onClose: () => void;
  onSalvo: () => void;
}

export default function FuncionarioFormModal({ item, onClose, onSalvo }: Props) {
  const [nome, setNome] = useState(item?.nome ?? '');
  const [cpf, setCpf] = useState(item ? mascararCpf(item.cpf) : '');
  const [email, setEmail] = useState(item?.email ?? '');
  const [telefone, setTelefone] = useState(item?.telefone ?? '');
  const [nascimento, setNascimento] = useState(item?.data_nascimento ?? '');
  const [admissao, setAdmissao] = useState(item?.data_admissao ?? '');
  const [demissao, setDemissao] = useState(item?.data_demissao ?? '');
  const [departamento, setDepartamento] = useState(item ? String(item.departamento) : '');
  const [cargo, setCargo] = useState(item ? String(item.cargo) : '');
  const [salario, setSalario] = useState(item?.salario ?? '');
  const [status, setStatus] = useState<StatusFuncionario>(item?.status ?? 'ATIVO');
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const { salvando, erro, setErro, enviar } = useEnvio(onSalvo);

  useEffect(() => {
    departamentosApi.listar().then(setDepartamentos).catch(() => setDepartamentos([]));
    cargosApi.listar().then(setCargos).catch(() => setCargos([]));
  }, []);

  // Só mostra os cargos do departamento escolhido (e os cargos gerais, sem departamento)
  const cargosDisponiveis = cargos.filter(
    (c) =>
      (c.ativo || String(c.id) === cargo) &&
      (!departamento || !c.departamento || String(c.departamento) === departamento)
  );

  const mudarDepartamento = (novo: string) => {
    setDepartamento(novo);
    const atual = cargos.find((c) => String(c.id) === cargo);
    if (atual?.departamento && String(atual.departamento) !== novo) setCargo('');
  };

  const salvar = () => {
    if (!nome.trim() || !cpf || !email.trim() || !admissao) {
      setErro('Preencha nome, CPF, e-mail e data de admissão.');
      return;
    }
    if (!departamento || !cargo) {
      setErro('Selecione o departamento e o cargo.');
      return;
    }
    const dados = {
      nome: nome.trim(),
      cpf,
      email: email.trim(),
      telefone,
      data_nascimento: nascimento || null,
      data_admissao: admissao,
      data_demissao: demissao || null,
      cargo: Number(cargo),
      departamento: Number(departamento),
      salario: salario || undefined,
      status,
    };
    enviar(() => (item ? funcionariosApi.atualizar(item.id, dados) : funcionariosApi.criar(dados)));
  };

  return (
    <ModalBase
      titulo={item ? 'Editar funcionário' : 'Novo funcionário'}
      onClose={onClose}
      onSubmit={salvar}
      salvando={salvando}
      erro={erro}
      largura="max-w-2xl"
    >
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelClasse}>Nome</label>
          <input className={inputClasse} value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div>
          <label className={labelClasse}>CPF</label>
          <input
            className={inputClasse}
            value={cpf}
            onChange={(e) => setCpf(mascararCpf(e.target.value))}
            placeholder="000.000.000-00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelClasse}>E-mail</label>
          <input type="email" className={inputClasse} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className={labelClasse}>Telefone</label>
          <input
            className={inputClasse}
            value={telefone}
            onChange={(e) => setTelefone(mascararTelefone(e.target.value))}
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelClasse}>Departamento</label>
          <SelectCampo className="w-full" value={departamento} onChange={(e) => mudarDepartamento(e.target.value)}>
            <option value="">Selecione...</option>
            {departamentos
              .filter((d) => d.ativo || String(d.id) === departamento)
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
          </SelectCampo>
        </div>
        <div>
          <label className={labelClasse}>Cargo</label>
          <SelectCampo className="w-full" value={cargo} onChange={(e) => setCargo(e.target.value)}>
            <option value="">Selecione...</option>
            {cargosDisponiveis.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </SelectCampo>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelClasse}>Salário</label>
          <CampoMoeda valor={salario} onChange={setSalario} />
          {!item && (
            <p className="text-text-secondary text-xs font-sans mt-1">Vazio = usa o salário base do cargo.</p>
          )}
        </div>
        <div>
          <label className={labelClasse}>Status</label>
          <SelectCampo
            className="w-full"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFuncionario)}
          >
            {(Object.keys(statusFuncionario) as StatusFuncionario[]).map((s) => (
              <option key={s} value={s}>
                {statusFuncionario[s].label}
              </option>
            ))}
          </SelectCampo>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClasse}>Nascimento</label>
          <input type="date" className={inputClasse} value={nascimento} onChange={(e) => setNascimento(e.target.value)} />
        </div>
        <div>
          <label className={labelClasse}>Admissão</label>
          <input type="date" className={inputClasse} value={admissao} onChange={(e) => setAdmissao(e.target.value)} />
        </div>
        <div>
          <label className={labelClasse}>Demissão</label>
          <input type="date" className={inputClasse} value={demissao} onChange={(e) => setDemissao(e.target.value)} />
        </div>
      </div>
    </ModalBase>
  );
}