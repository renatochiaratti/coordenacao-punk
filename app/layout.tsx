import "./globals.css";
import { obterAcesso } from "@/lib/acesso";
import BarraAcesso from "@/components/BarraAcesso";
import ProtecaoConteudo from "@/components/ProtecaoConteudo";

export const metadata = {
  title: "Coordenação Punk CrossFit",
  description: "Painel de coordenação dos treinadores",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const acesso = await obterAcesso();

  return (
    <html lang="pt-BR">
      <body style={{ background: "#0d0d0d", color: "#f2f2f0" }}>
        {acesso && (
          <BarraAcesso email={acesso.email} papel={acesso.papel} nivel={acesso.nivel} />
        )}
        {children}
        {acesso && acesso.papel !== "master" && <ProtecaoConteudo email={acesso.email} />}
      </body>
    </html>
  );
}
