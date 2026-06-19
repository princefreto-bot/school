/**
 * Utilitaire de pagination par curseur côté client
 */

export interface CursorPaginationResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Pagine une liste complète d'éléments côté client en utilisant un curseur.
 * Idéal pour les données pré-chargées ou mises en cache qu'on souhaite afficher progressivement.
 * 
 * @param items Liste complète des éléments
 * @param cursorId ID du dernier élément affiché (null pour la première page)
 * @param limit Nombre d'éléments par page
 * @param idField Nom du champ servant d'ID (défaut: 'id')
 */
export function paginateByCursor<T>(
  items: T[], 
  cursorId: string | null, 
  limit: number = 20,
  idField: keyof T = 'id' as keyof T
): CursorPaginationResult<T> {
  if (!items || items.length === 0) {
    return { data: [], nextCursor: null, hasMore: false };
  }

  let startIndex = 0;

  if (cursorId) {
    const cursorIndex = items.findIndex(item => String(item[idField]) === String(cursorId));
    if (cursorIndex !== -1) {
      startIndex = cursorIndex + 1;
    }
  }

  const paginatedData = items.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < items.length;
  const nextCursor = hasMore && paginatedData.length > 0 
    ? String(paginatedData[paginatedData.length - 1][idField]) 
    : null;

  return {
    data: paginatedData,
    nextCursor,
    hasMore
  };
}
