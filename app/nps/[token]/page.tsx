import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";
import NpsForm from "@/components/NpsForm";

export const revalidate = 0;

export default async function NpsPublicoPage({ params }: { params: { token: string } }) {
  const { data: pesquisa } = await supabase
    .from("nps_pesquisas")
    .select("*")
    .eq("token", params.token)
    .single();

  if (!pesquisa) return notFound();

  return <NpsForm pesquisa={pesquisa} />;
}
