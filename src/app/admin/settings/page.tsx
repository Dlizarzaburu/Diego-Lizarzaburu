import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/dashboard/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireRole("ADMIN");
  const settings =
    (await prisma.platformSetting.findUnique({ where: { id: "singleton" } })) ??
    (await prisma.platformSetting.create({ data: { id: "singleton" } }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white sm:text-3xl">
          Platform settings
        </h1>
        <p className="text-sm text-slate-400">
          Configure platform and processing fees.
        </p>
      </div>
      <SettingsForm
        platformFeeBps={settings.platformFeeBps}
        processingFeeBps={settings.processingFeeBps}
        processingFeeFixedCents={settings.processingFeeFixedCents}
      />
    </div>
  );
}
