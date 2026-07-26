"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Unidade, Treinador, EscalaHorario, CalendarioDia } from "@/lib/types";

const CORES: Record<string, string> = {
  vermelho: "#ef4444",
  azul: "#3b82f6",
  laranja: "#ff6a00",
  verde: "#22c55e",
  rosa: "#ec4899",
};
const ORDEM_CORES = ["", "vermelho", "azul", "laranja", "verde", "rosa"];

function proximaCor(atual: string) {
  const idx = ORDEM_CORES.indexOf(atual || "");
  return ORDEM_CORES[(idx + 1) % ORDEM_CORES.length];
}

export default function UnidadeDashboard({
  unidade,
  horarios,
  dias,
  treinadores,
}: {
  unidade: Unidade;
  horarios: EscalaHorario[];
  dias: CalendarioDia[];
  treinadores: Treinador[];
}) {
  const [aba, setAba] = useState<"escalas" | "professores">("escalas");
  const [listaHorarios, setListaHorarios] = useState(horarios);
  const [listaDias, setListaDias] = useState(dias);

  async function atualizarHorario(id: string, campo: "horario" | "professor1" | "professor2", valor: string) {
    setListaHorarios((prev) => prev.map((h) => (h.id === id ? { ...h, [campo]: valor } : h)));
    await supabase.from("escala_horarios").update({ [campo]: valor }).eq("id", id);
  }

  async function atualizarDia(id: string, campo: "dia" | "sabado_feriado" | "professor1" | "professor2", valor: string) {
    setListaDias((prev) => prev.
