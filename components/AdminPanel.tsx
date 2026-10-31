"use client";

import { useState } from "react";
import { criarClienteNavegador } from "@/lib/supabase/client";

type Unidade = { id: string; nome: string };
type Perfil = { id: string; email: string; nome: string | null; nivel: string; ativo: boolean };
type Acesso = { perfil_id: string; unidade_id: string };
type Convite = {
  id: string;
  token: string;
  nome: string | null;
  nivel: string;
  unidades_ids: string[];
  expira_em: string;
};

const NIVEIS = [
  { valor: "consulta", rotulo: "Consulta (só vê)" },
  { valor: "criar", rotulo: "Criar (adiciona, não apaga)" },
];

const caixa = {
  background: "#161616",
  border: "1px solid #1f2024",
  borderRadius: 14,
  padding: 20,
} as const;

const campo = {
  background: "#0d0d0d",
  border: "1px solid #1f2024",
  borderRadius: 8,
  padding: "10px 12px",
  color: "#f2f2f0",
  fontSize: 16,
  width: "100%",
} as const;

const botao = {
  background: "#ff6a00",
  color: "#0d0d0d",
  fontWeight: 800,
  padding: "10px 16px",
  borderRadius: 8,
} as const;

export default function AdminPanel({
  unidades,
  perfisIniciais,
  acessosIniciais,
  convitesIniciais,
}: {
  unidades: Unidade[];
  perfisIniciais: Perfil[];
  acessosIniciais: Acesso[];
  convitesIniciais: Convite[];
}) {
  const [sb] = useState(() => criarClienteNavegador());
  const [perfis, setPerfis] = useState(perfisIniciais);
  const [acessos, setAcessos] = useState(acessosIniciais);
  const [convites, setConvites] = useState(convitesIniciais);

  const [nome, setNome] = useState("");
  const [nivel, setNivel] = useState("consulta");
  const [marcadas, setMarcadas] = useState<string[]>([]);
  const [criando, setCriando] = useState(false);
  const [copiado, setCopiado] = useState("");

  function linkDo(token: string) {
    return `${window.location.origin}/convite/${token}`;
  }

  async function copiar(token: string) {
    try {
      await navigator.clipboard.writeText(linkDo(token));
      setCopiado(token);
      setTimeout(() => setCopiado(""), 2500);
    } catch {
      window.prompt("Copie o link:", linkDo(token));
    }
  }

  function alternarMarcada(id: string) {
    setMarcadas((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function criarConvite() {
    if (marcadas.length === 0) {
      alert("Marque pelo menos uma unidade.");
      return;
    }
    setCriando(true);
    const { data, error } = await sb
      .from("convites")
      .insert({ nome: nome.trim() || null, nivel, unidades_ids: marcadas })
      .select()
      .single();
    setCriando(false);
    if (error || !data) {
      alert("Não foi possível criar o convite.");
      return;
    }
    setConvites((prev) => [data as Convite, ...prev]);
    setNome("");
    setMarcadas([]);
    copiar((data as Convite).token);
  }

  async function apagarConvite(id: string) {
    if (!confirm("Cancelar este convite?")) return;
    const { error } = await sb.from("convites").delete().eq("id", id);
    if (!error) setConvites((prev) => prev.filter((c) => c.id !== id));
  }

  async function mudarNivel(id: string, novo: string) {
    setPerfis((prev) => prev.map((p) => (p.id === id ? { ...p, nivel: novo } : p)));
    await sb.from("perfis").update({ nivel: novo }).eq("id", id);
  }

  async function alternarAtivo(id: string, ativo: boolean) {
    setPerfis((prev) => prev.map((p) => (p.id === id ? { ...p, ativo } : p)));
    await sb.from("perfis").update({ ativo }).eq("id", id);
  }

  async function alternarUnidade(perfilId: string, unidadeId: string, marcar: boolean) {
    if (marcar) {
      setAcessos((prev) => [...prev, { perfil_id: perfilId, unidade_id: unidadeId }]);
      await sb.from("acessos").insert({ perfil_id: perfilId, unidade_id: unidadeId });
    } else {
      setAcessos((prev) =>
        prev.filter((a) => !(a.perfil_id === perfilId && a.unidade_id === unidadeId))
      );
      await sb.from("acessos").delete().eq("perfil_id", perfilId).eq("unidade_id", unidadeId);
    }
  }

  async function sair() {
    await sb.auth.signOut();
    window.location.href = "/login";
  }

  function nomeUnidades(ids: string[]) {
    return ids.map((id) => unidades.find((u) => u.id === id)?.nome || "?").join(", ");
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px", color: "#f2f2f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 10, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Painel master — Acessos</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <a href="/" style={{ ...botao, background: "#1f2024", color: "#f2f2f0" }}>
            Voltar ao app
          </a>
          <button onClick={sair} style={{ ...botao, background: "#1f2024", color: "#f2f2f0" }}>
            Sair
          </button>
        </div>
      </div>

      {/* NOVO CONVITE */}
      <div style={{ ...caixa, marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Novo convite</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            style={campo}
            placeholder="Nome da pessoa (opcional)"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <select style={campo} value={nivel} onChange={(e) => setNivel(e.target.value)}>
            {NIVEIS.map((n) => (
              <option key={n.valor} value={n.valor}>
                {n.rotulo}
              </option>
            ))}
          </select>
          <div>
            <div style={{ fontSize: 14, color: "#9a9a96", marginBottom: 6 }}>Unidades liberadas:</div>
            {unidades.map((u) => (
              <label key={u.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0", fontSize: 16 }}>
                <input
                  type="checkbox"
                  checked={marcadas.includes(u.id)}
                  onChange={() => alternarMarcada(u.id)}
                  style={{ width: 20, height: 20 }}
                />
                {u.nome}
              </label>
            ))}
          </div>
          <button onClick={criarConvite} disabled={criando} style={{ ...botao, opacity: criando ? 0.6 : 1 }}>
            {criando ? "Criando..." : "Gerar link de convite"}
          </button>
          <div style={{ fontSize: 12, color: "#6b6b68" }}>
            O link vale por 7 dias e só pode ser usado uma vez. Ao gerar, ele já é copiado.
          </div>
        </div>
      </div>

      {/* CONVITES PENDENTES */}
      <div style={{ ...caixa, marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Convites pendentes</h2>
        {convites.length === 0 && <div style={{ color: "#6b6b68" }}>Nenhum convite pendente.</div>}
        {convites.map((c) => (
          <div key={c.id} style={{ borderTop: "1px solid #1f2024", padding: "12px 0", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontWeight: 700 }}>{c.nome || "Sem nome"}</div>
            <div style={{ fontSize: 13, color: "#9a9a96" }}>
              {NIVEIS.find((n) => n.valor === c.nivel)?.rotulo} · {nomeUnidades(c.unidades_ids)}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => copiar(c.token)} style={botao}>
                {copiado === c.token ? "Link copiado!" : "Copiar link"}
              </button>
              <button onClick={() => apagarConvite(c.id)} style={{ ...botao, background: "#1f2024", color: "#ff6b6b" }}>
                Cancelar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PESSOAS COM ACESSO */}
      <div style={caixa}>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Pessoas com acesso</h2>
        {perfis.length === 0 && <div style={{ color: "#6b6b68" }}>Ninguém ainda.</div>}
        {perfis.map((p) => (
          <div key={p.id} style={{ borderTop: "1px solid #1f2024", padding: "14px 0", display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <div style={{ fontWeight: 700 }}>{p.nome || p.email}</div>
              <div style={{ fontSize: 13, color: "#9a9a96" }}>{p.email}</div>
            </div>
            <select style={campo} value={p.nivel} onChange={(e) => mudarNivel(p.id, e.target.value)}>
              {NIVEIS.map((n) => (
                <option key={n.valor} value={n.valor}>
                  {n.rotulo}
                </option>
              ))}
            </select>
            <div>
              {unidades.map((u) => {
                const marcado = acessos.some((a) => a.perfil_id === p.id && a.unidade_id === u.id);
                return (
                  <label key={u.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "5px 0" }}>
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={(e) => alternarUnidade(p.id, u.id, e.target.checked)}
                      style={{ width: 20, height: 20 }}
                    />
                    {u.nome}
                  </label>
                );
              })}
            </div>
            <label style={{ display: "flex", gap: 10, alignItems: "center", color: p.ativo ? "#f2f2f0" : "#ff6b6b" }}>
              <input
                type="checkbox"
                checked={p.ativo}
                onChange={(e) => alternarAtivo(p.id, e.target.checked)}
                style={{ width: 20, height: 20 }}
              />
              {p.ativo ? "Acesso ativo" : "Acesso bloqueado"}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
