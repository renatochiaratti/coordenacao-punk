"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Treinador, Unidade } from "@/lib/types";

export default function PainelGeral({
  unidades,
  treinadores,
}: {
  unidades: Unidade[];
  treinadores: Treinador[];
}) {
  const [lista, setLista] = useState<Treinador[]>(treinadores);
  const [filtroUnidade, setFiltroUnidade] = useState<string>("todas");
  const [showModal, setShowModal] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novaUnidade, setNovaUnidade] = useState(unidades[0]?.id || "");
  const [salvando, setSalvando] = useState(false);

  const visiveis =
    filtroUnidade === "todas" ? lista : lista.filter((t) => t.unidade_id === filtroUnidade);

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
      <div className="flex items-center justify-between mb-6" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="font-extrabold text-2xl">Coordenação — Punk CrossFit</h1>
        <button
          onClick={() => setShowModal(true)}
          className="font-bold"
          style={{ background: "#ff6a00", color: "#0d0d0d", padding: "8px 16px", borderRadius: 8 }}
        >
          + Adicionar treinador
        </button>
      </div>

      <div className="flex gap-2 mb-5" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={() => setFiltroUnidade("todas")}
          className="status-pill"
          style={{ background: filtroUnidade === "todas" ? "#ff6a00" : "#1f2024", color: filtroUnidade === "todas" ? "#0d0d0d" : "#f2f2f0" }}
        >
          Todas as unidades
        </button>
        {unidades.map((u) => (
          <button
            key={u.id}
            onClick={() => setFiltroUnidade(u.id)}
            className="status-pill"
            style={{ background: filtroUnidade === u.id ? "#ff6a00" : "#1f2024", color: filtroUnidade === u.id ? "#0d0d0d" : "#f2f2f0" }}
          >
            {u.nome}
          </button>
        ))}
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {visiveis.map((t, i) => (
          <a
            key={t.id}
            href={`/treinador/${t.token}`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 18px",
              borderBottom: i < visiveis.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
              textDecoration: "none",
              color: "#f2f2f0",
            }}
          >
            <span className="font-bold">{t.nome}</span>
            <span style={{ color: "#9a9a9f", fontSize: 13 }}>{t.unidades?.nome}</span>
          </a>
        ))}
        {visiveis.length === 0 && (
          <div style={{ padding: 20, color: "#9a9a9f", textAlign: "center" }}>Nenhum treinador nessa unidade ainda.</div>
        )}
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
