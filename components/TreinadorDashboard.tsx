"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type {
  Treinador,
  OneOnOne,
  ChecklistItem,
  AvaliacaoAula,
  AvaliacaoItem,
  Scorecard,
  Curso,
  Desenvolvimento,
  Escala,
  Combinado,
  Contrato,
} from "@/lib/types";

const TOTAL_ITENS_AVALIACAO = 25;

const DIA_LABEL: Record<string, string> = {
  segunda: "Seg", terca: "Ter", quarta: "Qua", quinta: "Qui", sexta: "Sex", sabado: "Sáb", domingo: "Dom",
};
const DIAS = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"] as const;

const ABAS = [
  "One-on-One",
  "Checklist Aulas",
  "ScoreCard",
  "Cursos",
  "Desenvolvimento",
  "Escala",
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

const CURSO_CICLO: Record<string, Curso["status"]> = {
  planejado: "em_andamento",
  em_andamento: "concluido",
  concluido: "planejado",
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

export default function TreinadorDashboard({
  treinador,
  oneOnOnes,
  checklist,
  avaliacoesAula,
  scorecards,
  cursos,
  desenvolvimento,
  escalas,
  combinados,
  contratos,
}: {
  treinador: Treinador;
  oneOnOnes: OneOnOne[];
  checklist: ChecklistItem[];
  avaliacoesAula: AvaliacaoAula[];
  scorecards: Scorecard[];
  cursos: Curso[];
  desenvolvimento: Desenvolvimento[];
  escalas: Escala[];
  combinados: Combinado[];
  contratos: Contrato[];
}) {
  const [aba, setAba] = useState<(typeof ABAS)[number]>("One-on-One");
  const [showModal, setShowModal] = useState(false);

  const [listaOneOnOnes, setListaOneOnOnes] = useState(oneOnOnes);
  const [listaChecklist, setListaChecklist] = useState(checklist);
  const [listaAvaliacoes, setListaAvaliacoes] = useState(avaliacoesAula);
  const [listaScorecards, setListaScorecards] = useState(scorecards);
  const [listaCursos, setListaCursos] = useState(cursos);
  const [listaDesenvolvimento, setListaDesenvolvimento] = useState(desenvolvimento);
  const [listaEscalas, setListaEscalas] = useState(escalas);
  const [listaCombinados, setListaCombinados] = useState(combinados);
  const [listaContratos, setListaContratos] = useState(contratos);

  const hoje = new Date().toISOString().slice(0, 10);

  // ---- formulários (estado por aba) ----
  const [fData, setFData] = useState(hoje);
  const [fTexto1, setFTexto1] = useState("");
  const [fTexto2, setFTexto2] = useState("");
  const [fNumero, setFNumero] = useState("");
  const [fSelect, setFSelect] = useState("");
  const [fData2, setFData2] = useState("");
  const [fHorario, setFHorario] = useState("06:00");
  const [salvando, setSalvando] = useState(false);

  // ---- One-on-One: respostas por tópico + exclusão ----
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
      if (!error) {
        setListaOneOnOnes((p) => p.map((x) => (x.id === item.id ? { ...x, observacoes: texto || null } : x)));
      }
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

  // ---- Avaliação de aula (tabela de 25 itens) ----
  const [showAvaliacaoModal, setShowAvaliacaoModal] = useState(false);
  const [avaliacaoData, setAvaliacaoData] = useState(hoje);
  const [avaliacaoItens, setAvaliacaoItens] = useState<AvaliacaoItem[]>(
    Array.from({ length: TOTAL_ITENS_AVALIACAO }, () => ({ texto: "", ok: false }))
  );
  const [salvandoAvaliacao, setSalvandoAvaliacao] = useState(false);
  const [avaliacaoAbertaId, setAvaliacaoAbertaId] = useState<string | null>(null);

  function abrirAvaliacaoModal() {
    setAvaliacaoData(hoje);
    setAvaliacaoItens(Array.from({ length: TOTAL_ITENS_AVALIACAO }, () => ({ texto: "", ok: false })));
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
      const { data, error } = await supabase
        .from("avaliacoes_aula")
        .insert({ treinador_id: treinador.id, data: avaliacaoData, itens: avaliacaoItens })
        .select()
        .single();
      if (!error && data) setListaAvaliacoes((p) => [data as AvaliacaoAula, ...p]);
      setShowAvaliacaoModal(false);
    } finally {
      setSalvandoAvaliacao(false);
    }
  }

  function abrirModal() {
    setFData(hoje);
    setFTexto1("");
    setFTexto2("");
    setFNumero("");
    setFData2("");
    setFHorario("06:00");
    setFSelect(
      aba === "Cursos" ? "planejado" :
      aba === "Desenvolvimento" ? "nao_iniciado" :
      aba === "Combinados" ? "em_dia" :
      aba === "Escala" ? "segunda" : ""
    );
    setShowModal(true);
  }

  async function salvarNovo() {
    setSalvando(true);
    try {
      if (aba === "One-on-One") {
        const { data, error } = await supabase
          .from("one_on_ones")
          .insert({ treinador_id: treinador.id, data: fData, topicos: fTexto1 || null, observacoes: fTexto2 || null })
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
      } else if (aba === "ScoreCard") {
        const { data, error } = await supabase
          .from("scorecards")
          .insert({ treinador_id: treinador.id, data: fData, competencia: fTexto1, nota: parseFloat(fNumero.replace(",", ".")) || 0 })
          .select()
          .single();
        if (!error && data) setListaScorecards((p) => [data as Scorecard, ...p]);
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
      } else if (aba === "Escala") {
        const { data, error } = await supabase
          .from("escalas")
          .insert({ treinador_id: treinador.id, dia_semana: fSelect, horario: fHorario, turma: fTexto1 || null })
          .select()
          .single();
        if (!error && data) setListaEscalas((p) => [...p, data as Escala]);
      } else if (aba === "Combinados") {
        const { data, error } = await supabase
          .from("combinados")
          .insert({ treinador_id: treinador.id, descricao: fTexto1, data_combinado: fData, status: fSelect })
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
    const status = CURSO_CICLO[item.status];
    setListaCursos((p) => p.map((x) => (x.id === item.id ? { ...x, status } : x)));
    await supabase.from("cursos").update({ status }).eq("id", item.id);
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

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <button
          onClick={abrirModal}
          className="font-bold"
          style={{ background: "#ff6a00", color: "#0d0d0d", padding: "8px 16px", borderRadius: 8 }}
        >
          + Adicionar
        </button>
      </div>

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
                  {listaAvaliacoes.map((av) => {
                    const preenchidos = av.itens.filter((it) => it.texto.trim() !== "");
                    const okCount = preenchidos.filter((it) => it.ok).length;
                    const aberta = avaliacaoAbertaId === av.id;
                    return (
                      <div key={av.id} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 12 }}>
                        <button
                          onClick={() => setAvaliacaoAbertaId(aberta ? null : av.id)}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            width: "100%",
                            background: "transparent",
                            border: "none",
                            color: "#f2f2f0",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          <span className="font-bold">Avaliação de aula — {fmtDate(av.data)}</span>
                          <span style={{ color: "#9a9a9f", fontSize: 13 }}>{okCount}/{preenchidos.length} ok</span>
                        </button>
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
          <Lista
            vazio="Nenhuma avaliação registrada ainda."
            itens={listaScorecards.map((s) => ({ id: s.id, titulo: s.competencia, corpo: fmtDate(s.data), extra: s.nota.toFixed(1) }))}
          />
        )}

        {aba === "Cursos" && (
          <Lista
            vazio="Nenhum curso cadastrado ainda."
            itens={listaCursos.map((c) => ({
              id: c.id,
              titulo: c.nome,
              corpo: c.data_conclusao ? fmtDate(c.data_conclusao) : "",
              status: c.status,
              statusLabel: STATUS_LABEL[c.status],
              onClick: () => alternarCurso(c),
            }))}
          />
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

        {aba === "Escala" && (
          <Lista
            vazio="Nenhum horário cadastrado ainda."
            itens={[...listaEscalas]
              .sort((a, b) => DIAS.indexOf(a.dia_semana) - DIAS.indexOf(b.dia_semana) || a.horario.localeCompare(b.horario))
              .map((e) => ({ id: e.id, titulo: `${DIA_LABEL[e.dia_semana]} · ${e.horario.slice(0, 5)}`, corpo: e.turma || "" }))}
          />
        )}

        {aba === "Combinados" && (
          <Lista
            vazio="Nenhum combinado registrado ainda."
            itens={listaCombinados.map((c) => ({
              id: c.id,
              titulo: c.descricao,
              corpo: fmtDate(c.data_combinado),
              status: c.status,
              statusLabel: STATUS_LABEL[c.status],
              onClick: () => alternarCombinado(c),
            }))}
          />
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
                <Campo label="Tópico"><textarea value={fTexto1} onChange={(e) => setFTexto1(e.target.value)} style={{ ...inputStyle, minHeight: 70 }} placeholder="O que você quer tratar nesse one-on-one" /></Campo>
              </>
            )}

            {aba === "Checklist Aulas" && (
              <>
                <Campo label="Data"><input type="date" value={fData} onChange={(e) => setFData(e.target.value)} style={inputStyle} /></Campo>
                <Campo label="Item"><input value={fTexto1} onChange={(e) => setFTexto1(e.target.value)} style={inputStyle} placeholder="Ex: Alongamento no início da aula" /></Campo>
              </>
            )}

            {aba === "ScoreCard" && (
              <>
                <Campo label="Data"><input type="date" value={fData} onChange={(e) => setFData(e.target.value)} style={inputStyle} /></Campo>
                <Campo label="Competência"><input value={fTexto1} onChange={(e) => setFTexto1(e.target.value)} style={inputStyle} placeholder="Ex: Didática" /></Campo>
                <Campo label="Nota"><input value={fNumero} onChange={(e) => setFNumero(e.target.value)} style={inputStyle} placeholder="Ex: 8.5" inputMode="decimal" /></Campo>
              </>
            )}

            {aba === "Cursos" && (
              <>
                <Campo label="Nome do curso"><input value={fTexto1} onChange={(e) => setFTexto1(e.target.value)} style={inputStyle} /></Campo>
                <Campo label="Status">
                  <select value={fSelect} onChange={(e) => setFSelect(e.target.value)} style={inputStyle}>
                    <option value="planejado">Planejado</option>
                    <option value="em_andamento">Em andamento</option>
                    <option value="concluido">Concluído</option>
                  </select>
                </Campo>
                <Campo label="Data de conclusão (opcional)"><input type="date" value={fData2} onChange={(e) => setFData2(e.target.value)} style={inputStyle} /></Campo>
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

            {aba === "Escala" && (
              <>
                <Campo label="Dia da semana">
                  <select value={fSelect} onChange={(e) => setFSelect(e.target.value)} style={inputStyle}>
                    {DIAS.map((d) => (
                      <option key={d} value={d}>{DIA_LABEL[d]}</option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Horário"><input type="time" value={fHorario} onChange={(e) => setFHorario(e.target.value)} style={inputStyle} /></Campo>
                <Campo label="Turma (opcional)"><input value={fTexto1} onChange={(e) => setFTexto1(e.target.value)} style={inputStyle} placeholder="Ex: CrossFit 06h" /></Campo>
              </>
            )}

            {aba === "Combinados" && (
              <>
                <Campo label="Descrição"><textarea value={fTexto1} onChange={(e) => setFTexto1(e.target.value)} style={{ ...inputStyle, minHeight: 70 }} /></Campo>
                <Campo label="Data"><input type="date" value={fData} onChange={(e) => setFData(e.target.value)} style={inputStyle} /></Campo>
                <Campo label="Status">
                  <select value={fSelect} onChange={(e) => setFSelect(e.target.value)} style={inputStyle}>
                    <option value="em_dia">Em dia</option>
                    <option value="pendente">Pendente</option>
                    <option value="quebrado">Quebrado</option>
                  </select>
                </Campo>
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
            <h3 className="font-extrabold" style={{ textAlign: "center" }}>Avaliação de aula</h3>
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
              {salvandoAvaliacao ? "Salvando..." : "Salvar avaliação"}
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
