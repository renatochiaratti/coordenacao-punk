"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Treinador, Unidade } from "@/lib/types";

const LETRAS_PUNK = ["P", "U", "N", "K"];

export default function PainelGeral({
  unidades,
  treinadores,
}: {
  unidades: Unidade[];
  treinadores: Treinador[];
}) {
  const [lista, setLista] = useState<Treinador[]>(treinadores);
  const [showModal, setShowModal] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novaUnidade, setNovaUnidade] = useState(unidades[0]?.id || "");
  const [salvando, setSalvando] = useState(false);

  async function adicionarTreinador() {
    if (!novoNome.trim() || !novaUnidade) return;
    setSalvando(true);
    const { data, error } = await supabase
      .from("treinadores")
      .insert({ nome: novoNome.trim(), unidade_id: novaUnidade })
      .select("*, unidades(id, nome)")
      .single();
    setSalvando(false);
    if (!error && data) {
      setLista((prev) => [...prev, data as Treinador].sort((a, b) => a.nome.localeCompare(b.nome)));
      setNovoNome("");
      setShowModal(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700;1,900&display=swap");
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 className="font-extrabold text-2xl">Coordenação — Punk CrossFit</h1>
        <button
          onClick={() => setShowModal(true)}
          className="font-bold"
          style={{ background: "#ff6a00", color: "#0d0d0d", padding: "8px 16px", borderRadius: 8 }}
        >
          + Adicionar treinador
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {unidades.map((u, i) => {
          const qtd = lista.filter((t) => t.unidade_id === u.id).length;
          const letra = LETRAS_PUNK[i % LETRAS_PUNK.length];
          return (
            <a
              key={u.id}
              href={`/unidade/${u.id}`}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                minHeight: 150,
                borderRadius: 16,
                padding: "20px 24px",
                textDecoration: "none",
                background: "linear-gradient(155deg, #161616, #050505)",
                border: "1px solid rgba(255,255,255,0.06)",
                boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  right: -10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: "italic",
                  fontWeight: 900,
                  fontSize: 92,
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                  color: "transparent",
                  WebkitTextStroke: "1px rgba(255,255,255,0.14)",
                  letterSpacing: -2,
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                {u.nome}
              </span>

              <span
                style={{
                  position: "relative",
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: "italic",
                  fontWeight: 900,
                  fontSize: 68,
                  lineHeight: 1,
                  color: "#ff6a00",
                  marginRight: 20,
                  flexShrink: 0,
                  textShadow: "0 2px 18px rgba(255,106,0,0.35)",
                }}
              >
                {letra}
              </span>

              <div style={{ position: "relative", display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    color: "rgba(255,255,255,0.55)",
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                  }}
                >
                  {qtd} treinador{qtd === 1 ? "" : "es"}
                </span>
                <span
                  className="font-extrabold"
                  style={{
                    fontSize: 22,
                    color: "#fff",
                    marginTop: 2,
                  }}
                >
                  {u.nome}
                </span>
              </div>
            </a>
          );
        })}
      </div>

      {showModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowModal(false)}
        >
          <div className="card" style={{ padding: 24, width: 340 }} onClick={(e) => e.stopPropagation()}>
            <h3 className="font-extrabold mb-3">Novo treinador</h3>
            <input
              placeholder="Nome do treinador"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              style={{ width: "100%", padding: 10, marginBottom: 10, background: "#1f2024", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 8, color: "#f2f2f0" }}
            />
            <select
              value={novaUnidade}
              onChange={(e) => setNovaUnidade(e.target.value)}
              style={{ width: "100%", padding: 10, marginBottom: 16, background: "#1f2024", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 8, color: "#f2f2f0" }}
            >
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
            <button
              onClick={adicionarTreinador}
              disabled={salvando}
              className="font-bold"
              style={{ width: "100%", background: "#ff6a00", color: "#0d0d0d", padding: 10, borderRadius: 8 }}
            >
              {salvando ? "Salvando..." : "Adicionar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
