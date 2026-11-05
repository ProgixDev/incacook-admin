"use client";

import { useState } from "react";
import { Plus, ShieldAlert, Trash2 } from "lucide-react";
import { patch } from "@/lib/api";
import { useAdminMutation, useAdminQuery } from "@/lib/query";
import { useAuth, isFullAdminRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTableError } from "@/components/dashboard/data-table-states";
import { formatDateTimeFr } from "@/lib/utils";
import {
  parseDispatchRadiusSteps,
  type DispatchRadiusInputRow,
  type DispatchRadiusStep,
} from "./dispatch-radius";

interface DispatchRadiusSetting {
  steps: DispatchRadiusStep[];
  isDefault: boolean;
  noDriverTimeoutSeconds: number;
  updatedAt: string | null;
  updatedById: string | null;
}

const PATH = "/admin/settings/dispatch-radius";
const OPEN_MESSAGE = "Aucun rayon configuré : la répartition est ouverte à tous les livreurs en ligne.";
const DEFAULT_ROW: DispatchRadiusInputRow = { delay: "00:00", radius: "" };

function toRows(steps: DispatchRadiusStep[]): DispatchRadiusInputRow[] {
  return steps.map(({ afterSeconds, radiusMeters }) => ({
    delay: `${Math.floor(afterSeconds / 60).toString().padStart(2, "0")}:${(afterSeconds % 60).toString().padStart(2, "0")}`,
    radius: radiusMeters === null ? "" : String(radiusMeters / 1000),
  }));
}

function toSteps(rows: DispatchRadiusInputRow[]): DispatchRadiusStep[] {
  return rows.map(({ delay, radius }) => {
    const [minutes, seconds] = delay.split(":").map(Number);
    return {
      afterSeconds: minutes * 60 + seconds,
      radiusMeters: radius.trim() === "" ? null : Math.round(Number(radius.replace(",", ".")) * 1000),
    };
  });
}

export function DispatchRadiusCard() {
  const { user } = useAuth();
  if (!user || !isFullAdminRole(user.role)) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-outline-variant bg-surface-container-low p-8 text-center">
        <ShieldAlert className="h-7 w-7 text-error" />
        <h2 className="text-base font-semibold text-on-surface">Accès réservé aux administrateurs</h2>
      </div>
    );
  }
  return <DispatchRadiusEditor />;
}

function DispatchRadiusEditor() {
  const query = useAdminQuery<DispatchRadiusSetting>({ path: PATH });
  const save = useAdminMutation<DispatchRadiusSetting, { steps: DispatchRadiusStep[] }>(
    (body, opts) => patch(PATH, body, opts),
  );
  const [rows, setRows] = useState<DispatchRadiusInputRow[]>([DEFAULT_ROW]);
  const [seeded, setSeeded] = useState("");
  const [saved, setSaved] = useState(false);

  const signature = query.data ? JSON.stringify(query.data.steps) : "";
  if (query.data && signature !== seeded) {
    setSeeded(signature);
    setRows(toRows(query.data.steps));
  }

  const validation = query.data
    ? parseDispatchRadiusSteps(rows, query.data.noDriverTimeoutSeconds)
    : { steps: null, error: null };
  const changed = query.data != null && JSON.stringify(toSteps(rows)) !== signature;

  async function persist(steps: DispatchRadiusStep[]) {
    setSaved(false);
    try {
      await save.mutate({ steps });
      setSaved(true);
      query.refetch();
    } catch {
      // The API error is displayed inline below.
    }
  }

  function addRow() {
    if (rows.length >= 8) return;
    const next = rows.map((row) => ({ ...row }));
    const last = next[next.length - 1];
    if (!last.radius.trim()) {
      const prior = Number(next.at(-2)?.radius.replace(",", ".") ?? 0);
      last.radius = String(Math.max(1, prior + 1));
    }
    const [minutes, seconds] = last.delay.split(":").map(Number);
    const nextSeconds = minutes * 60 + seconds + 60;
    next.push({
      delay: `${Math.floor(nextSeconds / 60).toString().padStart(2, "0")}:${(nextSeconds % 60).toString().padStart(2, "0")}`,
      radius: "",
    });
    setRows(next);
  }

  async function disable() {
    if (!window.confirm("Désactiver le rayon et ouvrir la répartition à tous les livreurs en ligne ?")) return;
    await persist([{ afterSeconds: 0, radiusMeters: null }]);
  }

  return (
    <div className="max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Rayon de répartition</CardTitle>
          <CardDescription>Élargissement progressif du rayon de recherche des livreurs.</CardDescription>
        </CardHeader>
        <CardContent>
          {query.isError ? (
            <DataTableError error={query.error} onRetry={query.refetch} />
          ) : query.isLoading && !query.data ? (
            <p role="status" className="text-sm text-on-surface-variant">Chargement…</p>
          ) : query.data ? (
            <div className="flex flex-col gap-5">
              {(query.data.isDefault || (query.data.steps.length === 1 && query.data.steps[0]?.radiusMeters === null)) && (
                <p className="rounded-md border border-outline-variant bg-surface-container-low p-3 text-sm text-on-surface" role="status">
                  {OPEN_MESSAGE}
                </p>
              )}
              {query.data.updatedAt && (
                <p className="text-[11px] text-on-surface-variant">
                  Dernière modification : {formatDateTimeFr(query.data.updatedAt)}
                  {query.data.updatedById ? ` · Administrateur ${query.data.updatedById}` : ""}
                </p>
              )}
              <div className="flex flex-col gap-3">
                {rows.map((row, index) => (
                  <div key={index} className="grid gap-3 rounded-md border border-outline-variant p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <label className="flex flex-col gap-1 text-xs font-medium text-on-surface-variant">
                      Délai (minutes:secondes)
                      <Input aria-label={`Délai étape ${index + 1}`} value={row.delay} placeholder="00:00" onChange={(event) => {
                        setSaved(false);
                        setRows((current) => current.map((item, i) => i === index ? { ...item, delay: event.target.value } : item));
                      }} />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-medium text-on-surface-variant">
                      Rayon (km){index === rows.length - 1 ? " — vide = Illimité" : ""}
                      <Input aria-label={`Rayon étape ${index + 1}`} value={row.radius} placeholder={index === rows.length - 1 ? "Illimité" : "Ex. 2,5"} onChange={(event) => {
                        setSaved(false);
                        setRows((current) => current.map((item, i) => i === index ? { ...item, radius: event.target.value } : item));
                      }} />
                    </label>
                    <div className="flex items-center gap-2">
                      {index === rows.length - 1 && row.radius.trim() === "" && <span className="text-xs text-on-surface-variant">Illimité</span>}
                      {rows.length > 1 && <Button type="button" size="icon" aria-label={`Supprimer étape ${index + 1}`} onClick={() => setRows((current) => current.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Délais croissants, rayons croissants jusqu’à 200 km. Le dernier délai doit précéder le délai sans livreur ({query.data.noDriverTimeoutSeconds}s).
              </p>
              {validation.error && <p role="alert" className="text-sm text-error">{validation.error}</p>}
              {save.error && <p role="alert" className="text-sm text-error">{save.error.message}{save.error.correlationId ? ` (réf. ${save.error.correlationId})` : ""}</p>}
              {saved && <p role="status" className="text-sm text-success">Rayon enregistré.</p>}
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={addRow} disabled={rows.length >= 8 || save.isPending}><Plus className="h-4 w-4" />Ajouter une étape</Button>
                {rows.length > 1 && <Button type="button" variant="outline" onClick={() => setRows((current) => current.slice(0, -1))} disabled={save.isPending}>Retirer la dernière</Button>}
                <Button type="button" onClick={() => validation.steps && persist(validation.steps)} disabled={!changed || !validation.steps || save.isPending}>Enregistrer</Button>
                <Button type="button" variant="outline" onClick={disable} disabled={save.isPending}>Désactiver le rayon (répartition ouverte)</Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
