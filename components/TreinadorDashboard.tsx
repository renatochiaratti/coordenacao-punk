"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type {
  Treinador,
  OneOnOne,
  ChecklistItem,
  AvaliacaoAula,
  AvaliacaoItem,
  ScorecardAvaliacao,
  Curso,
  Combinado,
  Contrato,
  NpsPesquisa,
  NpsResposta,
} from "@/lib/types";

const PERGUNTAS_AVALIACAO = [
  "Iniciou no horário?",
  "O briefing foi completo?",
  "Mobilizou as articulações?",
  "Subiu a frequência?",
  "Foi coerente?",
  "Organizou a turma no ensino?",
  "O ensino foi coerente?",
  "Ensinou?",
  "Observou e corrigiu?",
  "Usou posições dinâmicas e estáticas?",
  "Usou o auxiliar de forma inteligente?",
  "Fez scaling quando necessários?",
  "Preparou corretamente para WOD? (subiu frequência)",
  "Foi articulado na explicação do WOD?",
  "Os alunos ficaram no estimulo pretendido?",
  "Foi presente no WOD?",
  "Teve presença e atitude dentro do WOD?",
  "Fez cool down como combinado?",
  "Hands free?",
  "Terminou no horário?",
];

const TOTAL_ITENS_AVALIACAO = PERGUNTAS_AVALIACAO.length;

const ABAS = [
  "One-on-One",
  "Checklist Aulas",
  "ScoreCard",
  "NPS",
  "Cursos",
  "Combinados",
  "Contrato",
] as const;

const ABA_CORES: Record<(typeof ABAS)[number], string> = {
  "One-on-One": "#ff6a00",
  "Checklist Aulas": "#ff6a00",
  ScoreCard: "#ff6a00",
  NPS: "#ff6a00",
  Cursos: "#ff6a00",
  Combinados: "#ff6a00",
  Contrato: "#ff6a00",
};

const STATUS_LABEL: Record<string, string> = {
  planejado: "Planejado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  nao_iniciado: "Não iniciado",
  em_dia: "Em dia",
  pendente: "Pendente",
  quebrado: "Quebrado",
};

const COMBINADO_CICLO: Record<string, Combinado["status"]> = {
  em_dia: "pendente",
  pendente: "quebrado",
  quebrado: "em_dia",
};

const CURSO_STATUS_ORDEM: Curso["status"][] = ["x", "ok", "combinado"];
const CURSO_STATUS_LABEL: Record<Curso["status"], string> = {
  x: "X",
  ok: "OK",
  combinado: "COMBINADO",
};
const CURSO_STATUS_COR: Record<Curso["status"], string> = {
  x: "#e5484d",
  ok: "#1fbf5c",
  combinado: "#f5c518",
};
function proximoStatusCurso(atual: Curso["status"]): Curso["status"] {
  const idx = CURSO_STATUS_ORDEM.indexOf(atual);
  return CURSO_STATUS_ORDEM[(idx + 1) % CURSO_STATUS_ORDEM.length];
}

const NPS_PERGUNTA_KEYS = ["pergunta1", "pergunta2", "pergunta3", "pergunta4", "pergunta5", "pergunta6"] as const;
const NPS_NOTA_KEYS = ["nota1", "nota2", "nota3", "nota4", "nota5", "nota6"] as const;

const NPS_PERGUNTAS_PADRAO = [
  "De 0 a 10, o quanto você recomendaria a Punk CrossFit para um amigo?",
  "Como você avalia a qualidade das aulas?",
  "Como você avalia o atendimento da equipe?",
  "Como você avalia a estrutura e limpeza da academia?",
  "Como você avalia a pontualidade e organização das aulas?",
  "Como você avalia sua evolução física desde que começou?",
];

const NPS_PERGUNTA7_PADRAO = "Deixe aqui um elogio ou uma sugestão para seu professor…";

const SCORECARD_CATEGORIAS: Record<string, { label: string; cor: string }> = {
  ensino: { label: "Ensino", cor: "#f5c518" },
  observacao: { label: "Observação", cor: "#9a9a9f" },
  correcao: { label: "Correção", cor: "#4a90e2" },
  gerenciamento: { label: "Gerenciamento de Grupo", cor: "#f0954d" },
  presenca: { label: "Presença e Atitude", cor: "#1fbf5c" },
  demonstracao: { label: "Demonstração", cor: "#b19cd9" },
};

const SCORECARD_ITENS: { id: string; requisito: string; peso: number; categoria: string }[] = [
  { id: "articular", requisito: "Habilidade de articular", peso: 2, categoria: "ensino" },
  { id: "instruir", requisito: "Habilidade de instruir", peso: 2, categoria: "ensino" },
  { id: "mecanica_movimento", requisito: "Conhece mecânica do movimento", peso: 3, categoria: "ensino" },
  { id: "pontos_desempenho", requisito: "Conhece pontos de desempenho", peso: 3, categoria: "ensino" },
  { id: "mudar_instrucoes", requisito: "Habilidade de mudar instruções", peso: 2, categoria: "ensino" },
  { id: "discernimento_estatico", requisito: "Discernimento da mecânica c/i estático", peso: 2, categoria: "observacao" },
  { id: "discernimento_movimento", requisito: "Discernimento da mecânica c/i movimento", peso: 2, categoria: "observacao" },
  { id: "melhorar_mecanica", requisito: "Habilidade de melhorar a mecânica visual/verbal/tátil", peso: 2, categoria: "correcao" },
  { id: "triagem_erros", requisito: "Habilidade de fazer triagem (priorização) de erros", peso: 3, categoria: "correcao" },
  { id: "gerenciar_aula", requisito: "Habilidade de organizar e gerenciar grupo (aula)", peso: 2, categoria: "gerenciamento" },
  { id: "gerenciar_academia", requisito: "Habilidade de organizar e gerenciar grupo (academia)", peso: 2, categoria: "gerenciamento" },
  { id: "ambiente_positivo", requisito: "Habilidade de criar ambiente de aprendizado positivo", peso: 3, categoria: "presenca" },
  { id: "exemplo_visual", requisito: "Habilidade de fornecer um exemplo visual", peso: 2, categoria: "demonstracao" },
  { id: "consciencia_movimentos", requisito: "Consciência sobre a mecânica dos seus próprios movimentos", peso: 2, categoria: "demonstracao" },
];

const SCORECARD_NOTA_LABELS: Record<number, string> = {
  1: "Insuficiente",
  2: "Fraco",
  3: "Médio",
  4: "Bom",
  5: "Muito bom",
};

function classificarScorecardPercentual(percentual: number) {
  if (percentual >= 90) return { label: "Excelente", cor: "#1fbf5c" };
  if (percentual >= 75) return { label: "Muito bom", cor: "#8bd450" };
  if (percentual >= 60) return { label: "Atende", cor: "#f5c518" };
  return { label: "Abaixo do esperado", cor: "#e5484d" };
}

function calcularScorecard(avaliacao: ScorecardAvaliacao) {
  const notas = avaliacao.notas || {};
  const itensComNota = SCORECARD_ITENS.map((item) => ({
    ...item,
    nota: notas[item.id] ?? 0,
    total: item.peso * (notas[item.id] ?? 0),
  }));

  const somaTotal = itensComNota.reduce((acc, it) => acc + it.total, 0);
  const somaPeso = itensComNota.reduce((acc, it) => acc + it.peso, 0);
  const percentual = somaPeso > 0 ? Math.round((somaTotal / (somaPeso * 5)) * 1000) / 10 : 0;
  const classificacao = classificarScorecardPercentual(percentual);

  const categorias = Object.entries(SCORECARD_CATEGORIAS).map(([id, info]) => {
    const itensCat = itensComNota.filter((it) => it.categoria === id);
    const media =
      itensCat.length > 0
        ? Math.round((itensCat.reduce((acc, it) => acc + it.nota, 0) / itensCat.length) * 100) / 100
        : 0;
    return { id, label: info.label, cor: info.cor, media };
  });

  return { itensComNota, somaTotal, somaPeso, percentual, classificacao, categorias };
}

const PERGUNTA_AVALIACAO_CATEGORIA: string[] = [
  "presenca", "ensino", "ensino", "ensino", "ensino", "gerenciamento", "ensino", "ensino",
  "correcao", "demonstracao", "gerenciamento", "correcao", "ensino", "ensino", "presenca",
  "presenca", "presenca", "gerenciamento", "demonstracao", "presenca",
];

const SCORECARD_SUGESTAO_ATIVIDADE: Record<string, string> = {
  ensino:
    "Peça para ele gravar um vídeo curto (2-3 min) explicando um movimento como se fosse para um aluno completamente iniciante, e revisem juntos a clareza da explicação antes da próxima aula.",
  observacao:
    "Nas próximas 2 aulas, peça para ele focar em observar e corrigir pelo menos 1 detalhe técnico por aluno durante o WOD, anotando quem corrigiu e o que foi ajustado — depois revisem essa lista juntos.",
  correcao:
    "Sugira um exercício de \"triagem rápida\": antes do WOD, peça para ele identificar em voz alta os 2 erros mais comuns que espera ver naquela turma, e confirmar depois se acertou.",
  gerenciamento:
    "Peça para ele desenhar (no papel ou digital) o fluxo da aula antes de dar — onde cada grupo fica, como faz a transição entre estações — e testar esse plano na próxima aula.",
  presenca:
    "Combine uma meta simples: começar e terminar a aula rigorosamente no horário por 2 semanas seguidas, e registrar isso no checklist para criar o hábito.",
  demonstracao:
    "Peça para ele demonstrar o movimento principal do dia sem falar nada por 15 segundos antes de explicar — treina a comunicação visual antes da verbal.",
};

function calcularAnaliseScorecard(
  resultado: ReturnType<typeof calcularScorecard>,
  avaliacoesAula: AvaliacaoAula[]
) {
  if (resultado.somaPeso === 0) return null;

  let pior = resultado.categorias[0];
  resultado.categorias.forEach((c) => {
    if (c.media < pior.media) pior = c;
  });

  const indicesRelacionados = PERGUNTA_AVALIACAO_CATEGORIA
    .map((cat, idx) => (cat === pior.id ? idx : -1))
    .filter((idx) => idx !== -1);

  const ocorrenciasFalhas: Record<string, number> = {};
  const ocorrenciasOk: Record<string, number> = {};
  let totalChecagens = 0;

  avaliacoesAula.forEach((av) => {
    indicesRelacionados.forEach((idx) => {
      const item = av.itens[idx];
      if (item && item.texto.trim() !== "") {
        totalChecagens++;
        if (!item.ok) {
          ocorrenciasFalhas[item.texto] = (ocorrenciasFalhas[item.texto] || 0) + 1;
        } else {
          ocorrenciasOk[item.texto] = (ocorrenciasOk[item.texto] || 0) + 1;
        }
      }
    });
  });

  const itensProblematicos = Object.entries(ocorrenciasFalhas)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const itensConsistentesOk = Object.entries(ocorrenciasOk)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return {
    categoria: pior,
    itensProblematicos,
    itensConsistentesOk,
    totalChecagens,
    totalAvaliacoes: avaliacoesAula.length,
  };
}

function classificarNpsScore(score: number) {
  if (score > 75) return { label: "Excelente", cor: "#1fbf5c" };
  if (score >= 50) return { label: "Muito bom", cor: "#8bd450" };
  if (score >= 0) return { label: "Bom", cor: "#f5c518" };
  return { label: "Precisa melhorar", cor: "#e5484d" };
}

function calcularRelatorioNps(pesquisa: NpsPesquisa & { nps_respostas: NpsResposta[] }) {
  const respostas = pesquisa.nps_respostas || [];
  if (respostas.length === 0) return null;

  const medias = NPS_NOTA_KEYS.map((key) => {
    const soma = respostas.reduce((acc, r) => acc + (r[key] ?? 0), 0);
    return Math.round((soma / respostas.length) * 100) / 100;
  });

  const mediasPorAluno = respostas.map(
    (r) => (r.nota1 + r.nota2 + r.nota3 + r.nota4 + r.nota5 + r.nota6) / 6
  );
  const promotores = mediasPorAluno.filter((m) => m >= 9).length;
  const detratores = mediasPorAluno.filter((m) => m <= 6).length;
  const total = mediasPorAluno.length;
  const npsScore = Math.round(((promotores - detratores) / total) * 100);
  const classificacao = classificarNpsScore(npsScore);

  let maxIdx = 0;
  let minIdx = 0;
  medias.forEach((m, i) => {
    if (m > medias[maxIdx]) maxIdx = i;
    if (m < medias[minIdx]) minIdx = i;
  });

  const pontoForte = { pergunta: pesquisa[NPS_PERGUNTA_KEYS[maxIdx]], media: medias[maxIdx] };
  const pontoFraco = { pergunta: pesquisa[NPS_PERGUNTA_KEYS[minIdx]], media: medias[minIdx] };

  const comentarios = respostas
    .map((r) => r.resposta7)
    .filter((c): c is string => !!c && c.trim() !== "");

  return {
    total,
    promotores,
    passivos: total - promotores - detratores,
    detratores,
    npsScore,
    classificacao,
    medias,
    pontoForte,
    pontoFraco,
    comentarios,
  };
}

export default function TreinadorDashboard({
  treinador,
  oneOnOnes,
  checklist,
  avaliacoesAula,
  cursos,
  combinados,
  contratos,
  npsPesquisas,
  scorecardAvaliacoes,
}: {
  treinador: Treinador;
  oneOnOnes: OneOnOne[];
  checklist: ChecklistItem[];
  avaliacoesAula: AvaliacaoAula[];
  scorecardAvaliacoes: ScorecardAvaliacao[];
  cursos: Curso[];
  combinados: Combinado[];
  contratos: Contrato[];
  npsPesquisas: (NpsPesquisa & { nps_respostas: NpsResposta[] })[];
}) {
  const [aba, setAba] = useState<(typeof ABAS)[number]>("One-on-One");
  const [showModal, setShowModal] = useState(false);

  const [listaOneOnOnes, setListaOneOnOnes] = useState(oneOnOnes);
  const [listaChecklist, setListaChecklist] = useState(checklist);
  const [listaAvaliacoes, setListaAvaliacoes] = useState(avaliacoesAula);
  const [listaScorecardAvaliacoes, setListaScorecardAvaliacoes] = useState(scorecardAvaliacoes);
  const [listaCursos, setListaCursos] = useState(cursos);
  const [listaCombinados, setListaCombinados] = useState(combinados);
  const [listaContratos, setListaContratos] = useState(contratos);
  const [listaPesquisas, setListaPesquisas] = useState(npsPesquisas);
  const [linkCopiadoId, setLinkCopiadoId] = useState<string | null>(null);

  const hoje = new Date().toISOString().slice(0, 10);

  const [fData, setFData] = useState(hoje);
  const [fTexto1, setFTexto1] = useState("");
  const [fTexto2, setFTexto2] = useState("");
  const [fNumero, setFNumero] = useState("");
  const [fSelect, setFSelect] = useState("");
  const [fData2, setFData2] = useState("");
  const [oocComecar, setOocComecar] = useState("");
  const [oocParar, setOocParar] = useState("");
  const [oocContinuar, setOocContinuar] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [respostaDrafts, setRespostaDrafts] = useState<Record<string, string>>({});
  const [salvandoResposta, setSalvandoResposta] = useState<string | null>(null);
  const [apagandoId, setApagandoId] = useState<string | null>(null);

  function getResposta(item: OneOnOne) {
    return respostaDrafts[item.id] !== undefined ? respostaDrafts[item.id] : item.observacoes || "";
  }

  async function salvarResposta(item: OneOnOne) {
    const texto = getResposta(item);
    setSalvandoResposta(item.id);
    try {
      const { error } = await supabase.from("one_on_ones").update({ observacoes: texto || null }).eq("id", item.id);
      if (error) {
        alert("Não foi possível salvar a resposta: " + error.message);
        return;
      }
      setListaOneOnOnes((p) => p.map((x) => (x.id === item.id ? { ...x, observacoes: texto || null } : x)));
    } finally {
      setSalvandoResposta(null);
    }
  }

  async function apagarOneOnOne(item: OneOnOne) {
    if (!confirm("Apagar este one-on-one?")) return;
    setApagandoId(item.id);
    try {
      const { error } = await supabase.from("one_on_ones").delete().eq("id", item.id);
      if (!error) {
        setListaOneOnOnes((p) => p.filter((x) => x.id !== item.id));
        setRespostaDrafts((p) => {
          const { [item.id]: _omit, ...rest } = p;
          return rest;
        });
      }
    } finally {
      setApagandoId(null);
    }
  }

  const [showAvaliacaoModal, setShowAvaliacaoModal] = useState(false);
  const [avaliacaoData, setAvaliacaoData] = useState(hoje);
  const [avaliacaoItens, setAvaliacaoItens] = useState<AvaliacaoItem[]>(
    PERGUNTAS_AVALIACAO.map((texto) => ({ texto, ok: false }))
  );
  const [salvandoAvaliacao, setSalvandoAvaliacao] = useState(false);
  const [avaliacaoAbertaId, setAvaliacaoAbertaId] = useState<string | null>(null);
  const [oneOnOneAbertoId, setOneOnOneAbertoId] = useState<string | null>(null);
  const [editandoAvaliacaoId, setEditandoAvaliacaoId] = useState<string | null>(null);
  const [apagandoAvaliacaoId, setApagandoAvaliacaoId] = useState<string | null>(null);

  function abrirAvaliacaoModal() {
    setEditandoAvaliacaoId(null);
    setAvaliacaoData(hoje);
    setAvaliacaoItens(PERGUNTAS_AVALIACAO.map((texto) => ({ texto, ok: false })));
    setShowAvaliacaoModal(true);
  }

  function abrirEdicaoAvaliacao(av: AvaliacaoAula) {
    setEditandoAvaliacaoId(av.id);
    setAvaliacaoData(av.data);
    const itensPreenchidos = av.itens.length === TOTAL_ITENS_AVALIACAO ? [...av.itens] : PERGUNTAS_AVALIACAO.map((texto) => ({ texto, ok: false }));
    setAvaliacaoItens(itensPreenchidos);
    setShowAvaliacaoModal(true);
  }

  function atualizarTextoItemAvaliacao(idx: number, texto: string) {
    setAvaliacaoItens((p) => p.map((it, i) => (i === idx ? { ...it, texto } : it)));
  }

  function alternarOkItemAvaliacao(idx: number) {
    setAvaliacaoItens((p) => p.map((it, i) => (i === idx ? { ...it, ok: !it.ok } : it)));
  }

  async function salvarAvaliacao() {
    setSalvandoAvaliacao(true);
    try {
      if (editandoAvaliacaoId) {
        const { error } = await supabase
          .from("avaliacoes_aula")
          .update({ data: avaliacaoData, itens: avaliacaoItens })
          .eq("id", editandoAvaliacaoId);
        if (!error) {
          setListaAvaliacoes((p) =>
            p.map((x) => (x.id === editandoAvaliacaoId ? { ...x, data: avaliacaoData, itens: avaliacaoItens } : x))
          );
        }
      } else {
        const { data, error } = await supabase
          .from("avaliacoes_aula")
          .insert({ treinador_id: treinador.id, data: avaliacaoData, itens: avaliacaoItens })
          .select()
          .single();
        if (!error && data) setListaAvaliacoes((p) => [data as AvaliacaoAula, ...p]);
      }
      setShowAvaliacaoModal(false);
      setEditandoAvaliacaoId(null);
    } finally {
      setSalvandoAvaliacao(false);
    }
  }

  async function apagarAvaliacao(av: AvaliacaoAula) {
    if (!confirm("Apagar esta avaliação de aula?")) return;
    setApagandoAvaliacaoId(av.id);
    try {
      const { error } = await supabase.from("avaliacoes_aula").delete().eq("id", av.id);
      if (!error) {
        setListaAvaliacoes((p) => p.filter((x) => x.id !== av.id));
        if (avaliacaoAbertaId === av.id) setAvaliacaoAbertaId(null);
      }
    } finally {
      setApagandoAvaliacaoId(null);
    }
  }

  const [showNpsModal, setShowNpsModal] = useState(false);
  const [editandoNpsId, setEditandoNpsId] = useState<string | null>(null);
  const [npsData, setNpsData] = useState(hoje);
  const [npsEnviados, setNpsEnviados] = useState("");
  const [npsPerguntas, setNpsPerguntas] = useState<string[]>(["", "", "", "", "", "", ""]);
  const [salvandoNps, setSalvandoNps] = useState(false);
  const [apagandoNpsId, setApagandoNpsId] = useState<string | null>(null);

  function abrirNpsModal() {
    setEditandoNpsId(null);
    setNpsData(hoje);
    setNpsEnviados("");
    setNpsPerguntas(["", "", "", "", "", "", ""]);
    setShowNpsModal(true);
  }

  function abrirEdicaoNps(item: NpsPesquisa) {
    setEditandoNpsId(item.id);
    setNpsData(item.data);
    setNpsEnviados(item.enviados !== null ? String(item.enviados) : "");
    setNpsPerguntas([...NPS_PERGUNTA_KEYS.map((k) => item[k] || ""), item.pergunta7 || ""]);
    setShowNpsModal(true);
  }

  async function salvarNps() {
    setSalvandoNps(true);
    try {
      const payload = {
        treinador_id: treinador.id,
        data: npsData,
        enviados: npsEnviados.trim() === "" ? null : parseInt(npsEnviados, 10) || 0,
        pergunta1: npsPerguntas[0].trim() || NPS_PERGUNTAS_PADRAO[0],
        pergunta2: npsPerguntas[1].trim() || NPS_PERGUNTAS_PADRAO[1],
        pergunta3: npsPerguntas[2].trim() || NPS_PERGUNTAS_PADRAO[2],
        pergunta4: npsPerguntas[3].trim() || NPS_PERGUNTAS_PADRAO[3],
        pergunta5: npsPerguntas[4].trim() || NPS_PERGUNTAS_PADRAO[4],
        pergunta6: npsPerguntas[5].trim() || NPS_PERGUNTAS_PADRAO[5],
        pergunta7: npsPerguntas[6].trim() || NPS_PERGUNTA7_PADRAO,
      };
