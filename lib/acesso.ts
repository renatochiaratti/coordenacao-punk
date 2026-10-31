import { criarClienteServidor } from "@/lib/supabase/server";

export type Nivel = "consulta" | "criar" | "total";

export type Acesso = {
  email: string;
  papel: "master" | "convidado";
  nivel: Nivel;
  unidades: string[] | "todas";
};

export async function obterAcesso(): Promise<Acesso | null> {
  const sb = criarClienteServidor();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await sb
    .from("perfis")
    .select("email, papel, nivel, ativo")
    .eq("id", user.id)
    .single();

  if (!perfil || !perfil.ativo) return null;

  if (perfil.papel === "master") {
    return {
      email: perfil.email,
      papel: "master",
      nivel: "total",
      unidades: "todas",
    };
  }

  const { data: acessos } = await sb
    .from("acessos")
    .select("unidade_id")
    .eq("perfil_id", user.id);

  return {
    email: perfil.email,
    papel: "convidado",
    nivel: perfil.nivel as Nivel,
    unidades: (acessos || []).map((a: { unidade_id: string }) => a.unidade_id),
  };
}

export function podeVerUnidade(acesso: Acesso, unidadeId: string): boolean {
  return acesso.unidades === "todas" || acesso.unidades.includes(unidadeId);
}
