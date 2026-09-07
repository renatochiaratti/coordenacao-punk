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
  Desenvolvimento,
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
  "Desenvolvimento",
  "Combinados",
  "Contrato",
] as const;

const STATUS_LABEL: Record<string, string> = {
  planejado: "Planejado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  nao_iniciado: "Não iniciado",
  em_dia: "Em dia",
  pendente: "Pendente",
  quebrado: "Quebrado",
};

const DESENV_CICLO: Record<string, Desenvolvimento["status"]> = {
  nao_iniciado: "em_andamento",
  em_andamento: "concluido",
  concluido: "nao_iniciado",
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
  desenvolvimento,
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
  desenvolvimento: Desenvolvimento[];
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
  const [listaDesenvolvimento, setListaDesenvolvimento] = useState(desenvolvimento);
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

      if (editandoNpsId) {
        const { error } = await supabase.from("nps_pesquisas").update(payload).eq("id", editandoNpsId);
        if (error) {
          alert("Não foi possível salvar a pesquisa de NPS: " + error.message);
          return;
        }
        setListaPesquisas((p) => p.map((x) => (x.id === editandoNpsId ? { ...x, ...payload } : x)));
      } else {
        const { data, error } = await supabase.from("nps_pesquisas").insert(payload).select().single();
        if (error) {
          alert("Não foi possível salvar a pesquisa de NPS: " + error.message);
          return;
        }
        if (data) setListaPesquisas((p) => [{ ...(data as NpsPesquisa), nps_respostas: [] }, ...p]);
      }
      setShowNpsModal(false);
      setEditandoNpsId(null);
    } finally {
      setSalvandoNps(false);
    }
  }

  async function apagarNps(item: NpsPesquisa) {
    if (!confirm("Apagar esta pesquisa de NPS? Todas as respostas recebidas também serão apagadas.")) return;
    setApagandoNpsId(item.id);
    try {
      const { error } = await supabase.from("nps_pesquisas").delete().eq("id", item.id);
      if (!error) setListaPesquisas((p) => p.filter((x) => x.id !== item.id));
    } finally {
      setApagandoNpsId(null);
    }
  }

  function linkDaPesquisa(token: string) {
    const base = typeof window !== "undefined" ? window.location.origin : "https://coordenacao-punk.vercel.app";
    return `${base}/nps/${token}`;
  }

  async function copiarLink(item: NpsPesquisa) {
    try {
      await navigator.clipboard.writeText(linkDaPesquisa(item.token));
      setLinkCopiadoId(item.id);
      setTimeout(() => setLinkCopiadoId(null), 2000);
    } catch {
      alert("Não foi possível copiar o link. Copie manualmente: " + linkDaPesquisa(item.token));
    }
  }

  const [showScorecardModal, setShowScorecardModal] = useState(false);
  const [editandoScorecardId, setEditandoScorecardId] = useState<string | null>(null);
  const [scorecardCargo, setScorecardCargo] = useState("");
  const [scorecardLider, setScorecardLider] = useState("");
  const [scorecardDataFinal, setScorecardDataFinal] = useState(hoje);
  const [scorecardNotas, setScorecardNotas] = useState<Record<string, string>>({});
  const [scorecardAnotacoes, setScorecardAnotacoes] = useState("");
  const [salvandoScorecard, setSalvandoScorecard] = useState(false);
  const [apagandoScorecardId, setApagandoScorecardId] = useState<string | null>(null);

  function abrirScorecardModal() {
    setEditandoScorecardId(null);
    setScorecardCargo("Professor");
    setScorecardLider("");
    setScorecardDataFinal(hoje);
    setScorecardNotas({});
    setScorecardAnotacoes("");
    setShowScorecardModal(true);
  }

  function abrirEdicaoScorecard(item: ScorecardAvaliacao) {
    setEditandoScorecardId(item.id);
    setScorecardCargo(item.cargo || "");
    setScorecardLider(item.lider || "");
    setScorecardDataFinal(item.data_final || hoje);
    const notasStr: Record<string, string> = {};
    SCORECARD_ITENS.forEach((it) => {
      notasStr[it.id] = item.notas?.[it.id] ? String(item.notas[it.id]) : "";
    });
    setScorecardNotas(notasStr);
    setScorecardAnotacoes(item.comentario_colaborador || "");
    setShowScorecardModal(true);
  }

  async function salvarScorecard() {
    setSalvandoScorecard(true);
    try {
      const notasNum: Record<string, number> = {};
      SCORECARD_ITENS.forEach((it) => {
        const v = parseInt(scorecardNotas[it.id] || "0", 10);
        notasNum[it.id] = v >= 1 && v <= 5 ? v : 0;
      });

      const payload = {
        treinador_id: treinador.id,
        cargo: scorecardCargo || null,
        lider: scorecardLider || null,
        data_inicio: null,
        data_final: scorecardDataFinal || null,
        notas: notasNum,
        comentario_colaborador: scorecardAnotacoes || null,
        acoes_colaborador: null,
        acoes_lider: null,
      };

      if (editandoScorecardId) {
        const { error } = await supabase.from("scorecard_avaliacoes").update(payload).eq("id", editandoScorecardId);
        if (error) {
          alert("Não foi possível salvar o ScoreCard: " + error.message);
          return;
        }
        setListaScorecardAvaliacoes((p) => p.map((x) => (x.id === editandoScorecardId ? { ...x, ...payload } : x)));
      } else {
        const { data, error } = await supabase.from("scorecard_avaliacoes").insert(payload).select().single();
        if (error) {
          alert("Não foi possível salvar o ScoreCard: " + error.message);
          return;
        }
        if (data) setListaScorecardAvaliacoes((p) => [data as ScorecardAvaliacao, ...p]);
      }
      setShowScorecardModal(false);
      setEditandoScorecardId(null);
    } finally {
      setSalvandoScorecard(false);
    }
  }

  async function apagarScorecard(item: ScorecardAvaliacao) {
    if (!confirm("Apagar este ScoreCard?")) return;
    setApagandoScorecardId(item.id);
    try {
      const { error } = await supabase.from("scorecard_avaliacoes").delete().eq("id", item.id);
      if (!error) setListaScorecardAvaliacoes((p) => p.filter((x) => x.id !== item.id));
    } finally {
      setApagandoScorecardId(null);
    }
  }

  function abrirModal() {
    setFData(hoje);
    setFTexto1("");
    setFTexto2("");
    setFNumero("");
    setFData2("");
    setOocComecar("");
    setOocParar("");
    setOocContinuar("");
    setFSelect(
      aba === "Cursos" ? "x" :
      aba === "Desenvolvimento" ? "nao_iniciado" :
      aba === "Combinados" ? "em_dia" : ""
    );
    setShowModal(true);
  }

  async function salvarNovo() {
    setSalvando(true);
    try {
      if (aba === "One-on-One") {
        const linhasCpc = [
          oocComecar.trim() ? `- Começar: ${oocComecar.trim()}` : "",
          oocParar.trim() ? `- Parar: ${oocParar.trim()}` : "",
          oocContinuar.trim() ? `- Continuar: ${oocContinuar.trim()}` : "",
        ].filter(Boolean);
        const { data, error } = await supabase
          .from("one_on_ones")
          .insert({ treinador_id: treinador.id, data: fData, topicos: linhasCpc.length > 0 ? linhasCpc.join("\n") : null, observacoes: null })
          .select()
          .single();
        if (!error && data) setListaOneOnOnes((p) => [data as OneOnOne, ...p]);
      } else if (aba === "Checklist Aulas") {
        const { data, error } = await supabase
          .from("checklist_aulas")
          .insert({ treinador_id: treinador.id, data: fData, item: fTexto1 })
          .select()
          .single();
        if (!error && data) setListaChecklist((p) => [data as ChecklistItem, ...p]);
      } else if (aba === "Cursos") {
        const { data, error } = await supabase
          .from("cursos")
          .insert({ treinador_id: treinador.id, nome: fTexto1, status: fSelect, data_conclusao: fData2 || null })
          .select()
          .single();
        if (!error && data) setListaCursos((p) => [data as Curso, ...p]);
      } else if (aba === "Desenvolvimento") {
        const { data, error } = await supabase
          .from("desenvolvimento")
          .insert({ treinador_id: treinador.id, titulo: fTexto1, descricao: fTexto2 || null, status: fSelect, data_inicio: fData || null, data_fim: fData2 || null })
          .select()
          .single();
        if (!error && data) setListaDesenvolvimento((p) => [data as Desenvolvimento, ...p]);
      } else if (aba === "Combinados") {
        const { data, error } = await supabase
          .from("combinados")
          .insert({ treinador_id: treinador.id, descricao: fTexto1, data_combinado: fData, status: fSelect, data_verificacao: fData2 || null })
          .select()
          .single();
        if (!error && data) setListaCombinados((p) => [data as Combinado, ...p]);
      } else if (aba === "Contrato") {
        const { data, error } = await supabase
          .from("contratos")
          .insert({ treinador_id: treinador.id, tipo_contrato: fTexto1 || null, data_inicio: fData || null, data_renovacao: fData2 || null, observacoes: fTexto2 || null })
          .select()
          .single();
        if (!error && data) setListaContratos((p) => [data as Contrato, ...p]);
      }
      setShowModal(false);
    } finally {
      setSalvando(false);
    }
  }

  async function alternarChecklist(item: ChecklistItem) {
    const concluido = !item.concluido;
    setListaChecklist((p) => p.map((x) => (x.id === item.id ? { ...x, concluido } : x)));
    await supabase.from("checklist_aulas").update({ concluido }).eq("id", item.id);
  }

  async function alternarCurso(item: Curso) {
    const status = proximoStatusCurso(item.status);
    setListaCursos((p) => p.map((x) => (x.id === item.id ? { ...x, status } : x)));
    await supabase.from("cursos").update({ status }).eq("id", item.id);
  }

  async function atualizarDataCurso(item: Curso, novaData: string) {
    setListaCursos((p) => p.map((x) => (x.id === item.id ? { ...x, data_conclusao: novaData || null } : x)));
    await supabase.from("cursos").update({ data_conclusao: novaData || null }).eq("id", item.id);
  }

  async function alternarDesenvolvimento(item: Desenvolvimento) {
    const status = DESENV_CICLO[item.status];
    setListaDesenvolvimento((p) => p.map((x) => (x.id === item.id ? { ...x, status } : x)));
    await supabase.from("desenvolvimento").update({ status }).eq("id", item.id);
  }

  async function alternarCombinado(item: Combinado) {
    const status = COMBINADO_CICLO[item.status];
    setListaCombinados((p) => p.map((x) => (x.id === item.id ? { ...x, status } : x)));
    await supabase.from("combinados").update({ status }).eq("id", item.id);
  }

  async function atualizarCombinado(id: string, campo: "descricao" | "data_combinado" | "data_verificacao", valor: string) {
    setListaCombinados((p) => p.map((x) => (x.id === id ? { ...x, [campo]: valor || null } : x)));
    await supabase.from("combinados").update({ [campo]: valor || null }).eq("id", id);
  }

  async function apagarCombinado(item: Combinado) {
    if (!confirm("Apagar este combinado?")) return;
    const { error } = await supabase.from("combinados").delete().eq("id", item.id);
    if (!error) setListaCombinados((p) => p.filter((x) => x.id !== item.id));
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
      <p style={{ color: "#9a9a9f", fontSize: 13, marginBottom: 4 }}>{treinador.unidades?.nome}</p>
      <h1 className="font-extrabold text-2xl mb-6">{treinador.nome}</h1>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {ABAS.map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className="status-pill"
            style={{ background: aba === a ? "#ff6a00" : "#1f2024", color: aba === a ? "#0d0d0d" : "#f2f2f0" }}
          >
            {a}
          </button>
        ))}
      </div>

      {aba !== "Checklist Aulas" && aba !== "NPS" && aba !== "ScoreCard" && aba !== "Combinados" && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
          <button
            onClick={abrirModal}
            className="font-bold"
            style={{ background: "#ff6a00", color: "#0d0d0d", padding: "8px 16px", borderRadius: 8 }}
          >
            + Adicionar
          </button>
        </div>
      )}

      <div className="card" style={{ padding: 18 }}>
        {aba === "One-on-One" && (
          listaOneOnOnes.length === 0 ? (
            <p style={{ color: "#9a9a9f", textAlign: "center", padding: 20 }}>Nenhum one-on-one registrado ainda.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {listaOneOnOnes.map((o, i) => (
                <div
                  key={o.id}
                  style={{
                    paddingBottom: 18,
                    borderBottom: i < listaOneOnOnes.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div>
                      <div className="font-bold">{fmtDate(o.data)}</div>
                      {o.topicos && (
                        <div style={{ color: "#9a9a9f", fontSize: 13, marginTop: 2, whiteSpace: "pre-wrap" }}>{o.topicos}</div>
                      )}
                    </div>
                    <button
                      onClick={() => apagarOneOnOne(o)}
                      disabled={apagandoId === o.id}
                      title="Apagar"
                      style={{ color: "#ff5a5a", background: "transparent", border: "none", fontSize: 18, cursor: "pointer", padding: 4, lineHeight: 1 }}
                    >
                      🗑
                    </button>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <label style={{ display: "block", fontSize: 12, color: "#9a9a9f", marginBottom: 4 }}>Resposta</label>
                    <textarea
                      value={getResposta(o)}
                      onChange={(e) => setRespostaDrafts((p) => ({ ...p, [o.id]: e.target.value }))}
                      style={{ ...inputStyle, minHeight: 60 }}
                      placeholder="Escreva aqui a resposta / execução deste tópico..."
                    />
                    <button
                      onClick={() => salvarResposta(o)}
                      disabled={salvandoResposta === o.id}
                      className="font-bold"
                      style={{ marginTop: 6, background: "#ff6a00", color: "#0d0d0d", padding: "6px 14px", borderRadius: 8, fontSize: 13 }}
                    >
                      {salvandoResposta === o.id ? "Salvando..." : "Salvar resposta"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {aba === "Checklist Aulas" && (
          <>
            <Lista
              vazio="Nenhum item de checklist ainda."
              itens={listaChecklist.map((c) => ({
                id: c.id,
                titulo: c.item,
                corpo: fmtDate(c.data),
                status: c.concluido ? "concluido" : "pendente",
                statusLabel: c.concluido ? "Feito" : "Pendente",
                onClick: () => alternarChecklist(c),
              }))}
            />

            <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h4 className="font-extrabold">Avaliações de aula</h4>
                <button
                  onClick={abrirAvaliacaoModal}
                  className="font-bold"
                  style={{ background: "#ff6a00", color: "#0d0d0d", padding: "6px 14px", borderRadius: 8, fontSize: 13 }}
                >
                  + Nova avaliação
                </button>
              </div>

              {listaAvaliacoes.length === 0 ? (
                <p style={{ color: "#9a9a9f", textAlign: "center", padding: 14, fontSize: 13 }}>
                  Nenhuma avaliação de aula registrada ainda.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[...listaAvaliacoes]
                    .sort((a, b) => b.data.localeCompare(a.data))
                    .map((av) => {
                    const preenchidos = av.itens.filter((it) => it.texto.trim() !== "");
                    const okCount = preenchidos.filter((it) => it.ok).length;
                    const aberta = avaliacaoAbertaId === av.id;
                    return (
                      <div key={av.id} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                          <button
                            onClick={() => setAvaliacaoAbertaId(aberta ? null : av.id)}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flex: 1,
                              background: "transparent",
                              border: "none",
                              color: "#f2f2f0",
                              cursor: "pointer",
                              padding: 0,
                            }}
                          >
                            <span className="font-bold">Avaliação de aula — {fmtDate(av.data)}</span>
                            <span style={{ color: "#9a9a9f", fontSize: 13, marginRight: 10 }}>{okCount}/{preenchidos.length} ok</span>
                          </button>
                          <button
                            onClick={() => abrirEdicaoAvaliacao(av)}
                            title="Editar"
                            style={{ background: "transparent", border: "none", fontSize: 16, cursor: "pointer", padding: 4, lineHeight: 1 }}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => apagarAvaliacao(av)}
                            disabled={apagandoAvaliacaoId === av.id}
                            title="Apagar"
                            style={{ color: "#ff5a5a", background: "transparent", border: "none", fontSize: 16, cursor: "pointer", padding: 4, lineHeight: 1 }}
                          >
                            🗑
                          </button>
                        </div>
                        {aberta && (
                          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                            {preenchidos.length === 0 ? (
                              <p style={{ color: "#9a9a9f", fontSize: 13 }}>Nenhum item preenchido nessa avaliação.</p>
                            ) : (
                              preenchidos.map((it, i) => (
                                <div
                                  key={i}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    fontSize: 13,
                                    padding: "4px 0",
                                    borderBottom: i < preenchidos.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                                  }}
                                >
                                  <span>{it.texto}</span>
                                  <span className="font-extrabold" style={{ color: it.ok ? "#1fbf5c" : "#e5484d" }}>
                                    {it.ok ? "OK" : "X"}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {aba === "ScoreCard" && (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
              <button
                onClick={abrirScorecardModal}
                className="font-bold"
                style={{ background: "#ff6a00", color: "#0d0d0d", padding: "8px 16px", borderRadius: 8 }}
              >
                + Nova avaliação
              </button>
            </div>

            {listaScorecardAvaliacoes.length === 0 ? (
              <p style={{ color: "#9a9a9f", textAlign: "center", padding: 20 }}>Nenhum ScoreCard registrado ainda.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[...listaScorecardAvaliacoes]
                  .sort((a, b) => (b.data_final || "").localeCompare(a.data_final || ""))
                  .map((item) => {
                  const resultado = calcularScorecard(item);
                  return (
                    <div key={item.id} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div>
                          <div className="font-bold">{fmtDate(item.data_final || "")}</div>
                          <div style={{ color: "#9a9a9f", fontSize: 13, marginTop: 2 }}>
                            {[item.cargo, item.lider ? `Líder: ${item.lider}` : ""].filter(Boolean).join(" · ")}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => abrirEdicaoScorecard(item)}
                            title="Editar"
                            style={{ background: "transparent", border: "none", fontSize: 16, cursor: "pointer", padding: 4, lineHeight: 1 }}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => apagarScorecard(item)}
                            disabled={apagandoScorecardId === item.id}
                            title="Apagar"
                            style={{ color: "#ff5a5a", background: "transparent", border: "none", fontSize: 16, cursor: "pointer", padding: 4, lineHeight: 1 }}
                          >
                            🗑
                          </button>
                        </div>
                      </div>

                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <span className="font-bold" style={{ fontSize: 13 }}>Total geral</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span className="font-extrabold" style={{ color: "#ff6a00", fontSize: 18 }}>{resultado.percentual}%</span>
                            <span
                              className="font-extrabold"
                              style={{ background: resultado.classificacao.cor, color: "#0d0d0d", padding: "2px 8px", borderRadius: 6, fontSize: 12 }}
                            >
                              {resultado.classificacao.label}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                          {resultado.categorias.map((cat) => (
                            <div
                              key={cat.id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                fontSize: 13,
                                padding: "4px 8px",
                                borderRadius: 6,
                                background: cat.cor + "22",
                              }}
                            >
                              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: cat.cor, display: "inline-block" }} />
                                {cat.label}
                              </span>
                              <span className="font-extrabold" style={{ color: cat.cor }}>{cat.media}</span>
                            </div>
                          ))}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {resultado.itensComNota.map((it) => (
                            <div
                              key={it.id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                fontSize: 12,
                                padding: "3px 0",
                                borderBottom: "1px solid rgba(255,255,255,0.06)",
                                color: "#9a9a9f",
                              }}
                            >
                              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span
                                  style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: "50%",
                                    background: SCORECARD_CATEGORIAS[it.categoria].cor,
                                    display: "inline-block",
                                    flexShrink: 0,
                                  }}
                                />
                                {it.requisito}
                              </span>
                              <span>{it.nota > 0 ? `${it.nota} · ${SCORECARD_NOTA_LABELS[it.nota]}` : "—"}</span>
                            </div>
                          ))}
                        </div>

                        {item.comentario_colaborador && (
                          <div style={{ marginTop: 12, background: "#1a1b1f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 10 }}>
                            <span className="font-extrabold" style={{ fontSize: 12, color: "#9a9a9f" }}>MINHAS ANOTAÇÕES</span>
                            <p style={{ fontSize: 13, marginTop: 4, whiteSpace: "pre-wrap" }}>{item.comentario_colaborador}</p>
                          </div>
                        )}

                        {(() => {
                          const analise = calcularAnaliseScorecard(resultado, listaAvaliacoes);
                          if (!analise) return null;
                          return (
                            <div
                              style={{
                                marginTop: 12,
                                background: "rgba(255,106,0,0.1)",
                                border: "1px solid rgba(255,106,0,0.3)",
                                borderRadius: 8,
                                padding: 10,
                              }}
                            >
                              <span className="font-extrabold" style={{ color: "#ff6a00", fontSize: 12 }}>
                                PONTO DE MELHORA PARA A PRÓXIMA ETAPA
                              </span>
                              <p style={{ fontSize: 13, marginTop: 6 }}>
                                O ponto mais frágil dessa avaliação foi <strong>{analise.categoria.label}</strong> (média {analise.categoria.media}).
                                {analise.itensProblematicos.length > 0 ? (
                                  <>
                                    {" "}Isso é consistente com o checklist de avaliação de aula: nas avaliações registradas, esses itens relacionados apareceram marcados como pendentes com frequência —{" "}
                                    {analise.itensProblematicos.map(([texto, count], i) => (
                                      <span key={texto}>
                                        {i > 0 ? ", " : ""}"{texto}" ({count}x)
                                      </span>
                                    ))}
                                    . Vale focar nisso especificamente no próximo ciclo.
                                  </>
                                ) : analise.totalChecagens > 0 ? (
                                  <>
                                    {" "}Curiosamente, o checklist de avaliação de aula mostra o oposto: {" "}
                                    {analise.itensConsistentesOk.map(([texto, count], i) => (
                                      <span key={texto}>
                                        {i > 0 ? ", " : ""}"{texto}" apareceu OK em {count} de {analise.totalAvaliacoes} avaliações
                                      </span>
                                    ))}
                                    . Isso sugere que o problema não é falta de execução, e sim de profundidade ou consistência — vale conversar diretamente sobre isso no próximo one-on-one, já que o checklist sozinho não está capturando essa nuance.
                                  </>
                                ) : (
                                  <> Ainda não há avaliações de aula suficientes que confirmem esse padrão — vale observar de perto nas próximas aulas para confirmar se é algo recorrente.</>
                                )}
                              </p>
                              <div
                                style={{
                                  marginTop: 10,
                                  paddingTop: 10,
                                  borderTop: "1px solid rgba(255,106,0,0.25)",
                                }}
                              >
                                <span className="font-extrabold" style={{ color: "#ff6a00", fontSize: 12 }}>
                                  ATIVIDADE SUGERIDA
                                </span>
                                <p style={{ fontSize: 13, marginTop: 4 }}>
                                  {SCORECARD_SUGESTAO_ATIVIDADE[analise.categoria.id]}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {aba === "NPS" && (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
              <button
                onClick={abrirNpsModal}
                className="font-bold"
                style={{ background: "#ff6a00", color: "#0d0d0d", padding: "8px 16px", borderRadius: 8 }}
              >
                + Adicionar pesquisa
              </button>
            </div>

            {listaPesquisas.length === 0 ? (
              <p style={{ color: "#9a9a9f", textAlign: "center", padding: 20 }}>Nenhuma pesquisa de NPS registrada ainda.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[...listaPesquisas]
                  .sort((a, b) => b.data.localeCompare(a.data))
                  .map((item) => {
                  const relatorio = calcularRelatorioNps(item);

                  return (
                    <div
                      key={item.id}
                      style={{
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 8,
                        padding: 14,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div>
                          <div className="font-bold">{fmtDate(item.data)}</div>
                          <div style={{ color: "#9a9a9f", fontSize: 13, marginTop: 2 }}>
                            {relatorio ? relatorio.total : 0} resposta(s) recebida(s){item.enviados ? ` de ${item.enviados} enviadas` : ""}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => abrirEdicaoNps(item)}
                            title="Editar"
                            style={{ background: "transparent", border: "none", fontSize: 16, cursor: "pointer", padding: 4, lineHeight: 1 }}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => apagarNps(item)}
                            disabled={apagandoNpsId === item.id}
                            title="Apagar"
                            style={{ color: "#ff5a5a", background: "transparent", border: "none", fontSize: 16, cursor: "pointer", padding: 4, lineHeight: 1 }}
                          >
                            🗑
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => copiarLink(item)}
                        className="font-bold"
                        style={{
                          marginTop: 10,
                          background: "#1f2024",
                          color: "#f2f2f0",
                          border: "1px solid rgba(255,255,255,0.14)",
                          padding: "8px 12px",
                          borderRadius: 8,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        {linkCopiadoId === item.id ? "Link copiado! ✓" : "🔗 Copiar link da pesquisa"}
                      </button>

                      {!relatorio ? (
                        <p style={{ color: "#9a9a9f", fontSize: 13, marginTop: 12 }}>
                          Ainda não há respostas para esta pesquisa. Envie o link acima para os alunos.
                        </p>
                      ) : (
                        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <span className="font-bold" style={{ fontSize: 13 }}>NPS Score</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span className="font-extrabold" style={{ color: "#ff6a00", fontSize: 18 }}>{relatorio.npsScore}</span>
                              <span
                                className="font-extrabold"
                                style={{ background: relatorio.classificacao.cor, color: "#0d0d0d", padding: "2px 8px", borderRadius: 6, fontSize: 12 }}
                              >
                                {relatorio.classificacao.label}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: 10, fontSize: 12, color: "#9a9a9f", marginBottom: 14 }}>
                            <span>🟢 {relatorio.promotores} promotor(es)</span>
                            <span>🟡 {relatorio.passivos} neutro(s)</span>
                            <span>🔴 {relatorio.detratores} detrator(es)</span>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
                            {NPS_PERGUNTA_KEYS.map((key, idx) => (
                              <div
                                key={key}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  fontSize: 13,
                                  padding: "4px 0",
                                  borderBottom: idx < 5 ? "1px solid rgba(255,255,255,0.06)" : "none",
                                }}
                              >
                                <span>{item[key]}</span>
                                <span className="font-extrabold" style={{ color: "#ff6a00" }}>{relatorio.medias[idx]}</span>
                              </div>
                            ))}
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ background: "rgba(31,191,92,0.1)", border: "1px solid rgba(31,191,92,0.3)", borderRadius: 8, padding: 10 }}>
                              <span className="font-extrabold" style={{ color: "#1fbf5c", fontSize: 12 }}>PONTO FORTE</span>
                              <p style={{ fontSize: 13, marginTop: 4 }}>{relatorio.pontoForte.pergunta} (média {relatorio.pontoForte.media})</p>
                            </div>
                            <div style={{ background: "rgba(229,72,77,0.1)", border: "1px solid rgba(229,72,77,0.3)", borderRadius: 8, padding: 10 }}>
                              <span className="font-extrabold" style={{ color: "#e5484d", fontSize: 12 }}>PONTO FRACO</span>
                              <p style={{ fontSize: 13, marginTop: 4 }}>{relatorio.pontoFraco.pergunta} (média {relatorio.pontoFraco.media})</p>
                            </div>
                            <div style={{ background: "rgba(255,106,0,0.1)", border: "1px solid rgba(255,106,0,0.3)", borderRadius: 8, padding: 10 }}>
                              <span className="font-extrabold" style={{ color: "#ff6a00", fontSize: 12 }}>SUGESTÃO DE FOCO</span>
                              <p style={{ fontSize: 13, marginTop: 4 }}>
                                Priorize melhorar "{relatorio.pontoFraco.pergunta}" — é o ponto com a menor média entre os avaliados.
                              </p>
                            </div>
                          </div>

                          {relatorio.comentarios.length > 0 && (
                            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                              <span className="font-extrabold" style={{ fontSize: 12, color: "#9a9a9f" }}>
                                COMENTÁRIOS DOS ALUNOS ({relatorio.comentarios.length})
                              </span>
                              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                                {relatorio.comentarios.map((c, i) => (
                                  <div
                                    key={i}
                                    style={{
                                      background: "#1a1b1f",
                                      border: "1px solid rgba(255,255,255,0.08)",
                                      borderRadius: 8,
                                      padding: 10,
                                      fontSize: 13,
                                      fontStyle: "italic",
                                    }}
                                  >
                                    "{c}"
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {aba === "Cursos" && (
          listaCursos.length === 0 ? (
            <p style={{ color: "#9a9a9f", textAlign: "center", padding: 20 }}>Nenhum curso cadastrado ainda.</p>
          ) : (
            <div>
              {listaCursos.map((c, i) => (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 4px",
                    borderBottom: i < listaCursos.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
                    flexWrap: "wrap",
                  }}
                >
                  <div className="font-bold" style={{ flex: 1, minWidth: 140 }}>{c.nome}</div>
                  <input
                    type="date"
                    value={c.data_conclusao || ""}
                    onChange={(e) => atualizarDataCurso(c, e.target.value)}
                    style={{ ...inputStyle, width: "auto", padding: "6px 8px", fontSize: 13 }}
                  />
                  <button
                    onClick={() => alternarCurso(c)}
                    className="font-extrabold"
                    style={{
                      minWidth: 96,
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "none",
                      cursor: "pointer",
                      background: CURSO_STATUS_COR[c.status],
                      color: "#0d0d0d",
                      fontSize: 13,
                    }}
                  >
                    {CURSO_STATUS_LABEL[c.status]}
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {aba === "Desenvolvimento" && (
          <Lista
            vazio="Nenhum plano de desenvolvimento ainda."
            itens={listaDesenvolvimento.map((d) => ({
              id: d.id,
              titulo: d.titulo,
              corpo: d.descricao || "",
              status: d.status,
              statusLabel: STATUS_LABEL[d.status],
              onClick: () => alternarDesenvolvimento(d),
            }))}
          />
        )}

        {aba === "Combinados" && (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
              <button
                onClick={abrirModal}
                className="font-bold"
                style={{ background: "#ff6a00", color: "#0d0d0d", padding: "8px 16px", borderRadius: 8 }}
              >
                + Adicionar
              </button>
            </div>

            {listaCombinados.length === 0 ? (
              <p style={{ color: "#9a9a9f", textAlign: "center", padding: 20 }}>Nenhum combinado registrado ainda.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {listaCombinados.map((c) => (
                  <div key={c.id} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                      <button
                        onClick={() => alternarCombinado(c)}
                        className="font-extrabold"
                        style={{
                          flexShrink: 0,
                          padding: "5px 12px",
                          borderRadius: 8,
                          border: "none",
                          cursor: "pointer",
                          fontSize: 12,
                          background:
                            c.status === "em_dia" ? "#1fbf5c" : c.status === "pendente" ? "#f5c518" : "#e5484d",
                          color: "#0d0d0d",
                        }}
                      >
                        {STATUS_LABEL[c.status]}
                      </button>
                      <button
                        onClick={() => apagarCombinado(c)}
                        title="Apagar"
                        style={{ color: "#ff5a5a", background: "transparent", border: "none", fontSize: 16, cursor: "pointer", padding: 4, lineHeight: 1 }}
                      >
                        🗑
                      </button>
                    </div>

                    <textarea
                      defaultValue={c.descricao}
                      onBlur={(e) => atualizarCombinado(c.id, "descricao", e.target.value)}
                      style={{ ...inputStyle, minHeight: 180, marginBottom: 10, fontSize: 15, lineHeight: 1.6, padding: 14 }}
                      placeholder="Descrição do combinado"
                    />

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <label style={{ display: "block", fontSize: 11, color: "#9a9a9f", marginBottom: 4 }}>Data do combinado</label>
                        <input
                          type="date"
                          defaultValue={c.data_combinado}
                          onChange={(e) => atualizarCombinado(c.id, "data_combinado", e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <label style={{ display: "block", fontSize: 11, color: "#9a9a9f", marginBottom: 4 }}>Verificar em</label>
                        <input
                          type="date"
                          defaultValue={c.data_verificacao || ""}
                          onChange={(e) => atualizarCombinado(c.id, "data_verificacao", e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {aba === "Contrato" && (
          <Lista
            vazio="Nenhum contrato cadastrado ainda."
            itens={listaContratos.map((c) => ({
              id: c.id,
              titulo: c.tipo_contrato || "Contrato",
              corpo: [c.data_inicio ? `Início: ${fmtDate(c.data_inicio)}` : "", c.data_renovacao ? `Renovação: ${fmtDate(c.data_renovacao)}` : "", c.observacoes || ""]
                .filter(Boolean)
                .join(" · "),
            }))}
          />
        )}
      </div>

      {showModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setShowModal(false)}
        >
          <div className="card" style={{ padding: 24, width: 360, maxWidth: "100%" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="font-extrabold mb-3">Novo: {aba}</h3>

            {aba === "One-on-One" && (
              <>
                <Campo label="Data"><input type="date" value={fData} onChange={(e) => setFData(e.target.value)} style={inputStyle} /></Campo>
                <Campo label="Começar"><textarea value={oocComecar} onChange={(e) => setOocComecar(e.target.value)} style={{ ...inputStyle, minHeight: 66 }} placeholder="O que ele deve começar a fazer" /></Campo>
                <Campo label="Parar"><textarea value={oocParar} onChange={(e) => setOocParar(e.target.value)} style={{ ...inputStyle, minHeight: 66 }} placeholder="O que ele deve parar de fazer" /></Campo>
                <Campo label="Continuar"><textarea value={oocContinuar} onChange={(e) => setOocContinuar(e.target.value)} style={{ ...inputStyle, minHeight: 66 }} placeholder="O que ele deve continuar fazendo" /></Campo>
              </>
            )}

            {aba === "Checklist Aulas" && (
              <>
                <Campo label="Data"><input type="date" value={fData} onChange={(e) => setFData(e.target.value)} style={inputStyle} /></Campo>
                <Campo label="Item"><input value={fTexto1} onChange={(e) => setFTexto1(e.target.value)} style={inputStyle} placeholder="Ex: Alongamento no início da aula" /></Campo>
              </>
            )}

            {aba === "Cursos" && (
              <>
                <Campo label="Nome do curso"><input value={fTexto1} onChange={(e) => setFTexto1(e.target.value)} style={inputStyle} /></Campo>
                <Campo label="Status">
                  <select value={fSelect} onChange={(e) => setFSelect(e.target.value)} style={inputStyle}>
                    <option value="x">X</option>
                    <option value="ok">OK</option>
                    <option value="combinado">COMBINADO</option>
                  </select>
                </Campo>
                <Campo label="Data (opcional)"><input type="date" value={fData2} onChange={(e) => setFData2(e.target.value)} style={inputStyle} /></Campo>
              </>
            )}

            {aba === "Desenvolvimento" && (
              <>
                <Campo label="Título"><input value={fTexto1} onChange={(e) => setFTexto1(e.target.value)} style={inputStyle} placeholder="Ex: Plano CrossFit L1" /></Campo>
                <Campo label="Descrição"><textarea value={fTexto2} onChange={(e) => setFTexto2(e.target.value)} style={{ ...inputStyle, minHeight: 70 }} /></Campo>
                <Campo label="Status">
                  <select value={fSelect} onChange={(e) => setFSelect(e.target.value)} style={inputStyle}>
                    <option value="nao_iniciado">Não iniciado</option>
                    <option value="em_andamento">Em andamento</option>
                    <option value="concluido">Concluído</option>
                  </select>
                </Campo>
                <Campo label="Início"><input type="date" value={fData} onChange={(e) => setFData(e.target.value)} style={inputStyle} /></Campo>
                <Campo label="Fim (opcional)"><input type="date" value={fData2} onChange={(e) => setFData2(e.target.value)} style={inputStyle} /></Campo>
              </>
            )}

            {aba === "Combinados" && (
              <>
                <Campo label="Descrição"><textarea value={fTexto1} onChange={(e) => setFTexto1(e.target.value)} style={{ ...inputStyle, minHeight: 70 }} /></Campo>
                <Campo label="Data do combinado"><input type="date" value={fData} onChange={(e) => setFData(e.target.value)} style={inputStyle} /></Campo>
                <Campo label="Status">
                  <select value={fSelect} onChange={(e) => setFSelect(e.target.value)} style={inputStyle}>
                    <option value="em_dia">Em dia</option>
                    <option value="pendente">Pendente</option>
                    <option value="quebrado">Quebrado</option>
                  </select>
                </Campo>
                <Campo label="Verificar em (opcional)"><input type="date" value={fData2} onChange={(e) => setFData2(e.target.value)} style={inputStyle} /></Campo>
              </>
            )}

            {aba === "Contrato" && (
              <>
                <Campo label="Tipo de contrato"><input value={fTexto1} onChange={(e) => setFTexto1(e.target.value)} style={inputStyle} placeholder="Ex: CLT, PJ, Freelancer" /></Campo>
                <Campo label="Início"><input type="date" value={fData} onChange={(e) => setFData(e.target.value)} style={inputStyle} /></Campo>
                <Campo label="Renovação (opcional)"><input type="date" value={fData2} onChange={(e) => setFData2(e.target.value)} style={inputStyle} /></Campo>
                <Campo label="Observações"><textarea value={fTexto2} onChange={(e) => setFTexto2(e.target.value)} style={{ ...inputStyle, minHeight: 70 }} /></Campo>
              </>
            )}

            <button
              onClick={salvarNovo}
              disabled={salvando}
              className="font-bold"
              style={{ width: "100%", background: "#ff6a00", color: "#0d0d0d", padding: 10, borderRadius: 8, marginTop: 6 }}
            >
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      )}

      {showAvaliacaoModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 }}
          onClick={() => setShowAvaliacaoModal(false)}
        >
          <div
            className="card"
            style={{ padding: 24, width: 520, maxWidth: "100%", maxHeight: "85vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-extrabold" style={{ textAlign: "center" }}>
              {editandoAvaliacaoId ? "Editar avaliação de aula" : "Avaliação de aula"}
            </h3>
            <div style={{ textAlign: "center", margin: "8px 0 16px" }}>
              <input
                type="date"
                value={avaliacaoData}
                onChange={(e) => setAvaliacaoData(e.target.value)}
                style={{ ...inputStyle, width: "auto", display: "inline-block" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {avaliacaoItens.map((it, idx) => (
                <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ width: 20, fontSize: 12, color: "#9a9a9f", flexShrink: 0 }}>{idx + 1}.</span>
                  <input
                    value={it.texto}
                    onChange={(e) => atualizarTextoItemAvaliacao(idx, e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="Item da avaliação"
                  />
                  <button
                    onClick={() => alternarOkItemAvaliacao(idx)}
                    className="font-extrabold"
                    style={{
                      width: 42,
                      height: 36,
                      flexShrink: 0,
                      borderRadius: 8,
                      border: "none",
                      cursor: "pointer",
                      background: it.ok ? "#1fbf5c" : "#e5484d",
                      color: "#0d0d0d",
                    }}
                  >
                    {it.ok ? "OK" : "X"}
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={salvarAvaliacao}
              disabled={salvandoAvaliacao}
              className="font-bold"
              style={{ width: "100%", background: "#ff6a00", color: "#0d0d0d", padding: 10, borderRadius: 8, marginTop: 16 }}
            >
              {salvandoAvaliacao ? "Salvando..." : editandoAvaliacaoId ? "Salvar edição" : "Salvar avaliação"}
            </button>
          </div>
        </div>
      )}

      {showNpsModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 }}
          onClick={() => setShowNpsModal(false)}
        >
          <div
            className="card"
            style={{ padding: 24, width: 520, maxWidth: "100%", maxHeight: "85vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-extrabold" style={{ textAlign: "center" }}>
              {editandoNpsId ? "Editar pesquisa de NPS" : "Nova pesquisa de NPS"}
            </h3>
            <p style={{ color: "#9a9a9f", fontSize: 12, textAlign: "center", marginTop: 6 }}>
              As perguntas já vêm preenchidas — edite se quiser. Depois de salvar, um link será gerado para você enviar aos alunos.
            </p>

            <div style={{ display: "flex", gap: 10, margin: "16px 0" }}>
              <div style={{ flex: 1 }}>
                <Campo label="Data"><input type="date" value={npsData} onChange={(e) => setNpsData(e.target.value)} style={inputStyle} /></Campo>
              </div>
              <div style={{ flex: 1 }}>
                <Campo label="Quantos alunos vai enviar (opcional)">
                  <input
                    value={npsEnviados}
                    onChange={(e) => setNpsEnviados(e.target.value)}
                    style={inputStyle}
                    inputMode="numeric"
                    placeholder="Ex: 20"
                  />
                </Campo>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  style={{
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    padding: 12,
                    background: "#1a1b1f",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        className="font-extrabold"
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: "#ff6a00",
                          color: "#0d0d0d",
                          fontSize: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span style={{ fontSize: 12, color: "#9a9a9f" }}>Pergunta {idx + 1}</span>
                    </div>
                    <span
                      className="font-bold"
                      style={{
                        fontSize: 11,
                        color: "#ff6a00",
                        border: "1px solid rgba(255,106,0,0.4)",
                        borderRadius: 6,
                        padding: "2px 8px",
                      }}
                    >
                      Nota 0-10
                    </span>
                  </div>
                  <input
                    value={npsPerguntas[idx]}
                    onChange={(e) =>
                      setNpsPerguntas((p) => p.map((v, i) => (i === idx ? e.target.value : v)))
                    }
                    style={inputStyle}
                    placeholder={NPS_PERGUNTAS_PADRAO[idx]}
                  />
                </div>
              ))}

              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  padding: 12,
                  background: "#1a1b1f",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      className="font-extrabold"
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "#ff6a00",
                        color: "#0d0d0d",
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      7
                    </span>
                    <span style={{ fontSize: 12, color: "#9a9a9f" }}>Pergunta 7 (opcional)</span>
                  </div>
                  <span
                    className="font-bold"
                    style={{
                      fontSize: 11,
                      color: "#ff6a00",
                      border: "1px solid rgba(255,106,0,0.4)",
                      borderRadius: 6,
                      padding: "2px 8px",
                    }}
                  >
                    Texto livre
                  </span>
                </div>
                <input
                  value={npsPerguntas[6]}
                  onChange={(e) =>
                    setNpsPerguntas((p) => p.map((v, i) => (i === 6 ? e.target.value : v)))
                  }
                  style={inputStyle}
                  placeholder={NPS_PERGUNTA7_PADRAO}
                />
              </div>
            </div>

            <button
              onClick={salvarNps}
              disabled={salvandoNps}
              className="font-bold"
              style={{ width: "100%", background: "#ff6a00", color: "#0d0d0d", padding: 10, borderRadius: 8, marginTop: 16 }}
            >
              {salvandoNps ? "Salvando..." : editandoNpsId ? "Salvar edição" : "Salvar pesquisa"}
            </button>
          </div>
        </div>
      )}

      {showScorecardModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 }}
          onClick={() => setShowScorecardModal(false)}
        >
          <div
            className="card"
            style={{ padding: 24, width: 560, maxWidth: "100%", maxHeight: "85vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-extrabold" style={{ textAlign: "center" }}>
              {editandoScorecardId ? "Editar ScoreCard" : "Novo ScoreCard"}
            </h3>

            <div style={{ display: "flex", gap: 10, margin: "16px 0" }}>
              <div style={{ flex: 1 }}>
                <Campo label="Cargo"><input value={scorecardCargo} onChange={(e) => setScorecardCargo(e.target.value)} style={inputStyle} placeholder="Ex: Professor" /></Campo>
              </div>
              <div style={{ flex: 1 }}>
                <Campo label="Líder"><input value={scorecardLider} onChange={(e) => setScorecardLider(e.target.value)} style={inputStyle} placeholder="Ex: Renato / Mateus" /></Campo>
              </div>
            </div>

            <Campo label="Data"><input type="date" value={scorecardDataFinal} onChange={(e) => setScorecardDataFinal(e.target.value)} style={inputStyle} /></Campo>

            {Object.entries(SCORECARD_CATEGORIAS).map(([catId, catInfo]) => (
              <div key={catId} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: catInfo.cor, display: "inline-block" }} />
                  <span className="font-extrabold" style={{ fontSize: 13 }}>{catInfo.label}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {SCORECARD_ITENS.filter((it) => it.categoria === catId).map((it) => (
                    <div
                      key={it.id}
                      style={{
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 10,
                        padding: 10,
                        background: "#1a1b1f",
                      }}
                    >
                      <div style={{ fontSize: 13, marginBottom: 6 }}>{it.requisito} <span style={{ color: "#9a9a9f", fontSize: 11 }}>(peso {it.peso})</span></div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() => setScorecardNotas((p) => ({ ...p, [it.id]: String(n) }))}
                            title={SCORECARD_NOTA_LABELS[n]}
                            style={{
                              flex: 1,
                              padding: "8px 0",
                              borderRadius: 8,
                              border: "none",
                              cursor: "pointer",
                              fontWeight: 700,
                              background: scorecardNotas[it.id] === String(n) ? catInfo.cor : "#26272c",
                              color: scorecardNotas[it.id] === String(n) ? "#0d0d0d" : "#f2f2f0",
                            }}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <Campo label="Minhas anotações">
              <textarea value={scorecardAnotacoes} onChange={(e) => setScorecardAnotacoes(e.target.value)} style={{ ...inputStyle, minHeight: 90 }} placeholder="Observações livres sobre essa avaliação..." />
            </Campo>

            <button
              onClick={salvarScorecard}
              disabled={salvandoScorecard}
              className="font-bold"
              style={{ width: "100%", background: "#ff6a00", color: "#0d0d0d", padding: 10, borderRadius: 8, marginTop: 8 }}
            >
              {salvandoScorecard ? "Salvando..." : editandoScorecardId ? "Salvar edição" : "Salvar ScoreCard"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 10,
  background: "#1f2024",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 8,
  color: "#f2f2f0",
  colorScheme: "dark",
};

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 12, color: "#9a9a9f", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

function Lista({
  itens,
  vazio,
}: {
  itens: { id: string; titulo: string; corpo: string; status?: string; statusLabel?: string; extra?: string; onClick?: () => void }[];
  vazio: string;
}) {
  if (itens.length === 0) {
    return <p style={{ color: "#9a9a9f", textAlign: "center", padding: 20 }}>{vazio}</p>;
  }
  return (
    <div>
      {itens.map((item, i) => (
        <div
          key={item.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 4px",
            borderBottom: i < itens.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
          }}
        >
          <div>
            <div className="font-bold">{item.titulo}</div>
            {item.corpo && <div style={{ color: "#9a9a9f", fontSize: 13 }}>{item.corpo}</div>}
          </div>
          {item.statusLabel && (
            <button onClick={item.onClick} className={`status-pill ${item.status}`} style={{ cursor: item.onClick ? "pointer" : "default" }}>
              {item.statusLabel}
            </button>
          )}
          {item.extra && <span className="font-extrabold" style={{ color: "#ff6a00" }}>{item.extra}</span>}
        </div>
      ))}
    </div>
  );
}

function fmtDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
