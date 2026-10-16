function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

/** Client settings from Vite env (`VITE_*`). See `.env.example`. */
export const appConfig = {
  pagination: {
    defaultPageSize: readPositiveInt(import.meta.env.VITE_DEFAULT_PAGE_SIZE, 10),
    historyPageSize: readPositiveInt(
      import.meta.env.VITE_HISTORY_PAGE_SIZE,
      readPositiveInt(import.meta.env.VITE_DEFAULT_PAGE_SIZE, 10),
    ),
  },
};
