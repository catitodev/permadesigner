import { getRequestConfig } from "next-intl/server";

export const locales = ["pt-BR", "en", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "pt-BR";

export default getRequestConfig(async () => {
  // For now, default to pt-BR. When we add locale persistence (T52),
  // this will read from the user's cookie/preference.
  const locale = defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
