import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DEFAULT_LOCALE, getPreferredLocale } from "@/lib/i18n";

export default async function Home() {
  const headerStore = await headers();
  const locale =
    getPreferredLocale(headerStore.get("accept-language")) ?? DEFAULT_LOCALE;

  redirect(`/${locale}`);
}
