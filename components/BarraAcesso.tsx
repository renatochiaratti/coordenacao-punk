"use client";

import { definirNivel } from "@/lib/supabaseClient";
import { criarClienteNavegador } from "@/lib/supabase/client";

export default function BarraAcesso({
  email,
  papel,
  nivel,
}: {
  email: string;
  papel: "master" | "convidado";
  nivel: "consulta" | "criar" | "total";
}) {
  definirNivel(nivel);

  async function sair() {
    const sb = criarClienteNavegador();
    await sb.auth.signOut();
    window.location.href = "/login";
  }

  const rotulo =
    papel === "master"
      ? "Master"
      : nivel === "consulta"
      ? "Consulta"
      : "Consulta + criar";

  const botao = {
    background: "#1f2024",
    color: "#f2f2f0",
    fontSize: 13,
    fontWeight: 700,
    padding: "6px 12px",
    borderRadius: 8,
    textDecoration: "none",
  } as const;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        padding: "8px 16px",
        background: "#050505",
        borderBottom: "1px solid #1f2024",
        color: "#9a9a96",
        fontSize: 12,
      }}
    >
      <span>
        {email} · <span style={{ color: "#ff6a00", fontWeight: 700 }}>{rotulo}</span>
      </span>
      <span style={{ display: "flex", gap: 8 }}>
        {papel === "master" && (
          <a href="/admin" style={botao}>
            Painel master
          </a>
        )}
        <button onClick={sair} style={botao}>
          Sair
        </button>
      </span>
    </div>
  );
}
