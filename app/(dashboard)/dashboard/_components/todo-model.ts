/** `GET /v1/admin/todo`. `null` = that count could not be read (never shown as 0). */
export interface TodoResponse {
  kycPeople: number | null;
  trialRequests: number | null;
  readyWithoutAccess: number | null;
  reports: number | null;
  disputes: number | null;
  catalogClaims: number | null;
}

export interface TodoItem {
  key: keyof TodoResponse;
  label: string;
  /** What the number means, in a few words. */
  hint: string;
  href: string;
  count: number;
}

/** Order = priority: a person waiting on us comes before housekeeping. */
const QUEUES: {
  key: keyof TodoResponse;
  label: string;
  hint: string;
  href: string;
}[] = [
  {
    key: "kycPeople",
    label: "Vérifications KYC",
    hint: "personnes avec des pièces à vérifier",
    href: "/kyc",
  },
  {
    key: "trialRequests",
    label: "Demandes d’essai offert",
    hint: "vendeurs qui attendent une réponse",
    href: "/seller-activation?view=pending",
  },
  {
    key: "readyWithoutAccess",
    label: "Vendeurs prêts sans accès",
    hint: "inscription terminée, pas encore d’accès",
    href: "/seller-activation?view=ready",
  },
  {
    key: "disputes",
    label: "Litiges ouverts",
    hint: "à traiter",
    href: "/disputes",
  },
  {
    key: "catalogClaims",
    label: "Réclamations catalogue",
    hint: "à traiter",
    href: "/catalog-claims",
  },
  {
    key: "reports",
    label: "Signalements",
    hint: "en attente de décision",
    href: "/reports",
  },
];

export interface TodoView {
  /** Queues with something to do, in priority order. */
  items: TodoItem[];
  /** Labels of the queues whose count could not be read. */
  unavailable: string[];
  /** True only when every count was read and nothing is waiting: the one case that may say "all clear". */
  allClear: boolean;
}

/** Only what needs doing is listed; a count that failed is reported apart, never as "nothing to do". */
export function todoView(data: TodoResponse): TodoView {
  const items: TodoItem[] = [];
  const unavailable: string[] = [];
  for (const q of QUEUES) {
    const count = data[q.key];
    if (count === null || count === undefined) unavailable.push(q.label);
    else if (count > 0) items.push({ ...q, count });
  }
  return {
    items,
    unavailable,
    allClear: items.length === 0 && unavailable.length === 0,
  };
}
