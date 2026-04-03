export const GetBooksSort = {
    CREATED_AT: 'CREATED_AT',
    UPDATED_AT: 'UPDATED_AT',
    TITLE: 'TITLE',
    POPULARITY: 'POPULARITY',
    YEAR: 'YEAR',
    COUNTRY: 'COUNTRY',
    LANGUAGE: 'LANGUAGE',
    PUBLISHER: 'PUBLISHER',
    SERIE: 'SERIE',
    PARODY: 'PARODY',
    VOLUMES_COUNT: 'VOLUMES_COUNT',
    SCORE: 'SCORE',
    LAST_READ: 'LAST_READ',
} as const;

export type GetBooksSortType = typeof GetBooksSort[keyof typeof GetBooksSort];