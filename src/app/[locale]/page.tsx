import { setRequestLocale } from "next-intl/server";

import { AppFooter } from "@/components/layout/app-footer";
import { AppHeader } from "@/components/layout/app-header";
import { SquadBuilderApp } from "@/features/squads/components/squad-builder-app";
import type { Locale } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-[120rem] flex-1 px-4 py-3 sm:px-6 lg:px-8">
        <SquadBuilderApp />
      </main>
      <AppFooter />
    </div>
  );
}
