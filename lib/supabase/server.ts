import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieParaSalvar = { name: string; value: string; options?: any };

export function criarClienteServidor() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(lista: CookieParaSalvar[]) {
          try {
            lista.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // chamado de página de servidor: o middleware já renova a sessão
          }
        },
      },
    }
  );
}
