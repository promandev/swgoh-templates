"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { PlusIcon, SwordsIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function EmptySquads({ onCreate }: { onCreate: () => void }) {
  const t = useTranslations("Squads.empty");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="glass mx-auto flex max-w-xl flex-col items-center justify-center gap-4 rounded-3xl px-6 py-16 text-center"
    >
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/12 text-primary">
        <SwordsIcon className="size-7" aria-hidden />
      </span>
      <h2 className="text-xl font-semibold tracking-tight">{t("title")}</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {t("description")}
      </p>
      <Button size="lg" onClick={onCreate}>
        <PlusIcon className="size-4" />
        {t("cta")}
      </Button>
    </motion.div>
  );
}
