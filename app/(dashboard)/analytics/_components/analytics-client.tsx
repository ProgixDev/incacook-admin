"use client";

import { useState } from "react";
import { AlertTriangle, BarChart3, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { isFullAdminRole, useAuth } from "@/lib/auth";
import { useAdminQuery } from "@/lib/query";
import {
  barPercent,
  dailyTotal,
  formatCount,
  formatRate,
  knownResults,
  outcomeCard,
  shortDay,
  stepHasActivity,
  valueLabel,
  WINDOW_LABEL,
} from "./analytics-model";
import { WINDOWS, type AnalyticsFunnel, type AnalyticsWindow } from "./types";

export function AnalyticsClient() {
  const { user } = useAuth();
  if (!user || !isFullAdminRole(user.role)) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-outline-variant bg-surface-container-low p-12 text-center">
        <ShieldAlert className="h-7 w-7 text-error" />
        <h2 className="text-base font-semibold text-on-surface">
          Accès réservé aux administrateurs
        </h2>
        <p className="max-w-sm text-sm text-on-surface-variant">
          Les statistiques d&apos;audience ne sont accessibles qu&apos;aux
          comptes administrateur.
        </p>
      </div>
    );
  }
  return <AnalyticsPanel />;
}

function AnalyticsPanel() {
  const [days, setDays] = useState<AnalyticsWindow>(30);
  const { data, isLoading, isError, error, refetch } =
    useAdminQuery<AnalyticsFunnel>({
      path: "/admin/analytics/funnel",
      keepPreviousData: false,
      params: { extra: { days } },
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="frost flex flex-wrap items-center gap-2 rounded-md p-3">
        <div role="tablist" aria-label="Période" className="flex gap-1.5">
          {WINDOWS.map((w) => (
            <Button
              key={w}
              role="tab"
              aria-selected={days === w}
              size="sm"
              variant={days === w ? "default" : "outline"}
              onClick={() => setDays(w)}
            >
              {WINDOW_LABEL[w]}
            </Button>
          ))}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          onClick={refetch}
          disabled={isLoading}
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Actualiser
        </Button>
      </div>

      <p
        role="note"
        className="rounded-md bg-primary/10 px-3 py-2 text-[12.5px] text-on-surface"
      >
        Ces chiffres ne comptent que les personnes qui ont accepté la mesure
        d&apos;audience dans l&apos;application : ils complètent, sans les
        remplacer, les chiffres exacts de la page « Activation vendeurs ».
        Google les met à jour avec un délai pouvant aller jusqu&apos;à un ou
        deux jours.
      </p>

      {isLoading && (
        <p className="text-sm text-on-surface-variant">
          Chargement des statistiques…
        </p>
      )}

      {isError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md bg-error/15 px-3 py-3 text-[13px] text-error"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">
              {error?.message ?? "Impossible de charger les statistiques."}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={refetch}
            >
              Réessayer
            </Button>
          </div>
        </div>
      )}

      {data && !data.configured && (
        <div
          role="status"
          className="rounded-md border border-outline-variant bg-surface-container-low p-6 text-sm text-on-surface-variant"
        >
          <BarChart3 className="mb-2 h-5 w-5" />
          Les statistiques d&apos;audience ne sont pas encore reliées à cet
          environnement (identifiant de propriété Google Analytics manquant côté
          serveur).
        </div>
      )}

      {data && data.configured && <AnalyticsReport data={data} />}
    </div>
  );
}

function AnalyticsReport({ data }: { data: AnalyticsFunnel }) {
  const by = Object.fromEntries(data.steps.map((s) => [s.event, s]));
  const firstUsers = data.steps[0]?.users ?? 0;
  const maxUsers = Math.max(0, ...data.steps.map((s) => s.users));
  const nothingYet = data.steps.every((s) => !stepHasActivity(s));
  const maxDaily = Math.max(
    0,
    ...data.daily.flatMap((d) => [
      d.signUp,
      d.trialRequest,
      d.subscriptionPurchase,
    ]),
  );

  return (
    <>
      <section
        aria-label="Chiffres clés"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        <StatCard
          label="Comptes créés"
          value={formatCount(by.sign_up?.users ?? 0)}
          hint="personnes, avec accord"
        />
        <StatCard
          label="Page d’abonnement vue"
          value={formatCount(by.paywall_view?.users ?? 0)}
          hint="personnes"
        />
        {(
          [
            outcomeCard(
              by.trial_request,
              { success: "Essais demandés", attempts: "Tentatives d’essai" },
              knownResults(data.breakdowns, "trial_request"),
            ),
            outcomeCard(
              by.subscription_purchase,
              {
                success: "Abonnements achetés",
                attempts: "Tentatives d’achat",
              },
              knownResults(data.breakdowns, "subscription_purchase"),
            ),
          ] as const
        ).map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={formatCount(card.value)}
            hint={card.hint}
          />
        ))}
      </section>

      {nothingYet && (
        <p
          role="status"
          className="rounded-md bg-warning/15 px-3 py-2 text-[13px] text-on-surface"
        >
          Aucune activité mesurée sur{" "}
          {WINDOW_LABEL[data.windowDays] ?? `${data.windowDays} jours`} :
          personne n&apos;a encore accepté la mesure d&apos;audience, ou Google
          n&apos;a pas encore traité les premiers événements.
        </p>
      )}

      <section
        aria-label="Étapes"
        className="rounded-md border border-outline-variant bg-surface-container-low p-4"
      >
        <h2 className="text-sm font-semibold text-on-surface">
          Étapes du parcours
        </h2>
        <p className="mb-3 text-[12px] text-on-surface-variant">
          Pour chaque étape : personnes distinctes et nombre d&apos;événements.
          Les taux comparent les personnes à l&apos;étape précédente et à la
          première ; ce n&apos;est pas un parcours strictement ordonné.
        </p>
        <ul className="flex flex-col gap-2">
          {data.steps.map((s) => (
            <li
              key={s.event}
              className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1"
            >
              <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-2 text-[13px]">
                  <span className="truncate font-medium text-on-surface">
                    {s.label}
                  </span>
                  <span className="shrink-0 tabular-nums text-on-surface">
                    {formatCount(s.users)}{" "}
                    <span className="text-[11px] text-on-surface-variant">
                      pers.
                    </span>
                  </span>
                </div>
                <div
                  className="mt-1 h-2 overflow-hidden rounded-full bg-surface-container-high"
                  aria-hidden="true"
                >
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${barPercent(s.users, maxUsers)}%` }}
                  />
                </div>
              </div>
              <div className="w-[170px] text-right text-[11.5px] leading-snug text-on-surface-variant">
                <div>
                  {formatCount(s.events)} événement{s.events > 1 ? "s" : ""}
                </div>
                <div>
                  {formatRate(s.conversionFromPrevious)} de l’étape précédente
                  {firstUsers > 0 && s.conversionFromFirst !== null
                    ? ` · ${formatRate(s.conversionFromFirst)} de la première`
                    : ""}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Par jour"
        className="rounded-md border border-outline-variant bg-surface-container-low p-4"
      >
        <h2 className="text-sm font-semibold text-on-surface">Par jour</h2>
        <p className="mb-3 text-[12px] text-on-surface-variant">
          {formatCount(dailyTotal(data.daily, "signUp"))} comptes créés ·{" "}
          {formatCount(dailyTotal(data.daily, "trialRequest"))} tentatives
          d&apos;essai ·{" "}
          {formatCount(dailyTotal(data.daily, "subscriptionPurchase"))}{" "}
          tentatives d&apos;achat (réussies ou non)
        </p>
        {data.daily.length === 0 ? (
          <p className="text-[12.5px] text-on-surface-variant">
            Aucun événement sur la période.
          </p>
        ) : (
          <div
            className="flex h-32 items-end gap-1 overflow-x-auto"
            role="img"
            aria-label="Événements par jour"
          >
            {data.daily.map((d) => (
              <div
                key={d.date}
                className="flex min-w-[22px] flex-1 flex-col items-center gap-1"
              >
                <div className="flex h-24 w-full items-end justify-center gap-[2px]">
                  {(
                    [
                      ["signUp", "bg-primary", "Comptes créés", d.signUp],
                      [
                        "trialRequest",
                        "bg-warning",
                        "Tentatives d’essai",
                        d.trialRequest,
                      ],
                      [
                        "subscriptionPurchase",
                        "bg-success",
                        "Tentatives d’achat",
                        d.subscriptionPurchase,
                      ],
                    ] as const
                  ).map(([key, color, label, value]) => (
                    <div
                      key={key}
                      title={`${shortDay(d.date)} : ${label} ${value}`}
                      className={`w-1/4 rounded-t ${color}`}
                      style={{ height: `${barPercent(value, maxDaily)}%` }}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-on-surface-variant">
                  {shortDay(d.date)}
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 flex gap-3 text-[11px] text-on-surface-variant">
          <span>
            <i className="mr-1 inline-block h-2 w-2 rounded-sm bg-primary" />
            Comptes créés
          </span>
          <span>
            <i className="mr-1 inline-block h-2 w-2 rounded-sm bg-warning" />
            Tentatives d’essai
          </span>
          <span>
            <i className="mr-1 inline-block h-2 w-2 rounded-sm bg-success" />
            Tentatives d’achat
          </span>
        </p>
      </section>

      <section aria-label="Détail par paramètre">
        <h2 className="mb-2 text-sm font-semibold text-on-surface">Détail</h2>
        {data.breakdowns === null ? (
          <p
            role="status"
            className="rounded-md border border-outline-variant bg-surface-container-low p-4 text-[12.5px] text-on-surface-variant"
          >
            Le détail (méthode d&apos;inscription, résultat des demandes
            d&apos;essai, formules...) apparaîtra dès que Google Analytics aura
            traité les dimensions personnalisées, en général sous 24 heures.
            Seuls les événements enregistrés après leur création sont détaillés.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {data.breakdowns.map((b) => {
              const max = Math.max(0, ...b.values.map((v) => v.events));
              return (
                <div
                  key={`${b.event}-${b.parameter}`}
                  className="rounded-md border border-outline-variant bg-surface-container-low p-4"
                >
                  <h3 className="text-[13px] font-semibold text-on-surface">
                    {b.label}
                  </h3>
                  {b.values.length === 0 ? (
                    <p className="mt-2 text-[12px] text-on-surface-variant">
                      Pas encore de données.
                    </p>
                  ) : (
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {b.values.map((v) => (
                        <li key={v.value} className="text-[12.5px]">
                          <div className="flex justify-between gap-2">
                            <span className="truncate text-on-surface">
                              {valueLabel(b.event, b.parameter, v.value)}
                            </span>
                            <span className="tabular-nums text-on-surface-variant">
                              {formatCount(v.events)}
                            </span>
                          </div>
                          <div
                            className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-surface-container-high"
                            aria-hidden="true"
                          >
                            <div
                              className="h-full rounded-full bg-primary/70"
                              style={{ width: `${barPercent(v.events, max)}%` }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <p className="text-[11px] text-on-surface-variant">
        Lu dans Google Analytics le{" "}
        {new Date(data.generatedAt).toLocaleString("fr-FR", {
          timeZone: "Europe/Paris",
        })}{" "}
        (mis en cache quelques minutes).
      </p>
    </>
  );
}
