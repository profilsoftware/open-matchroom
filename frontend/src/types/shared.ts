/**
 * Cross-cutting wire types. The backend uses `djangorestframework-camel-case`,
 * so every shape here mirrors the camelCased JSON verbatim — there is no
 * client-side case conversion.
 */

/** DRF page envelope (DefaultPagination — 24/page, `?page=` / `?page_size=`). */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
