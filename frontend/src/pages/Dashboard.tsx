import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import CardResumo from '../components/dashboard/CardResumo';
import GraficoVendas from '../components/dashboard/GraficoVendas';
import ProdutosMaisVendidos from '../components/dashboard/ProdutosMaisVendidos';
import AtividadesRecentes from '../components/dashboard/AtividadesRecentes';
import { getResumo, getProdutosMaisVendidos, getGraficoVendas, getAtividadesRecentes } from '../services/dashboard';
import type { ResumoDashboard, ProdutoMaisVendido, VendaPorDia, AtividadeRecente } from '../types/dashboard';
import ProximosEventos from '../components/ProximosEventos';

function CardResumoSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-5 animate-pulse min-h-[82px] flex flex-col justify-center">
      <div className="h-3 w-16 bg-white/10 rounded mb-2" />
      <div className="h-6 w-24 bg-white/20 rounded" />
    </div>
  );
}

export default function Dashboard() {
  const [resumo, setResumo] = useState<ResumoDashboard | null>(null);
  const [produtos, setProdutos] = useState<ProdutoMaisVendido[]>([]);
  const [grafico, setGrafico] = useState<VendaPorDia[]>([]);
  const [atividades, setAtividades] = useState<AtividadeRecente[]>([]);
  const [carregandoResumo, setCarregandoResumo] = useState(true);

  useEffect(() => {
    let ativo = true;
    const falha = (erro: unknown) => console.error('Erro ao carregar o dashboard:', erro);

    getResumo()
      .then((dados) => {
        if (ativo) setResumo(dados);
      })
      .catch(falha)
      .finally(() => {
        if (ativo) setCarregandoResumo(false);
      });

    getProdutosMaisVendidos()
      .then((dados) => {
        if (ativo) setProdutos(dados);
      })
      .catch(falha);

    getGraficoVendas(14)
      .then((dados) => {
        if (ativo) setGrafico(dados);
      })
      .catch(falha);

    getAtividadesRecentes()
      .then((dados) => {
        if (ativo) setAtividades(dados);
      })
      .catch(falha);

    return () => {
      ativo = false;
    };
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  };

  return (
    <div className="app-bg min-h-screen p-8">
      <h1 className="text-text-primary text-2xl font-bold font-sans mb-6">Dashboard</h1>

      {resumo ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6"
          initial="initial"
          animate="animate"
          transition={{ staggerChildren: 0.05 }}
        >
          <motion.div variants={fadeIn}><CardResumo titulo="Faturamento" valor={`R$ ${resumo.faturamento_mes}`} /></motion.div>
          <motion.div variants={fadeIn}><CardResumo titulo="Lucro" valor={`R$ ${resumo.lucro_mes}`} destaque={parseFloat(resumo.lucro_mes) >= 0 ? 'positivo' : 'negativo'} /></motion.div>
          <motion.div variants={fadeIn}><CardResumo titulo="Vendas do mês" valor={`${resumo.total_vendas_mes}`} /></motion.div>
          <motion.div variants={fadeIn}><CardResumo titulo="A pagar" valor={`R$ ${resumo.contas_a_pagar}`} destaque="negativo" /></motion.div>
          <motion.div variants={fadeIn}><CardResumo titulo="A receber" valor={`R$ ${resumo.contas_a_receber}`} destaque="positivo" /></motion.div>
          <motion.div variants={fadeIn}><CardResumo titulo="Clientes ativos" valor={`${resumo.clientes_ativos}`} /></motion.div>
        </motion.div>
      ) : carregandoResumo ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <CardResumoSkeleton />
          <CardResumoSkeleton />
          <CardResumoSkeleton />
          <CardResumoSkeleton />
          <CardResumoSkeleton />
          <CardResumoSkeleton />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <GraficoVendas dados={grafico} />
        </div>
        <ProdutosMaisVendidos produtos={produtos} />
      </div>

      <div className="mt-4">
        <AtividadesRecentes atividades={atividades} />
      </div>
      <div className="px-6 pb-6">
        <ProximosEventos />
      </div>
    </div>
  );
}