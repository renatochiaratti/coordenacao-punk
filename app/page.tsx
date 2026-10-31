import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { obterAcesso, podeVerUnidade } from "@/lib/acesso";
import type { Treinador, Unidade } from "@/lib/types";
import PainelGeral from "@/components/PainelGeral";

export const revalidate = 0;

export default async function HomePage() {
  const acesso = await obterAcesso();
  if (!acesso) redirect("/login");

  const { data: unidades } = await supabase.from("unidades").select("*").order("nome");
  const { data: treinadores } = await supabase
    .from("treinadores")
    .select("*, unidades(id, nome)")
    .eq("ativo", true)
    .order("nome");

  const unidadesLiberadas = ((unidades as Unidade[]) || []).filter((u) =>
    podeVerUnidade(acesso, u.id)
  );
  const treinadoresLiberados = ((treinadores as Treinador[]) || []).filter((t) =>
    podeVerUnidade(acesso, t.unidade_id)
  );

  return <PainelGeral unidades={unidadesLiberadas} treinadores={treinadoresLiberados} />;
}
