interface Props {
  titulo: string;
}

export default function EmConstrucao({ titulo }: Props) {
  return (
    <div className="app-bg min-h-screen p-8">
      <h1 className="text-text-primary text-2xl font-bold font-sans mb-4">{titulo}</h1>
      <div className="glass-card rounded-2xl p-8">
        <p className="text-text-secondary font-sans">Esta seção está em construção.</p>
      </div>
    </div>
  );
}