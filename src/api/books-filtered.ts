import {customInstance} from './custom-instance';
import type {Filters} from './model/filters';
import type {IBaseBookItem} from './model/iBaseBookItem';

export const fetchFiltersList = async (params?: {
  type?: string;
  category?: string;
  presentation?: string;
}): Promise<Filters[]> => {
  const normalizedParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined) {
      normalizedParams.append(key, value.toString());
    }
  });
  const qs = normalizedParams.toString();
  const url = qs ? `/api/v1/books/filters?${qs}` : `/api/v1/books/filters`;
  return customInstance<Filters[]>(url, {method: 'GET'});
};

export interface FilteredBooksParams {
  type?: string;
  category?: string;
  presentation?: string;
  search?: string;
  sort?: string;
  asc?: boolean;
  status?: string;
  translation_status?: string;
  plot_type?: string;
  censorship?: string;
  color?: string;
  age_rating?: string;
  authors?: string;
  authors_mode?: string;
  artists?: string;
  artists_mode?: string;
  publishers?: string;
  publishers_mode?: string;
  translators?: string;
  translators_mode?: string;
  genres?: string;
  genres_mode?: string;
  tags?: string;
  tags_mode?: string;
  countries?: string;
  countries_mode?: string;
  languages?: string;
  languages_mode?: string;
  events?: string;
  event_mode?: string;
  characters?: string;
  characters_mode?: string;
  series?: string;
  series_mode?: string;
  parodies?: string;
  parodies_mode?: string;
  circles?: string;
  circles_mode?: string;
  magazines?: string;
  magazines_mode?: string;
  years?: string;
  page?: number;
  limit?: number;
  with_volumes?: boolean;
  with_chapters?: boolean;
}

export const fetchFilteredBooks = async (params?: FilteredBooksParams): Promise<IBaseBookItem[]> => {
  const normalizedParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      normalizedParams.append(key, value.toString());
    }
  });
  const qs = normalizedParams.toString();
  const url = qs ? `/api/v1/books/filtered?${qs}` : `/api/v1/books/filtered`;
  return customInstance<IBaseBookItem[]>(url, {method: 'GET'});
};
