import { supabase } from "@/lib/supabaseClient";
import TreinadorDashboard from "@/components/TreinadorDashboard";
import { notFound } from "next/navigation";

export const revalidate = 0;

export default async function TreinadorPage({ params }: { params: { token: string } }) {
  const { data: treinador } = await supabase
    .from("treinadores")
    .select("*, unidades(id, nome)")
    .eq("token", params.token)
    .single();

  if (!treinador) return notFound();

  const [oneOnOnes, checklist, avaliacoesAula, scorecardAvaliacoes, cursos, desenvolvimento, combinados, contratos, npsPesquisas] =
    await Promise.all([
      supabase.from("one_on_ones").select("*").eq("treinador_id", treinador.id).order("data", { ascending: false }),
      supabase.from("checklist_aulas").select("*").eq("treinador_id", treinador.id).order("data", { ascending: false }),
      supabase.from("avaliacoes_aula").select("*").eq("treinador_id", treinador.id).order("data", { ascending: false }),
      supabase.from("scorecard_avaliacoes").select("*").eq("treinador_id", treinador.id).order("data_final", { ascending: false }),
      supabase.from("cursos").select("*").eq("treinador_id", treinador.id).order("created_at", { ascending: false }),
      supabase.from("desenvolvimento").select("*").eq("treinador_id", treinador.id).order("created_at", { ascending: false }),
      supabase.from("combinados").select("*").eq("treinador_id", treinador.id).order("data_combinado", { ascending: false }),
      supabase.from("contratos").select("*").eq("treinador_id", treinador.id),
      supabase.from("nps_pesquisas").select("*, nps_respostas(*)").eq("treinador_id", treinador.id).order("data", { ascending: false }),
    ]);

  return (
    <TreinadorDashboard
      treinador={treinador}
      oneOnOnes={oneOnOnes.data || []}
      checklist={checklist.data || []}
      avaliacoesAula={avaliacoesAula.data || []}
      scorecardAvaliacoes={scorecardAvaliacoes.data || []}
      cursos={cursos.data || []}
      desenvolvimento={desenvolvimento.data || []}
      combinados={combinados.data || []}
      contratos={contratos.data || []}
      npsPesquisas={npsPesquisas.data || []}
    />
  );
}
