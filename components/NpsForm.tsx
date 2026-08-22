"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { NpsPesquisa } from "@/lib/types";

const PERGUNTA_KEYS = ["pergunta1", "pergunta2", "pergunta3", "pergunta4", "pergunta5", "pergunta6"] as const;

export default function NpsForm({ pesquisa }: { pesquisa: NpsPesquisa }) {
  const [notas, setNotas] = useState<(number | null)[]>([null, null, null, null, null, null]);
  const [resposta7, setResposta7] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function selecionarNota(idx: number, valor: number) {
    setNotas((p) => p.map((n, i) => (i === idx ? valor : n)));
  }

  const todasPreenchidas = notas.every((n) => n !== null);

  async function enviar() {
    if (!todasPreenchidas) return;
    setEnviando(true);
    setErro(null);
    try {
      const { error } = await supabase.from("nps_respostas").insert({
        pesquisa_id: pesquisa.id,
        nota1: notas[0],
        nota2: notas[1],
        nota3: notas[2],
        nota4: notas[3],
        nota5: notas[4],
        nota6: notas[5],
        resposta7: resposta7.trim() || null,
      });
      if (error) {
        setErro("Não foi possível enviar sua resposta: " + error.message);
        return;
      }
      setEnviado(true);
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
        <h1 className="font-extrabold text-2xl mb-3">Obrigado! 🙌</h1>
        <p style={{ color: "#9a9a9f" }}>Sua resposta foi enviada com sucesso.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "40px 20px" }}>
      <h1 className="font-extrabold text-2xl mb-2">Pesquisa de satisfação</h1>
      <p style={{ color: "#9a9a9f", fontSize: 14, marginBottom: 28 }}>
        Suas respostas são anônimas. Escolha uma nota de 0 a 10 para cada pergunta.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {PERGUNTA_KEYS.map((key, idx) => (
          <div key={key}>
            <p className="font-bold" style={{ marginBottom: 10 }}>{pesquisa[key]}</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {Array.from({ length: 11 }, (_, n) => n).map((n) => (
                <button
                  key={n}
                  onClick={() => selecionarNota(idx, n)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: notas[idx] === n ? "#ff6a00" : "#1f2024",
                    color: notas[idx] === n ? "#0d0d0d" : "#f2f2f0",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div>
          <p className="font-bold" style={{ marginBottom: 10 }}>
            {pesquisa.pergunta7} <span style={{ color: "#9a9a9f", fontWeight: 400 }}>(opcional)</span>
          </p>
          <textarea
            value={resposta7}
            onChange={(e) => setResposta7(e.target.value)}
            placeholder="Escreva aqui..."
            style={{
              width: "100%",
              minHeight: 90,
              padding: 10,
              background: "#1f2024",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 8,
              color: "#f2f2f0",
            }}
          />
        </div>
      </div>

      {erro && <p style={{ color: "#e5484d", fontSize: 13, marginTop: 16 }}>{erro}</p>}

      <button
        onClick={enviar}
        disabled={!todasPreenchidas || enviando}
        className="font-bold"
        style={{
          width: "100%",
          background: todasPreenchidas ? "#ff6a00" : "#3a3a3f",
          color: "#0d0d0d",
          padding: 14,
          borderRadius: 8,
          marginTop: 28,
          border: "none",
          cursor: todasPreenchidas ? "pointer" : "not-allowed",
        }}
      >
        {enviando ? "Enviando..." : "Enviar respostas"}
      </button>
    </div>
  );
}
