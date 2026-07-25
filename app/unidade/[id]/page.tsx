import { supabase } from "@/lib/supabaseClient";
import UnidadeDashboard from "@/components/UnidadeDashboard";
import { notFound } from "next/navigation";

export const revalidate = 0;

export default async function UnidadePage({ params }: { params: { id: string } }) {
  const { data: unidade } = await supabase.from("unidades").select("*").eq("id", params.id).single();
  if (!unidade) return notFound();

  const [horarios, dias, treinadores] = await Promise.all([
    supabase.from("escala_horarios").select("*").eq("unidade_id", params.id).order("ordem"),
    supabase.from("calendario_dias").select("*").eq("unidade_id", params.id).order("ordem"),
    supabase.from("treinadores").select("*").eq("unidade_id", params.id).eq("ativo", true).order("nome"),
  ]);

  return (
    <UnidadeDashboard
      unidade={unidade}
      horarios={horarios.data || []}
      dias={dias.data || []}
      treinadores={treinadores.data || []}
    />
  );
}
