"use client";

import { useEffect, useState } from "react";

const CSS = `
  body, body * {
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
  }
  body input, body textarea, body select {
    -webkit-user-select: text;
    user-select: text;
  }
  @media print {
    html, body { display: none !important; }
  }
`;

function criarMarcaDagua(email: string) {
  const texto = email.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="190">` +
    `<text x="20" y="105" font-size="15" font-family="Arial, sans-serif" ` +
    `fill="rgba(255,255,255,0.11)" transform="rotate(-25 170 95)">${texto}</text>` +
    `</svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

export default function ProtecaoConteudo({ email }: { email: string }) {
  const [oculto, setOculto] = useState(false);

  useEffect(() => {
    const bloquear = (e: Event) => e.preventDefault();
    const eventos = ["contextmenu", "copy", "cut", "dragstart"];
    eventos.forEach((ev) => document.addEventListener(ev, bloquear));

    const teclaApertada = (e: KeyboardEvent) => {
      const k = (e.key || "").toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const proibida =
        e.key === "F12" ||
        k === "printscreen" ||
        (ctrl && ["c", "x", "s", "p", "u", "a"].includes(k)) ||
        (ctrl && e.shiftKey && ["i", "j", "c", "s", "3", "4", "5"].includes(k));
      if (proibida) e.preventDefault();
    };

    const teclaSolta = (e: KeyboardEvent) => {
      if ((e.key || "").toLowerCase() === "printscreen") {
        try {
          navigator.clipboard.writeText("Conteúdo protegido");
        } catch {
          // ignora
        }
      }
    };

    const esconder = () => setOculto(true);
    const mostrar = () => setOculto(false);
    const mudouVisibilidade = () => {
      if (document.hidden) esconder();
      else mostrar();
    };

    document.addEventListener("keydown", teclaApertada);
    document.addEventListener("keyup", teclaSolta);
    document.addEventListener("visibilitychange", mudouVisibilidade);
    window.addEventListener("blur", esconder);
    window.addEventListener("focus", mostrar);
    window.addEventListener("pagehide", esconder);
    window.addEventListener("pageshow", mostrar);
    window.addEventListener("beforeprint", esconder);
    window.addEventListener("afterprint", mostrar);

    return () => {
      eventos.forEach((ev) => document.removeEventListener(ev, bloquear));
      document.removeEventListener("keydown", teclaApertada);
      document.removeEventListener("keyup", teclaSolta);
      document.removeEventListener("visibilitychange", mudouVisibilidade);
      window.removeEventListener("blur", esconder);
      window.removeEventListener("focus", mostrar);
      window.removeEventListener("pagehide", esconder);
      window.removeEventListener("pageshow", mostrar);
      window.removeEventListener("beforeprint", esconder);
      window.removeEventListener("afterprint", mostrar);
    };
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2147483646,
          pointerEvents: "none",
          backgroundImage: criarMarcaDagua(email),
          backgroundRepeat: "repeat",
        }}
      />
      {oculto && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2147483647,
            background: "#0d0d0d",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#f2f2f0",
            fontWeight: 800,
            fontSize: 20,
          }}
        >
          Conteúdo protegido
        </div>
      )}
    </>
  );
}
