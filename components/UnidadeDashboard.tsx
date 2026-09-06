"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Unidade, Treinador, EscalaHorario, CalendarioDia } from "@/lib/types";

const CORES: Record<string, string> = {
  vermelho: "#ef4444",
  azul: "#3b82f6",
  laranja: "#ff6a00",
  verde: "#22c55e",
  rosa: "#ec4899",
};
const ORDEM_CORES = ["", "vermelho", "azul", "laranja", "verde", "rosa"];

function proximaCor(atual: string) {
  const idx = ORDEM_CORES.indexOf(atual || "");
  return ORDEM_CORES[(idx + 1) % ORDEM_CORES.length];
}

type Secao = "menu" | "professores" | "diaria" | "anual";

export default function UnidadeDashboard({
  unidade,
  horarios,
  dias,
  treinadores,
}: {
  unidade: Unidade;
  horarios: EscalaHorario[];
  dias: CalendarioDia[];
  treinadores: Treinador[];
}) {
  const [secao, setSecao] = useState<Secao>("menu");
  const [listaHorarios, setListaHorarios] = useState(horarios);
  const [listaDias, setListaDias] = useState(dias);
  const [listaTreinadores, setListaTreinadores] = useState(treinadores);

  const [editando, setEditando] = useState<Treinador | null>(null);
  const [editNome, setEditNome] = useState("");
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  async function atualizarHorario(id: string, campo: "horario" | "professor1" | "professor2", valor: string) {
    setListaHorarios((prev) => prev.map((h) => (h.id === id ? { ...h, [campo]: valor } : h)));
    await supabase.from("escala_horarios").update({ [campo]: valor }).eq("id", id);
  }

  async function atualizarDia(id: string, campo: "dia" | "sabado_feriado" | "professor1" | "professor2", valor: string) {
    setListaDias((prev) => prev.map((d) => (d.id === id ? { ...d, [campo]: valor } : d)));
    await supabase.from("calendario_dias").update({ [campo]: valor }).eq("id", id);
  }

  async function alternarCorDia(item: CalendarioDia) {
    const cor = proximaCor(item.cor_dia);
    setListaDias((prev) => prev.map((x) => (x.id === item.id ? { ...x, cor_dia: cor } : x)));
    await supabase.from("calendario_dias").update({ cor_dia: cor }).eq("id", item.id);
  }

  async function alternarCorFeriado(item: CalendarioDia) {
    const cor = proximaCor(item.cor_feriado);
    setListaDias((prev) => prev.map((x) => (x.id === item.id ? { ...x, cor_feriado: cor } : x)));
    await supabase.from("calendario_dias").update({ cor_feriado: cor }).eq("id", item.id);
  }

  function abrirEdicao(t: Treinador) {
    setEditando(t);
    setEditNome(t.nome);
  }

  async function salvarEdicao() {
    if (!editando || !editNome.trim()) return;
    setSalvandoEdicao(true);
    const { error } = await supabase.from("treinadores").update({ nome: editNome.trim() }).eq("id", editando.id);
    setSalvandoEdicao(false);
    if (!error) {
      setListaTreinadores((prev) =>
        prev.map((x) => (x.id === editando.id ? { ...x, nome: editNome.trim() } : x)).sort((a, b) => a.nome.localeCompare(b.nome))
      );
      setEditando(null);
    }
  }

  async function apagarTreinador() {
    if (!editando) return;
    if (!confirm(`Apagar o perfil de ${editando.nome}? Isso não pode ser desfeito.`)) return;
    setSalvandoEdicao(true);
    const { error } = await supabase.from("treinadores").delete().eq("id", editando.id);
    setSalvandoEdicao(false);
    if (!error) {
      setListaTreinadores((prev) => prev.filter((x) => x.id !== editando.id));
      setEditando(null);
    }
  }

  const BLOCOS: { id: Secao; titulo: string; subtitulo: string; gradiente: string }[] = [
    { id: "professores", titulo: "Professores", subtitulo: `${listaTreinadores.length} ativo(s)`, gradiente: "linear-gradient(135deg, #1fbf5c, #0d5c2b)" },
    { id: "diaria", titulo: "Escala Diária", subtitulo: `${listaHorarios.length} horários`, gradiente: "linear-gradient(135deg, #ff6a00, #b34700)" },
    { id: "anual", titulo: "Escala Anual", subtitulo: `${listaDias.length} dias`, gradiente: "linear-gradient(135deg, #4a90e2, #1a3a63)" },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
      {secao === "menu" ? (
        <a href="/" style={{ color: "#9a9a9f", fontSize: 13, textDecoration: "none" }}>← Todas as unidades</a>
      ) : (
        <button
          onClick={() => setSecao("menu")}
          style={{ background: "transparent", border: "none", color: "#9a9a9f", fontSize: 13, cursor: "pointer", padding: 0 }}
        >
          ← Voltar
        </button>
      )}
      <h1 className="font-extrabold text-2xl mt-1 mb-6">{unidade.nome}</h1>

      {secao === "menu" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {BLOCOS.map((b) => (
            <button
              key={b.id}
              onClick={() => setSecao(b.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                minHeight: 140,
                borderRadius: 16,
                padding: 20,
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                background: b.gradiente,
                boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {b.subtitulo}
              </span>
              <span className="font-extrabold" style={{ fontSize: 24, color: "#fff", marginTop: 4 }}>
                {b.titulo}
              </span>
            </button>
          ))}
        </div>
      )}

      {secao === "diaria" && (
        <div className="card" style={{ padding: 20 }}>
          <h2 className="font-extrabold" style={{ color: "#ff6a00", fontSize: 15, marginBottom: 4 }}>Escala do Dia</h2>
          <p style={{ color: "#9a9a9f", fontSize: 12, marginBottom: 16 }}>12 horários — dois professores por horário</p>
          {listaHorarios.map((h, i) => (
            <div key={h.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: i < listaHorarios.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <span style={{ width: 20, color: "#6c6c72", fontSize: 12, fontWeight: 700 }}>{i + 1}</span>
              <input
                type="time"
                defaultValue={h.horario || "06:00"}
                onBlur={(e) => atualizarHorario(h.id, "horario", e.target.value)}
                style={{ ...campoStyle, width: 110 }}
              />
              <input
                type="text"
                defaultValue={h.professor1}
                placeholder="Professor 1"
                onBlur={(e) => atualizarHorario(h.id, "professor1", e.target.value)}
                style={{ ...campoStyle, flex: 1 }}
              />
              <input
                type="text"
                defaultValue={h.professor2}
                placeholder="Professor 2"
                onBlur={(e) => atualizarHorario(h.id, "professor2", e.target.value)}
                style={{ ...campoStyle, flex: 1 }}
              />
            </div>
          ))}
        </div>
      )}

      {secao === "anual" && (
        <div className="card" style={{ padding: 20, overflowX: "auto" }}>
          <h2 className="font-extrabold" style={{ color: "#ff6a00", fontSize: 15, marginBottom: 4 }}>Calendário Anual</h2>
          <p style={{ color: "#9a9a9f", fontSize: 12, marginBottom: 16 }}>70 dias — dê 2 toques na célula pra colorir, 1 toque pra digitar</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 620 }}>
            <thead>
              <tr>
                {["Dia", "Sábado/Feriado", "Professor 1", "Professor 2"].map((h) => (
                  <th key={h} style={{ textAlign: "left", color: "#6c6c72", fontSize: 10, textTransform: "uppercase", fontWeight: 800, padding: "8px 6px", borderBottom: "1px solid rgba(255,255,255,0.09)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listaDias.map((d) => (
                <tr key={d.id}>
                  <td style={tdStyle}>
                    <input
                      type="text"
                      defaultValue={d.dia}
                      onBlur={(e) => atualizarDia(d.id, "dia", e.target.value)}
                      onDoubleClick={() => alternarCorDia(d)}
                      style={{
                        ...campoStyle,
                        background: d.cor_dia ? CORES[d.cor_dia] : "#1f2024",
                        color: d.cor_dia ? "#0d0d0d" : "#f2f2f0",
                        fontWeight: d.cor_dia ? 700 : 400,
                        borderColor: d.cor_dia ? CORES[d.cor_dia] : "rgba(255,255,255,0.14)",
                      }}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="text"
                      defaultValue={d.sabado_feriado}
                      placeholder="Ex: Sábado ou Feriado"
                      onBlur={(e) => atualizarDia(d.id, "sabado_feriado", e.target.value)}
                      onDoubleClick={() => alternarCorFeriado(d)}
                      style={{
                        ...campoStyle,
                        background: d.cor_feriado ? CORES[d.cor_feriado] : "#1f2024",
                        color: d.cor_feriado ? "#0d0d0d" : "#f2f2f0",
                        fontWeight: d.cor_feriado ? 700 : 400,
                        borderColor: d.cor_feriado ? CORES[d.cor_feriado] : "rgba(255,255,255,0.14)",
                      }}
                    />
                  </td>
                  <td style={tdStyle}><input type="text" defaultValue={d.professor1} placeholder="Nome" onBlur={(e) => atualizarDia(d.id, "professor1", e.target.value)} style={campoStyle} /></td>
                  <td style={tdStyle}><input type="text" defaultValue={d.professor2} placeholder="Nome" onBlur={(e) => atualizarDia(d.id, "professor2", e.target.value)} style={campoStyle} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {secao === "professores" && (
        <div className="card" style={{ overflow: "hidden" }}>
          {listaTreinadores.map((t, i) => (
            <div
              key={t.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 18px",
                borderBottom: i < listaTreinadores.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
                gap: 12,
              }}
            >
              <a href={`/treinador/${t.token}`} style={{ flex: 1, textDecoration: "none", color: "#f2f2f0" }}>
                <span className="font-bold">{t.nome}</span>
              </a>
              <button
                onClick={() => abrirEdicao(t)}
                aria-label="Editar treinador"
                style={{
                  background: "#1f2024",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: 8,
                  padding: "6px 12px",
                  color: "#f2f2f0",
                  fontSize: 13,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                Editar
              </button>
            </div>
          ))}
          {listaTreinadores.length === 0 && (
            <div style={{ padding: 20, color: "#9a9a9f", textAlign: "center" }}>Nenhum treinador nessa unidade ainda.</div>
          )}
        </div>
      )}

      {editando && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setEditando(null)}
        >
          <div className="card" style={{ padding: 24, width: 340 }} onClick={(e) => e.stopPropagation()}>
            <h3 className="font-extrabold mb-3">Editar treinador</h3>
            <input
              placeholder="Nome do treinador"
              value={editNome}
              onChange={(e) => setEditNome(e.target.value)}
              style={{ width: "100%", padding: 10, marginBottom: 16, background: "#1f2024", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 8, color: "#f2f2f0" }}
            />
            <button
              onClick={salvarEdicao}
              disabled={salvandoEdicao}
              className="font-bold"
              style={{ width: "100%", background: "#ff6a00", color: "#0d0d0d", padding: 10, borderRadius: 8, marginBottom: 10 }}
            >
              {salvandoEdicao ? "Salvando..." : "Salvar alterações"}
            </button>
            <button
              onClick={apagarTreinador}
              disabled={salvandoEdicao}
              className="font-bold"
              style={{ width: "100%", background: "transparent", border: "1px solid #ef4444", color: "#ef4444", padding: 10, borderRadius: 8 }}
            >
              Apagar treinador
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const campoStyle: React.CSSProperties = {
  width: "100%",
  padding: 8,
  background: "#1f2024",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 8,
  color: "#f2f2f0",
  fontSize: 13,
  colorScheme: "dark",
};

const tdStyle: React.CSSProperties = {
  padding: 6,
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};
