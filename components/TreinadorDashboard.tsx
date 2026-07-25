"use client";

import { useState } from "react";
import type {
  Treinador,
  OneOnOne,
  ChecklistItem,
  Scorecard,
  Curso,
  Desenvolvimento,
  Escala,
  Combinado,
  Contrato,
} from "@/lib/types";

const DIA_LABEL: Record<string, string> = {
  segunda: "Seg", terca: "Ter", quarta: "Qua", quinta: "Qui", sexta: "Sex", sabado: "Sáb", domingo: "Dom",
};

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

export default function TreinadorDashboard({
  treinador,
  oneOnOnes,
  checklist,
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
  scorecards: Scorecard[];
  cursos: Curso[];
  desenvolvimento: Desenvolvimento[];
  escalas: Escala[];
  combinados: Combinado[];
  contratos: Contrato[];
}) {
  const [aba, setAba] = useState<(typeof ABAS)[number]>("One-on-One");

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

      <div className="card" style={{ padding: 18 }}>
        {aba === "One-on-One" && (
          <Lista
            vazio="Nenhum one-on-one registrado ainda."
            itens={oneOnOnes.map((o) => ({
              id: o.id,
              titulo: fmtDate(o.data),
              corpo: o.topicos || o.observacoes || "",
            }))}
          />
        )}

        {aba === "Checklist Aulas" && (
          <Lista
            vazio="Nenhum item de checklist ainda."
            itens={checklist.map((c) => ({
              id: c.id,
              titulo: c.item,
              corpo: fmtDate(c.data),
              status: c.concluido ? "concluido" : "pendente",
              statusLabel: c.concluido ? "Feito" : "Pendente",
            }))}
          />
        )}

        {aba === "ScoreCard" && (
          <Lista
            vazio="Nenhuma avaliação registrada ainda."
            itens={scorecards.map((s) => ({
              id: s.id,
              titulo: s.competencia,
              corpo: fmtDate(s.data),
              extra: s.nota.toFixed(1),
            }))}
          />
        )}

        {aba === "Cursos" && (
          <Lista
            vazio="Nenhum curso cadastrado ainda."
            itens={cursos.map((c) => ({
              id: c.id,
              titulo: c.nome,
              corpo: c.data_conclusao ? fmtDate(c.data_conclusao) : "",
              status: c.status,
              statusLabel: STATUS_LABEL[c.status],
            }))}
          />
        )}

        {aba === "Desenvolvimento" && (
          <Lista
            vazio="Nenhum plano de desenvolvimento ainda."
            itens={desenvolvimento.map((d) => ({
              id: d.id,
              titulo: d.titulo,
              corpo: d.descricao || "",
              status: d.status,
              statusLabel: STATUS_LABEL[d.status],
            }))}
          />
        )}

        {aba === "Escala" && (
          <Lista
            vazio="Nenhum horário cadastrado ainda."
            itens={escalas
              .sort((a, b) => a.horario.localeCompare(b.horario))
              .map((e) => ({
                id: e.id,
                titulo: `${DIA_LABEL[e.dia_semana]} · ${e.horario.slice(0, 5)}`,
                corpo: e.turma || "",
              }))}
          />
        )}

        {aba === "Combinados" && (
          <Lista
            vazio="Nenhum combinado registrado ainda."
            itens={combinados.map((c) => ({
              id: c.id,
              titulo: c.descricao,
              corpo: fmtDate(c.data_combinado),
              status: c.status,
              statusLabel: STATUS_LABEL[c.status],
            }))}
          />
        )}

        {aba === "Contrato" && (
          <Lista
            vazio="Nenhum contrato cadastrado ainda."
            itens={contratos.map((c) => ({
              id: c.id,
              titulo: c.tipo_contrato || "Contrato",
              corpo: [
                c.data_inicio ? `Início: ${fmtDate(c.data_inicio)}` : "",
                c.data_renovacao ? `Renovação: ${fmtDate(c.data_renovacao)}` : "",
                c.observacoes || "",
              ]
                .filter(Boolean)
                .join(" · "),
            }))}
          />
        )}
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  planejado: "Planejado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  nao_iniciado: "Não iniciado",
  em_dia: "Em dia",
  pendente: "Pendente",
  quebrado: "Quebrado",
};

function Lista({
  itens,
  vazio,
}: {
  itens: { id: string; titulo: string; corpo: string; status?: string; statusLabel?: string; extra?: string }[];
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
          {item.statusLabel && <span className={`status-pill ${item.status}`}>{item.statusLabel}</span>}
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
