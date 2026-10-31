"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { criarClienteNavegador } from "@/lib/supabase/client";

const campo = {
  background: "#0d0d0d",
  border: "1px solid #1f2024",
  borderRadius: 8,
  padding: "12px 14px",
  color: "#f2f2f0",
  fontSize: 16,
} as const;

export default function ConvitePage() {
  const params = useParams();
  const token = String(params?.token || "");

  const [status, setStatus] = useState<"carregando" | "valido" | "invalido">("carregando");
  const [nomeConvidado, setNomeConvidado] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");
  const [erro, setErro] = useState("");
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    async function validar() {
      const sb = criarClienteNavegador();
      const { data, error } = await sb.rpc("validar_convite", { t: token });
      if (error || !data || data.length === 0) {
        setStatus("invalido");
        return;
      }
      setNomeConvidado(data[0].nome || "");
      setStatus("valido");
    }
    validar();
  }, [token]);

  async function criarConta(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== senha2) {
      setErro("As senhas não são iguais.");
      return;
    }
    setCriando(true);
    const sb = criarClienteNavegador();
    const { error } = await sb.auth.signUp({
      email: email.trim(),
      password: senha,
      options: { data: { convite: token } },
    });
    if (error) {
      setErro("Não foi possível criar a conta. O convite pode ter sido usado ou expirado, ou o e-mail já existe.");
      setCriando(false);
      return;
    }
    const { error: erroLogin } = await sb.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    if (erroLogin) {
      window.location.href = "/login";
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
      <div
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

        {status === "carregando" && (
          <p style={{ color: "#9a9a96" }}>Verificando convite...</p>
        )}

        {status === "invalido" && (
          <>
            <p style={{ color: "#ff6b6b" }}>
              Este convite é inválido, já foi usado ou expirou. Peça um novo link ao coordenador.
            </p>
            <a href="/login" style={{ color: "#ff6a00", fontWeight: 700 }}>
              Ir para o login
            </a>
          </>
        )}

        {status === "valido" && (
          <form onSubmit={criarConta} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 14, color: "#9a9a96", marginTop: -6 }}>
              {nomeConvidado ? `Olá, ${nomeConvidado}! ` : ""}Crie seu acesso com e-mail e senha.
            </p>
            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={campo}
            />
            <input
              type="password"
              placeholder="Crie uma senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              autoComplete="new-password"
              style={campo}
            />
            <input
              type="password"
              placeholder="Repita a senha"
              value={senha2}
              onChange={(e) => setSenha2(e.target.value)}
              required
              autoComplete="new-password"
              style={campo}
            />
            {erro && <div style={{ color: "#ff6b6b", fontSize: 14 }}>{erro}</div>}
            <button
              type="submit"
              disabled={criando}
              style={{
                background: "#ff6a00",
                color: "#0d0d0d",
                fontWeight: 800,
                padding: "12px 16px",
                borderRadius: 8,
                fontSize: 16,
                opacity: criando ? 0.6 : 1,
              }}
            >
              {criando ? "Criando..." : "Criar meu acesso"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
