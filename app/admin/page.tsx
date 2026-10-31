import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { obterAcesso } from "@/lib/acesso";
import AdminPanel from "@/components/AdminPanel";

export const revalidate = 0;

export default async function AdminPage() {
  const acesso = await obterAcesso();
  if (!acesso) redirect("/login");
  if (acesso.papel !== "master") redirect("/");

  const sb = criarClienteServidor();

  const [unidades, perfis, acessos, convites] = await Promise.all([
    sb.from("unidades").select("id, nome").order("nome"),
    sb
      .from("perfis")
      .select("id, email, nome, nivel, ativo")
      .eq("papel", "convidado")
      .order("created_at", { ascending: false }),
    sb.from("acessos").select("perfil_id, unidade_id"),
    sb
      .from("convites")
      .select("id, token, nome, nivel, unidades_ids, expira_em")
      .eq("usado", false)
      .gt("expira_em", new Date().toISOString())
      .order("created_at", { ascending: false }),
  ]);

  return (
    <AdminPanel
      unidades={unidades.data || []}
      perfisIniciais={perfis.data || []}
      acessosIniciais={acessos.data || []}
      convitesIniciais={convites.data || []}
    />
  );
}
