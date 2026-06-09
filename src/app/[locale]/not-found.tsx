import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-6xl font-semibold tracking-tight text-muted-foreground">
        404
      </p>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="max-w-md text-muted-foreground">{t("description")}</p>
      <Button render={<Link href="/" />}>{t("back")}</Button>
    </div>
  );
}
