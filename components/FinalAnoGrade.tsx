"use client";

import { supabase } from "@/lib/supabaseClient";

export type FinalAnoLinha = {
  id: string;
  unidade_id: string;
  ordem: number;
  data: string; // formato AAAA-MM-DD
  horario: string;
  professores: string;
};

const SEMANAS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const FERIADOS: Record<string, string> = {
  "12-24": "Véspera de Natal",
  "12-25": "Natal",
  "12-31": "Véspera de Ano Novo",
  "01-01": "Ano Novo",
};

const COR_SEMANA_1 = "#ec4899";
const COR_SEMANA_2 = "#ff6a00";
const COR_FERIADO = "#ef4444";

type Dia = {
  data: string;
  linhas: FinalAnoLinha[];
};

function agruparPorDia(linhas: FinalAnoLinha[]): Dia[] {
  const mapa = new Map<string, FinalAnoLinha[]>();
  [...linhas]
    .sort((a, b) => a.ordem - b.ordem)
    .forEach((l) => {
      const lista = mapa.get(l.data) || [];
      lista.push(l);
      mapa.set(l.data, lista);
    });
  return Array.from(mapa.entries()).map(([data, lista]) => ({ data, linhas: lista }));
}

function infoDoDia(data: string, indice: number) {
  const [ano, mes, dia] = data.split("-").map(Number);
  const diaSemana = new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
  const chave = `${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  const feriado = FERIADOS[chave] || "";
  const cor = feriado ? COR_FERIADO : indice < 7 ? COR_SEMANA_1 : COR_SEMANA_2;
  const rotuloDia = mes === 12 ? `Dia ${dia}` : `Dia ${dia}/${String(mes).padStart(2, "0")}`;
  return { rotuloDia, semana: SEMANAS[diaSemana], feriado, cor };
}

export default function FinalAnoGrade({
  linhas,
  editavel,
  onSalvar,
}: {
  linhas: FinalAnoLinha[];
  editavel: boolean;
  onSalvar?: (id: string, valor: string) => void;
}) {
  const dias = agruparPorDia(linhas);

  if (dias.length === 0) {
    return (
      <div style={{ padding: 20, color: "#9a9a9f", textAlign: "center", fontSize: 13 }}>
        O calendário de final do ano ainda não foi criado.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {dias.map((d, i) => {
        const info = infoDoDia(d.data, i);
        return (
          <div key={d.data}>
            {(i === 0 || i === 7) && (
              <p
                style={{
                  color: "#9a9a9f",
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  margin: "6px 0 8px",
                }}
              >
                {i === 0 ? "Semana 1 · 21/12 a 27/12" : "Semana 2 · 28/12 a 03/01"}
              </p>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "minmax(104px, 140px) minmax(0, 1fr)", gap: 10 }}>
              <div
                style={{
                  background: info.cor,
                  color: "#0d0d0d",
                  borderRadius: 10,
                  padding: "12px 10px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <span className="font-extrabold" style={{ fontSize: 18 }}>{info.rotuloDia}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{info.semana}</span>
                {info.feriado && (
                  <span style={{ fontSize: 11, fontWeight: 800, marginTop: 4 }}>{info.feriado}</span>
                )}
              </div>

              <div className="card" style={{ padding: "10px 12px" }}>
                <p
                  style={{
                    color: "#6c6c72",
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    margin: "0 0 8px",
                  }}
                >
                  Horários
                </p>
                {d.linhas.map((l, j) => (
                  <div
                    key={l.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: editavel ? "76px minmax(0, 1fr)" : "54px minmax(0, 1fr)",
                      gap: 8,
                      alignItems: "center",
                      padding: "5px 0",
                      borderTop: j === 2 || j === 4 ? "1px solid rgba(255,255,255,0.08)" : "none",
                      marginTop: j === 2 || j === 4 ? 4 : 0,
                    }}
                  >
                    {editavel ? (
                      <input
                        type="text"
                        defaultValue={l.horario}
                        onBlur={(e) => {
                          const valor = e.target.value.trim();
                          if (valor) {
                            supabase.from("final_ano_horarios").update({ horario: valor }).eq("id", l.id);
                          }
                        }}
                        style={{ ...campoStyle, fontWeight: 800, textAlign: "center", padding: 8 }}
                      />
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#f2f2f0" }}>{l.horario}</span>
                    )}
                    {editavel ? (
                      <input
                        type="text"
                        defaultValue={l.professores}
                        placeholder="Professor(es)"
                        onBlur={(e) => onSalvar && onSalvar(l.id, e.target.value)}
                        style={campoStyle}
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: 14,
                          color: l.professores ? "#f2f2f0" : "#4a4a50",
                          minHeight: 20,
                        }}
                      >
                        {l.professores || "—"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
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
};
