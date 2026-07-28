export type Unidade = {
  id: string;
  nome: string;
};

export type Treinador = {
  id: string;
  nome: string;
  unidade_id: string;
  token: string;
  ativo: boolean;
  unidades?: Unidade;
};

export type OneOnOne = {
  id: string;
  treinador_id: string;
  data: string;
  topicos: string | null;
  observacoes: string | null;
};

export type ChecklistItem = {
  id: string;
  treinador_id: string;
  data: string;
  item: string;
  concluido: boolean;
};

export type AvaliacaoItem = {
  texto: string;
  ok: boolean;
};

export type AvaliacaoAula = {
  id: string;
  treinador_id: string;
  data: string;
  itens: AvaliacaoItem[];
};

export type Scorecard = {
  id: string;
  treinador_id: string;
  data: string;
  competencia: string;
  nota: number;
};

export type Curso = {
  id: string;
  treinador_id: string;
  nome: string;
  status: "planejado" | "em_andamento" | "concluido";
  data_conclusao: string | null;
};

export type Desenvolvimento = {
  id: string;
  treinador_id: string;
  titulo: string;
  descricao: string | null;
  status: "nao_iniciado" | "em_andamento" | "concluido";
  data_inicio: string | null;
  data_fim: string | null;
};

export type Escala = {
  id: string;
  treinador_id: string;
  dia_semana: "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado" | "domingo";
  horario: string;
  turma: string | null;
};

export type Combinado = {
  id: string;
  treinador_id: string;
  descricao: string;
  data_combinado: string;
  status: "em_dia" | "pendente" | "quebrado";
};

export type Contrato = {
  id: string;
  treinador_id: string;
  tipo_contrato: string | null;
  data_inicio: string | null;
  data_renovacao: string | null;
  observacoes: string | null;
};

export type EscalaHorario = {
  id: string;
  unidade_id: string;
  ordem: number;
  horario: string;
  professor1: string;
  professor2: string;
};

export type CalendarioDia = {
  id: string;
  unidade_id: string;
  ordem: number;
  dia: string;
  sabado_feriado: string;
  professor1: string;
  professor2: string;
  cor_dia: string;
  cor_feriado: string;
};
