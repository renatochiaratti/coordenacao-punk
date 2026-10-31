import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const real =
  typeof window === "undefined"
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createBrowserClient(supabaseUrl, supabaseAnonKey);

type NivelAcesso = "consulta" | "criar" | "total" | null;

// null = visitante sem login (ex.: aluno respondendo o NPS)
let nivelAtual: NivelAcesso = null;

export function definirNivel(nivel: NivelAcesso) {
  nivelAtual = nivel;
}

function bloqueado(mensagem: string): any {
  const resposta = { data: null, error: { message: mensagem } };
  if (typeof window !== "undefined") {
    window.alert(mensagem);
  }
  const p: any = new Proxy(function () {}, {
    get(_alvo, prop) {
      if (prop === "then") {
        return (ok: any, falha: any) => Promise.resolve(resposta).then(ok, falha);
      }
      return p;
    },
    apply() {
      return p;
    },
  });
  return p;
}

const ESCRITAS = ["insert", "upsert", "update", "delete"];

export const supabase = new Proxy(real, {
  get(alvo, prop) {
    if (prop === "from") {
      return (tabela: string) => {
        const construtor = alvo.from(tabela);
        return new Proxy(construtor, {
          get(c, p) {
            const valor = (c as any)[p];
            if (typeof p === "string" && ESCRITAS.includes(p)) {
              if (nivelAtual === "consulta") {
                return () => bloqueado("Seu acesso é somente consulta. Nada foi salvo.");
              }
              if (nivelAtual === "criar" && p !== "insert") {
                return () =>
                  bloqueado("Seu acesso permite apenas criar itens novos. Nada foi alterado.");
              }
            }
            return typeof valor === "function" ? valor.bind(c) : valor;
          },
        });
      };
    }
    const valor = Reflect.get(alvo, prop, alvo);
    return typeof valor === "function" ? valor.bind(alvo) : valor;
  },
}) as typeof real;
