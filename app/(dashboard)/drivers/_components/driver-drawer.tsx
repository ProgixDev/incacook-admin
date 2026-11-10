"use client";

import { Drawer, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bike, Star, Package, CreditCard } from "lucide-react";
import { formatDateFr, formatDateTimeFr, formatNum } from "@/lib/utils";
import { ConnectReadinessBadge, ChargesEnabledBadge } from "@/components/dashboard/status-badge";
import {
  DriverStatus,
  KycStatusBadge,
  OnlineBadge,
  VEHICLE_LABEL,
  initialsOf,
  type AdminDriver,
} from "./driver-model";

export function DriverDrawer({
  driver,
  onClose,
}: {
  driver: AdminDriver | null;
  onClose: () => void;
}) {
  if (!driver) return null;

  return (
    <Drawer open onOpenChange={(o) => !o && onClose()}>
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11">
            <AvatarFallback>{initialsOf(driver.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <DialogTitle className="truncate text-lg font-semibold text-on-surface">
              {driver.name || "—"}
            </DialogTitle>
            <p className="truncate text-[13px] text-on-surface-variant">{driver.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <OnlineBadge online={driver.isOnline} />
          <KycStatusBadge status={driver.kycStatus} />
          <DriverStatus driver={driver} />
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-2">
          <Stat icon={<Bike className="h-4 w-4" />} label="Véhicule" value={driver.vehicleType ? VEHICLE_LABEL[driver.vehicleType] : "—"} />
          <Stat icon={<Package className="h-4 w-4" />} label="Livraisons" value={formatNum(driver.totalDeliveries)} />
          <Stat icon={<Star className="h-4 w-4" />} label="Note" value={driver.averageRating != null ? driver.averageRating.toFixed(1) : "—"} />
          <Stat
            icon={<CreditCard className="h-4 w-4" />}
            label="Stripe Connect"
            value={
              <div className="flex items-center gap-1.5">
                <ConnectReadinessBadge
                  stripeDetailsSubmitted={driver.stripeDetailsSubmitted}
                  stripePayoutsEnabled={driver.stripePayoutsEnabled}
                />
                <ChargesEnabledBadge stripeChargesEnabled={driver.stripeChargesEnabled} />
              </div>
            }
          />
        </div>

        <div className="rounded-md border border-outline-variant bg-surface-container-low p-3 text-[13px]">
          <Row label="Dernière activité" value={driver.lastSeenAt ? formatDateTimeFr(driver.lastSeenAt) : "—"} />
          <Row label="Inscrit le" value={formatDateFr(driver.createdAt)} />
        </div>
      </div>
    </Drawer>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-outline-variant bg-surface-container-low p-2.5">
      <div className="flex items-center gap-1.5 text-on-surface-variant">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1 text-[14px] font-semibold text-on-surface">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-on-surface-variant">{label}</span>
      <span className="text-on-surface">{value}</span>
    </div>
  );
}
