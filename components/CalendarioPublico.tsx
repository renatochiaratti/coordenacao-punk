"use client";

import { useState } from "react";
import FinalAnoGrade, { type FinalAnoLinha } from "@/components/FinalAnoGrade";
import type { CalendarioDia } from "@/lib/types";

const CORES: Record<string, string> = {
  vermelho: "#ef4444",
  azul: "#3b82f6",
  laranja: "#ff6a00",
  verde: "#22c55e",
  rosa: "#ec4899",
};

type Aba = "final" | "anual";

export default function CalendarioPublico({
  nomeUnidade,
  finalAno,
  dias,
}: {
  nomeUnidade: string;
  finalAno: FinalAnoLinha[];
  dias: CalendarioDia[];
}) {
  const [aba, setAba] = useState<Aba>("final");

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px 48px" }}>
      <p
        style={{
          color: "#ff6a00",
          fontSize: 11,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          margin: 0,
        }}
      >
        Somente visualização
      </p>
      <h1 className="font-extrabold text-2xl mt-1 mb-5">{nomeUnidade}</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {(
          [
            { id: "final", titulo: "Final do ano" },
            { id: "anual", titulo: "Calendário anual" },
          ] as { id: Aba; titulo: string }[]
        ).map((b) => (
          <button
            key={b.id}
            onClick={() => setAba(b.id)}
            className="font-bold"
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              fontSize: 13,
              cursor: "pointer",
              border: aba === b.id ? "1px solid #ff6a00" : "1px solid rgba(255,255,255,0.14)",
              background: aba === b.id ? "#ff6a00" : "transparent",
              color: aba === b.id ? "#0d0d0d" : "#f2f2f0",
            }}
          >
            {b.titulo}
          </button>
        ))}
      </div>

      {aba === "final" && <FinalAnoGrade linhas={finalAno} editavel={false} />}

      {aba === "anual" && (
        <div className="card" style={{ padding: 16, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 560 }}>
            <thead>
              <tr>
                {["Dia", "Sábado/Feriado", "Professor 1", "Professor 2"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      color: "#6c6c72",
                      fontSize: 10,
                      textTransform: "uppercase",
                      fontWeight: 800,
                      padding: "8px 6px",
                      borderBottom: "1px solid rgba(255,255,255,0.09)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dias
                .filter((d) => d.dia || d.sabado_feriado || d.professor1 || d.professor2)
                .map((d) => (
                  <tr key={d.id}>
                    <td style={tdStyle}>
                      <div style={celula(d.cor_dia)}>{d.dia}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={celula(d.cor_feriado)}>{d.sabado_feriado}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={celula("")}>{d.professor1}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={celula("")}>{d.professor2}</div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function celula(cor: string): React.CSSProperties {
  return {
    padding: 8,
    borderRadius: 8,
    minHeight: 34,
    fontSize: 13,
    background: cor ? CORES[cor] : "#1f2024",
    color: cor ? "#0d0d0d" : "#f2f2f0",
    fontWeight: cor ? 700 : 400,
    border: `1px solid ${cor ? CORES[cor] : "rgba(255,255,255,0.14)"}`,
  };
}

const tdStyle: React.CSSProperties = {
  padding: 6,
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};
