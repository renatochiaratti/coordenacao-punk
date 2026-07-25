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

  const [editando, setEditando] = useState<Treinador | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editUnidade, setEditUnidade] = useState("");
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

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

  function abrirEdicao(t: Treinador) {
    setEditando(t);
    setEditNome(t.nome);
    setEditUnidade(t.unidade_id);
  }

  async function salvarEdicao() {
    if (!editando || !editNome.trim() || !editUnidade) return;
    setSalvandoEdicao(true);
    const { data, error } = await supabase
      .from("treinadores")
      .update({ nome: editNome.trim(), unidade_id: editUnidade })
      .eq("id", editando.id)
      .select("*, unidades(id, nome)")
      .single();
    setSalvandoEdicao(false);
    if (!error && data) {
      setLista((prev) =>
        prev.map((x) => (x.id === editando.id ? (data as Treinador) : x)).sort((a, b) => a.nome.localeCompare(b.nome))
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
      setLista((prev) => prev.filter((x) => x.id !== editando.id));
      setEditando(null);
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

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        <button
          onClick={() => setFiltroUnidade("todas")}
          className="status-pill"
          style={{ background: filtroUnidade === "todas" ? "#ff6a00" : "#1f2024", color: filtroUnidade === "todas" ? "#0d0d0d" : "#f2f2f0" }}
        >
          Todas as unidades
        </button>
        {unidades.map((u) => (
          <a
            key={u.id}
            href={`/unidade/${u.id}`}
            className="status-pill"
            style={{ background: "#1f2024", color: "#f2f2f0", textDecoration: "none", display: "inline-block" }}
          >
            {u.nome}
          </a>
        ))}
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {visiveis.map((t, i) => (
          <div
            key={t.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 18px",
              borderBottom: i < visiveis.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
              gap: 12,
            }}
          >
            <a
              href={`/treinador/${t.token}`}
              style={{ display: "flex", flexDirection: "column", flex: 1, textDecoration: "none", color: "#f2f2f0" }}
            >
              <span className="font-bold">{t.nome}</span>
              <span style={{ color: "#9a9a9f", fontSize: 13 }}>{t.unidades?.nome}</span>
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
              style={{ width: "100%", padding: 10, marginBottom: 10, background: "#1f2024", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 8, color: "#f2f2f0" }}
            />
            <select
              value={editUnidade}
              onChange={(e) => setEditUnidade(e.target.value)}
              style={{ width: "100%", padding: 10, marginBottom: 16, background: "#1f2024", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 8, color: "#f2f2f0" }}
            >
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
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
