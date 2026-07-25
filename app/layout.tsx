import "./globals.css";

export const metadata = {
  title: "Coordenação Punk CrossFit",
  description: "Painel de coordenação dos treinadores",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ background: "#0d0d0d", color: "#f2f2f0" }}>{children}</body>
    </html>
  );
}
