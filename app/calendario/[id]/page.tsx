import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import CalendarioPublico from "@/components/CalendarioPublico";
import type { FinalAnoLinha } from "@/components/FinalAnoGrade";
import type { CalendarioDia } from "@/lib/types";

export const revalidate = 0;

export const metadata = {
  title: "Calendário · Punk CrossFit",
  robots: { index: false, follow: false },
};

export default async function CalendarioPage({ params }: { params: { id: string } }) {
  const { data: unidade } = await supabase
    .from("unidades")
    .select("id, nome")
    .eq("id", params.id)
    .single();

  if (!unidade) return notFound();

  const [finalAno, dias] = await Promise.all([
    supabase.from("final_ano_horarios").select("*").eq("unidade_id", params.id).order("ordem"),
    supabase.from("calendario_dias").select("*").eq("unidade_id", params.id).order("ordem"),
  ]);

  return (
    <CalendarioPublico
      nomeUnidade={unidade.nome}
      finalAno={(finalAno.data as FinalAnoLinha[]) || []}
      dias={(dias.data as CalendarioDia[]) || []}
    />
  );
}
