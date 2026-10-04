
      if (editandoNpsId) {
        const { error } = await supabase.from("nps_pesquisas").update(payload).eq("id", editandoNpsId);
        if (error) {
          alert("Não foi possível salvar a pesquisa de NPS: " + error.message);
          return;
        }
        setListaPesquisas((p) => p.map((x) => (x.id === editandoNpsId ? { ...x, ...payload } : x)));
      } else {
        const { data, error } = await supabase.from("nps_pesquisas").insert(payload).select().single();
        if (error) {
          alert("Não foi possível salvar a pesquisa de NPS: " + error.message);
          return;
        }
        if (data) setListaPesquisas((p) => [{ ...(data as NpsPesquisa), nps_respostas: [] }, ...p]);
      }
      setShowNpsModal(false);
      setEditandoNpsId(null);
    } finally {
      setSalvandoNps(false);
    }
  }

  async function apagarNps(item: NpsPesquisa) {
    if (!confirm("Apagar esta pesquisa de NPS? Todas as respostas recebidas também serão apagadas.")) return;
    setApagandoNpsId(item.id);
    try {
      const { error } = await supabase.from("nps_pesquisas").delete().eq("id", item.id);
      if (!error) setListaPesquisas((p) => p.filter((x) => x.id !== item.id));
    } finally {
      setApagandoNpsId(null);
    }
  }

  function linkDaPesquisa(token: string) {
    const base = typeof window !== "undefined" ? window.location.origin : "https://coordenacao-punk.vercel.app";
    return `${base}/nps/${token}`;
  }

  async function copiarLink(item: NpsPesquisa) {
    try {
      await navigator.clipboard.writeText(linkDaPesquisa(item.token));
      setLinkCopiadoId(item.id);
      setTimeout(() => setLinkCopiadoId(null), 2000);
    } catch {
      alert("Não foi possível copiar o link. Copie manualmente: " + linkDaPesquisa(item.token));
    }
  }

  const [showScorecardModal, setShowScorecardModal] = useState(false);
  const [editandoScorecardId, setEditandoScorecardId] = useState<string | null>(null);
  const [scorecardCargo, setScorecardCargo] = useState("");
  const [scorecardLider, setScorecardLider] = useState("");
  const [scorecardDataFinal, setScorecardDataFinal] = useState(hoje);
  const [scorecardNotas, setScorecardNotas] = useState<Record<string, string>>({});
  const [scorecardAnotacoes, setScorecardAnotacoes] = useState("");
  const [salvandoScorecard, setSalvandoScorecard] = useState(false);
  const [apagandoScorecardId, setApagandoScorecardId] = useState<string | null>(null);

  function abrirScorecardModal() {
    setEditandoScorecardId(null);
    setScorecardCargo("Professor");
    setScorecardLider("");
    setScorecardDataFinal(hoje);
    setScorecardNotas({});
    setScorecardAnotacoes("");
    setShowScorecardModal(true);
  }

  function abrirEdicaoScorecard(item: ScorecardAvaliacao) {
    setEditandoScorecardId(item.id);
    setScorecardCargo(item.cargo || "");
    setScorecardLider(item.lider || "");
    setScorecardDataFinal(item.data_final || hoje);
    const notasStr: Record<string, string> = {};
    SCORECARD_ITENS.forEach((it) => {
      notasStr[it.id] = item.notas?.[it.id] ? String(item.notas[it.id]) : "";
    });
    setScorecardNotas(notasStr);
    setScorecardAnotacoes(item.comentario_colaborador || "");
    setShowScorecardModal(true);
  }

  async function salvarScorecard() {
    setSalvandoScorecard(true);
    try {
      const notasNum: Record<string, number> = {};
      SCORECARD_ITENS.forEach((it) => {
        const v = parseInt(scorecardNotas[it.id] || "0", 10);
        notasNum[it.id] = v >= 1 && v <= 5 ? v : 0;
      });

      const payload = {
        treinador_id: treinador.id,
        cargo: scorecardCargo || null,
        lider: scorecardLider || null,
        data_inicio: null,
        data_final: scorecardDataFinal || null,
        notas: notasNum,
        comentario_colaborador: scorecardAnotacoes || null,
        acoes_colaborador: null,
        acoes_lider: null,
      };

      if (editandoScorecardId) {
        const { error } = await supabase.from("scorecard_avaliacoes").update(payload).eq("id", editandoScorecardId);
        if (error) {
          alert("Não foi possível salvar o ScoreCard: " + error.message);
          return;
        }
        setListaScorecardAvaliacoes((p) => p.map((x) => (x.id === editandoScorecardId ? { ...x, ...payload } : x)));
      } else {
        const { data, error } = await supabase.from("scorecard_avaliacoes").insert(payload).select().single();
        if (error) {
          alert("Não foi possível salvar o ScoreCard: " + error.message);
          return;
        }
        if (data) setListaScorecardAvaliacoes((p) => [data as ScorecardAvaliacao, ...p]);
      }
      setShowScorecardModal(false);
      setEditandoScorecardId(null);
    } finally {
      setSalvandoScorecard(false);
    }
  }

  async function apagarScorecard(item: ScorecardAvaliacao) {
    if (!confirm("Apagar este ScoreCard?")) return;
    setApagandoScorecardId(item.id);
    try {
      const { error } = await supabase.from("scorecard_avaliacoes").delete().eq("id", item.id);
      if (!error) setListaScorecardAvaliacoes((p) => p.filter((x) => x.id !== item.id));
    } finally {
      setApagandoScorecardId(null);
    }
  }

  function abrirModal() {
    setFData(hoje);
    setFTexto1("");
    setFTexto2("");
    setFNumero("");
    setFData2("");
    setOocComecar("");
    setOocParar("");
    setOocContinuar("");
    setFSelect(
      aba === "Cursos" ? "x" :
      aba === "Combinados" ? "em_dia" : ""
    );
    setShowModal(true);
  }

  async function salvarNovo() {
    setSalvando(true);
    try {
      if (aba === "One-on-One") {
        const linhasCpc = [
          oocComecar.trim() ? `- Começar: ${oocComecar.trim()}` : "",
          oocParar.trim() ? `- Parar: ${oocParar.trim()}` : "",
          oocContinuar.trim() ? `- Continuar: ${oocContinuar.trim()}` : "",
        ].filter(Boolean);
        const { data, error } = await supabase
          .from("one_on_ones")
          .insert({ treinador_id: treinador.id, data: fData, topicos: linhasCpc.length > 0 ? linhasCpc.join("\n") : null, observacoes: null })
          .select()
          .single();
        if (!error && data) setListaOneOnOnes((p) => [data as OneOnOne, ...p]);
      } else if (aba === "Checklist Aulas") {
        const { data, error } = await supabase
          .from("checklist_aulas")
          .insert({ treinador_id: treinador.id, data: fData, item: fTexto1 })
          .select()
          .single();
        if (!error && data) setListaChecklist((p) => [data as ChecklistItem, ...p]);
      } else if (aba === "Cursos") {
        const { data, error } = await supabase
          .from("cursos")
          .insert({ treinador_id: treinador.id, nome: fTexto1, status: fSelect, data_conclusao: fData2 || null })
          .select()
          .single();
        if (!error && data) setListaCursos((p) => [data as Curso, ...p]);
      } else if (aba === "Combinados") {
        const { data, error } = await supabase
          .from("combinados")
          .insert({ treinador_id: treinador.id, descricao: fTexto1, data_combinado: fData, status: fSelect, data_verificacao: fData2 || null })
          .select()
          .single();
        if (!error && data) setListaCombinados((p) => [data as Combinado, ...p]);
      } else if (aba === "Contrato") {
        const { data, error } = await supabase
          .from("contratos")
          .insert({ treinador_id: treinador.id, tipo_contrato: fTexto1 || null, data_inicio: fData || null, data_renovacao: fData2 || null, observacoes: fTexto2 || null })
          .select()
          .single();
        if (!error && data) setListaContratos((p) => [data as Contrato, ...p]);
      }
      setShowModal(false);
    } finally {
      setSalvando(false);
    }
  }

  async function alternarChecklist(item: ChecklistItem) {
    const concluido = !item.concluido;
    setListaChecklist((p) => p.map((x) => (x.id === item.id ? { ...x, concluido } : x)));
    await supabase.from("checklist_aulas").update({ concluido }).eq("id", item.id);
  }

  async function alternarCurso(item: Curso) {
    const status = proximoStatusCurso(item.status);
    setListaCursos((p) => p.map((x) => (x.id === item.id ? { ...x, status } : x)));
    await supabase.from("cursos").update({ status }).eq("id", item.id);
  }

  async function atualizarDataCurso(item: Curso, novaData: string) {
    setListaCursos((p) => p.map((x) => (x.id === item.id ? { ...x, data_conclusao: novaData || null } : x)));
    await supabase.from("cursos").update({ data_conclusao: novaData || null }).eq("id", item.id);
  }

  async function alternarCombinado(item: Combinado) {
    const status = COMBINADO_CICLO[item.status];
    setListaCombinados((p) => p.map((x) => (x.id === item.id ? { ...x, status } : x)));
    await supabase.from("combinados").update({ status }).eq("id", item.id);
  }

  async function atualizarCombinado(id: string, campo: "descricao" | "data_combinado" | "data_verificacao", valor: string) {
    setListaCombinados((p) => p.map((x) => (x.id === id ? { ...x, [campo]: valor || null } : x)));
    await supabase.from("combinados").update({ [campo]: valor || null }).eq("id", id);
  }

  async function apagarCombinado(item: Combinado) {
    if (!confirm("Apagar este combinado?")) return;
    const { error } = await supabase.from("combinados").delete().eq("id", item.id);
    if (!error) setListaCombinados((p) => p.filter((x) => x.id !== item.id));
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700;1,900&display=swap");
      `}</style>

      <p style={{ color: "#9a9a9f", fontSize: 13, marginBottom: 4 }}>{treinador.unidades?.nome}</p>
      <h1 className="font-extrabold text-2xl mb-6">{treinador.nome}</h1>

      <div
        style={{
          display: "flex",
          flexWrap: "nowrap",
          gap: 10,
          marginBottom: 24,
          overflowX: "auto",
          paddingBottom: 4,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {ABAS.map((a) => {
          const ativa = aba === a;
          const cor = ABA_CORES[a];
          return (
            <button
              key={a}
              onClick={() => setAba(a)}
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                flex: "0 0 auto",
                width: 120,
                minHeight: 92,
                borderRadius: 14,
                padding: "12px 14px",
                textAlign: "left",
                cursor: "pointer",
                overflow: "hidden",
                background: ativa ? "linear-gradient(155deg, #262626, #0d0d0d)" : "linear-gradient(155deg, #161616, #050505)",
                border: ativa ? `1px solid ${cor}88` : "1px solid rgba(255,255,255,0.06)",
                boxShadow: ativa ? `0 0 0 1px ${cor}44, 0 6px 16px rgba(0,0,0,0.5)` : "0 4px 14px rgba(0,0,0,0.4)",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  right: -6,
                  top: -10,
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: "italic",
                  fontWeight: 900,
                  fontSize: 56,
                  lineHeight: 1,
                  color: "transparent",
                  WebkitTextStroke: `1px ${cor}33`,
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                {a.charAt(0)}
              </span>
              <span
                style={{
                  position: "relative",
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: "italic",
                  fontWeight: 900,
                  fontSize: 26,
                  lineHeight: 1,
                  color: cor,
                  marginBottom: 4,
                  textShadow: `0 2px 12px ${cor}55`,
                }}
              >
                {a.charAt(0)}
              </span>
              <span
                className="font-bold"
                style={{
                  position: "relative",
                  fontSize: 12.5,
                  color: ativa ? "#fff" : "#d8d8d8",
                  lineHeight: 1.25,
                }}
              >
                {a}
              </span>
            </button>
          );
        })}
      </div>

      {aba !== "Checklist Aulas" && aba !== "NPS" && aba !== "ScoreCard" && aba !== "Combinados" && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
          <button
            onClick={abrirModal}
            className="font-bold"
            style={{ background: "#ff6a00", color: "#0d0d0d", padding: "8px 16px", borderRadius: 8 }}
          >
            + Adicionar
          </button>
        </div>
      )}

      <div className="card" style={{ padding: 18 }}>
        {aba === "One-on-One" && (
          listaOneOnOnes.length === 0 ? (
            <p style={{ color: "#9a9a9f", textAlign: "center", padding: 20 }}>Nenhum one-on-one registrado ainda.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {listaOneOnOnes.map((o) => {
                const aberto = oneOnOneAbertoId === o.id;
                const cpc = parseCPC(o.topicos);
                return (
                  <div key={o.id} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <button
                        onClick={() => setOneOnOneAbertoId(aberto ? null : o.id)}
                        style={{
                          display: "flex",
                          flex: 1,
                          background: "transparent",
                          border: "none",
                          color: "#f2f2f0",
                          cursor: "pointer",
                          padding: 0,
                          textAlign: "left",
                        }}
                      >
                        <span className="font-bold">{fmtDate(o.data)}</span>
                      </button>
                      <button
                        onClick={() => apagarOneOnOne(o)}
                        disabled={apagandoId === o.id}
                        title="Apagar"
                        style={{ color: "#ff5a5a", background: "transparent", border: "none", fontSize: 18, cursor: "pointer", padding: 4, lineHeight: 1 }}
                      >
                        🗑
                      </button>
                    </div>

                    {aberto && (
                      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                        {cpc.comecar && (
                          <div>
                            <div className="font-extrabold" style={{ fontSize: 13 }}><LabelCPC letra="C" resto="omeçar" /></div>
                            <div style={{ fontSize: 14, marginTop: 2, whiteSpace: "pre-wrap" }}>{cpc.comecar}</div>
                          </div>
                        )}
                        {cpc.parar && (
                          <div>
                            <div className="font-extrabold" style={{ fontSize: 13 }}><LabelCPC letra="P" resto="arar" /></div>
                            <div style={{ fontSize: 14, marginTop: 2, whiteSpace: "pre-wrap" }}>{cpc.parar}</div>
                          </div>
                        )}
                        {cpc.continuar && (
                          <div>
                            <div className="font-extrabold" style={{ fontSize: 13 }}><LabelCPC letra="C" resto="ontinuar" /></div>
                            <div style={{ fontSize: 14, marginTop: 2, whiteSpace: "pre-wrap" }}>{cpc.continuar}</div>
                          </div>
                        )}

                        <div style={{ marginTop: 4, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                          <label style={{ display: "block", fontSize: 12, color: "#9a9a9f", marginBottom: 4 }}>Observação</label>
                          <textarea
                            value={getResposta(o)}
                            onChange={(e) => setRespostaDrafts((p) => ({ ...p, [o.id]: e.target.value }))}
                            style={{ ...inputStyle, minHeight: 70 }}
                            placeholder="Escreva aqui a observação / execução deste tópico..."
                          />
                          <button
                            onClick={() => salvarResposta(o)}
                            disabled={salvandoResposta === o.id}
                            className="font-bold"
                            style={{ marginTop: 6, background: "#ff6a00", color: "#0d0d0d", padding: "6px 14px", borderRadius: 8, fontSize: 13 }}
                          >
                            {salvandoResposta === o.id ? "Salvando..." : "Salvar observação"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {aba === "Checklist Aulas" && (
          <>
            <Lista
              vazio="Nenhum item de checklist ainda."
              itens={listaChecklist.map((c) => ({
                id: c.id,
                titulo: c.item,
                corpo: fmtDate(c.data),
                status: c.concluido ? "concluido" : "pendente",
                statusLabel: c.concluido ? "Feito" : "Pendente",
                onClick: () => alternarChecklist(c),
              }))}
            />

            <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h4 className="font-extrabold">Avaliações de aula</h4>
                <button
                  onClick={abrirAvaliacaoModal}
                  className="font-bold"
                  style={{ background: "#ff6a00", color: "#0d0d0d", padding: "6px 14px", borderRadius: 8, fontSize: 13 }}
                >
                  + Nova avaliação
                </button>
              </div>

              {listaAvaliacoes.length === 0 ? (
                <p style={{ color: "#9a9a9f", textAlign: "center", padding: 14, fontSize: 13 }}>
                  Nenhuma avaliação de aula registrada ainda.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[...listaAvaliacoes]
                    .sort((a, b) => b.data.localeCompare(a.data))
                    .map((av) => {
                    const preenchidos = av.itens.filter((it) => it.texto.trim() !== "");
                    const okCount = preenchidos.filter((it) => it.ok).length;
                    const aberta = avaliacaoAbertaId === av.id;
                    return (
                      <div key={av.id} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                          <button
                            onClick={() => setAvaliacaoAbertaId(aberta ? null : av.id)}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flex: 1,
                              background: "transparent",
                              border: "none",
                              color: "#f2f2f0",
                              cursor: "pointer",
                              padding: 0,
                            }}
                          >
                            <span className="font-bold">Avaliação de aula — {fmtDate(av.data)}</span>
                            <span style={{ color: "#9a9a9f", fontSize: 13, marginRight: 10 }}>{okCount}/{preenchidos.length} ok</span>
                          </button>
                          <button
                            onClick={() => abrirEdicaoAvaliacao(av)}
                            title="Editar"
                            style={{ background: "transparent", border: "none", fontSize: 16, cursor: "pointer", padding: 4, lineHeight: 1 }}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => apagarAvaliacao(av)}
                            disabled={apagandoAvaliacaoId === av.id}
                            title="Apagar"
                            style={{ color: "#ff5a5a", background: "transparent", border: "none", fontSize: 16, cursor: "pointer", padding: 4, lineHeight: 1 }}
                          >
                            🗑
                          </button>
                        </div>
