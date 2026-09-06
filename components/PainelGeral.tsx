"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Treinador, Unidade } from "@/lib/types";

const BLOCO_GRADIENTES = [
  "linear-gradient(135deg, #ff6a00, #b34700)",
  "linear-gradient(135deg, #1fbf5c, #0d5c2b)",
  "linear-gradient(135deg, #4a90e2, #1a3a63)",
  "linear-gradient(135deg, #b19cd9, #4a3d63)",
  "linear-gradient(135deg, #f5c518, #7a600b)",
];

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
          return (
            <a
              key={u.id}
              href={`/unidade/${u.id}`}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                minHeight: 140,
                borderRadius: 16,
                padding: 20,
                textDecoration: "none",
                background: BLOCO_GRADIENTES[i % BLOCO_GRADIENTES.length],
                boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {qtd} treinador{qtd === 1 ? "" : "es"}
              </span>
              <span className="font-extrabold" style={{ fontSize: 24, color: "#fff", marginTop: 4 }}>
                {u.nome}
              </span>
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
