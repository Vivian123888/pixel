"use client";

import { useMemo, useState } from "react";

export function ProfileProjectPicker({ projects, selectedId }: { projects: { id: string; name: string }[]; selectedId: string | null }) {
  const [filter, setFilter] = useState("");
  const matches = useMemo(() => {
    const filtered = projects.filter((project) => project.name.toLocaleLowerCase("pt-BR").includes(filter.trim().toLocaleLowerCase("pt-BR")));
    const selected = projects.find((project) => project.id === selectedId);
    return selected && !filtered.some((project) => project.id === selected.id) ? [selected, ...filtered] : filtered;
  }, [projects, filter, selectedId]);
  return <div className="field">
    <label htmlFor="project-search">Projeto no PIXEL</label>
    <input id="project-search" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filtrar projetos pelo nome"/>
    <select name="profileProjectId" defaultValue={selectedId ?? ""} aria-label="Selecionar projeto">
      <option value="">Ainda não estou em um projeto</option>
      {matches.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
    </select>
    {!matches.length && filter && <small>Nenhum projeto encontrado com esse filtro.</small>}
  </div>;
}

