import { supabase } from "@/lib/supabaseClient";
import type { Treinador, Unidade } from "@/lib/types";
import PainelGeral from "@/components/PainelGeral";

export const revalidate = 0;

export default async function HomePage() {
  const { data: unidades } = await supabase.from("unidades").select("*").order("nome");
  const { data: treinadores } = await supabase
    .from("treinadores")
    .select("*, unidades(id, nome)")
    .eq("ativo", true)
    .order("nome");

  return (
    <PainelGeral
      unidades={(unidades as Unidade[]) || []}
      treinadores={(treinadores as Treinador[]) || []}
    />
  );
}
