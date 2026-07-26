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
  const [aba, setAba] = useState<"escalas" | "professores">("escalas");
  const [listaHorarios, setListaHorarios] = useState(horarios);
  const [listaDias, setListaDias] = useState(dias);

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

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
      <a href="/" style={{ color: "#9a9a9f", fontSize: 13, textDecoration: "none" }}>← Todas as unidades</a>
      <h1 className="font-extrabold text-2xl mt-1 mb-6">{unidade.nome}</h1>

      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        <button
          onClick={() => setAba("escalas")}
          style={{
            flex: 1, padding: 12, borderRadius: 8, fontWeight: 800, fontSize: 14, border: "1px solid rgba(255,255,255,0.08)",
            background: aba === "escalas" ? "#ff6a00" : "#17181c", color: aba === "escalas" ? "#0d0d0d" : "#9a9a9f",
          }}
        >
          Escalas
        </button>
        <button
          onClick={() => setAba("professores")}
          style={{
            flex: 1, padding: 12, borderRadius: 8, fontWeight: 800, fontSize: 14, border: "1px solid rgba(255,255,255,0.08)",
            background: aba === "professores" ? "#ff6a00" : "#17181c", color: aba === "professores" ? "#0d0d0d" : "#9a9a9f",
          }}
        >
          Professores
        </button>
      </div>

      {aba === "escalas" && (
        <>
          <div className="card" style={{ padding: 20, marginBottom: 24 }}>
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
        </>
      )}

      {aba === "professores" && (
        <div className="card" style={{ overflow: "hidden" }}>
          {treinadores.map((t, i) => (
            <a
              key={t.id}
              href={`/treinador/${t.token}`}
              style={{
                display: "block", padding: "14px 18px", textDecoration: "none", color: "#f2f2f0",
                borderBottom: i < treinadores.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
              }}
            >
              <span className="font-bold">{t.nome}</span>
            </a>
          ))}
          {treinadores.length === 0 && (
            <div style={{ padding: 20, color: "#9a9a9f", textAlign: "center" }}>Nenhum treinador nessa unidade ainda.</div>
          )}
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
