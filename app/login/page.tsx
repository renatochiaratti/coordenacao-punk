"use client";

import { useState } from "react";
import { criarClienteNavegador } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setEntrando(true);
    const sb = criarClienteNavegador();
    const { error } = await sb.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    if (error) {
      setErro("E-mail ou senha incorretos.");
      setEntrando(false);
      return;
    }
    window.location.href = "/";
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "#0d0d0d",
      }}
    >
      <form
        onSubmit={entrar}
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#161616",
          border: "1px solid #1f2024",
          borderRadius: 14,
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#f2f2f0" }}>
          Coordenação — Punk CrossFit
        </h1>
        <p style={{ fontSize: 14, color: "#9a9a96", marginTop: -6 }}>
          Acesso restrito. Entre com seu e-mail e senha.
        </p>

        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          style={{
            background: "#0d0d0d",
            border: "1px solid #1f2024",
            borderRadius: 8,
            padding: "12px 14px",
            color: "#f2f2f0",
            fontSize: 16,
          }}
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          autoComplete="current-password"
          style={{
            background: "#0d0d0d",
            border: "1px solid #1f2024",
            borderRadius: 8,
            padding: "12px 14px",
            color: "#f2f2f0",
            fontSize: 16,
          }}
        />

        {erro && <div style={{ color: "#ff6b6b", fontSize: 14 }}>{erro}</div>}

        <button
          type="submit"
          disabled={entrando}
          style={{
            background: "#ff6a00",
            color: "#0d0d0d",
            fontWeight: 800,
            padding: "12px 16px",
            borderRadius: 8,
            fontSize: 16,
            opacity: entrando ? 0.6 : 1,
          }}
        >
          {entrando ? "Entrando..." : "Entrar"}
        </button>

        <p style={{ fontSize: 12, color: "#6b6b68", textAlign: "center" }}>
          Não tem acesso? Peça o link de convite ao coordenador.
        </p>
      </form>
    </div>
  );
}
