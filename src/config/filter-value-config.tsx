import React from 'react';
import {I18N} from '../components/I18N';
import {BOOK_STATUS_CONFIG} from './book-status-config';
import {BOOK_CONTENT_TYPE_CONFIG} from './book-content-type-config';
import {BOOK_CENSORSHIP_CONFIG} from './book-censorship-config';
import {BOOK_GENRE_CONFIG} from './book-genre-config';
import type {BookStatus} from './book-status-config';
import type {ReadableContentType} from './book-content-type-config';
import type {Censorship} from './book-censorship-config';
import type {GenreOrdinalStr} from './book-genre-config';

const TRANSLATION_STATUS_LABELS: Record<string, React.ReactNode> = {
    UNKNOWN: <I18N>translation_status_unknown</I18N>,
    ONGOING: <I18N>translation_status_ongoing</I18N>,
    COMPLETE: <I18N>translation_status_complete</I18N>,
    ON_HOLD: <I18N>translation_status_on_hold</I18N>,
    DROPPED: <I18N>translation_status_dropped</I18N>,
};

const PLOT_TYPE_LABELS: Record<string, React.ReactNode> = {
    UNKNOWN: <I18N>plot_type_unknown</I18N>,
    MAIN_STORY: <I18N>plot_type_main_story</I18N>,
    ALTERNATIVE_STORY: <I18N>plot_type_alternative_story</I18N>,
    PREQUEL: <I18N>plot_type_prequel</I18N>,
    INTERQUEL: <I18N>plot_type_interquel</I18N>,
    SEQUEL: <I18N>plot_type_sequel</I18N>,
    THREEQUEL: <I18N>plot_type_threequel</I18N>,
    QUADRIQUEL: <I18N>plot_type_quadriquel</I18N>,
    MIDQUEL: <I18N>plot_type_midquel</I18N>,
    PARALLELQUEL: <I18N>plot_type_parallelquel</I18N>,
    REQUEL: <I18N>plot_type_requel</I18N>,
    ADAPTATION: <I18N>plot_type_adaptation</I18N>,
    SPIN_OFF: <I18N>plot_type_spin_off</I18N>,
    CROSSOVER: <I18N>plot_type_crossover</I18N>,
    COMMON_CHARACTER: <I18N>plot_type_common_character</I18N>,
    COLORED: <I18N>plot_type_colored</I18N>,
    OTHER: <I18N>plot_type_other</I18N>,
};

const COLOR_LABELS: Record<string, React.ReactNode> = {
    UNKNOWN: <I18N>color_unknown</I18N>,
    MONOCHROME: <I18N>color_monochrome</I18N>,
    PARTIALLY_COLORED: <I18N>color_partially_colored</I18N>,
    FULL_COLOR: <I18N>color_full_color</I18N>,
    COLORED: <I18N>color_colored</I18N>,
};

const AGE_RATING_LABELS: Record<string, React.ReactNode> = {
    UNKNOWN: <I18N>age_rating_unknown</I18N>,
    EVERYONE: <I18N>age_rating_everyone</I18N>,
    EVERYONE_TEN_PLUS: <I18N>age_rating_everyone_ten_plus</I18N>,
    TEEN: <I18N>age_rating_teen</I18N>,
    MATURE: <I18N>age_rating_mature</I18N>,
    ADULTS_ONLY: <I18N>age_rating_adults_only</I18N>,
};

export const ENUM_FILTER_IDS = ['status', 'type', 'translation_status', 'plot_type', 'censorship', 'color', 'age_rating', 'genres'];

export const getFilterValueLabel = (filterId: string, value: string): React.ReactNode => {
    switch (filterId) {
        case 'status':
            return BOOK_STATUS_CONFIG[value as BookStatus]?.label ?? value;
        case 'type':
            return BOOK_CONTENT_TYPE_CONFIG[value as ReadableContentType]?.label ?? value;
        case 'censorship':
            return BOOK_CENSORSHIP_CONFIG[value as Censorship]?.label ?? value;
        case 'translation_status':
            return TRANSLATION_STATUS_LABELS[value] ?? value;
        case 'plot_type':
            return PLOT_TYPE_LABELS[value] ?? value;
        case 'color':
            return COLOR_LABELS[value] ?? value;
        case 'age_rating':
            return AGE_RATING_LABELS[value] ?? value;
        case 'genres':
            return BOOK_GENRE_CONFIG[value as GenreOrdinalStr]?.label ?? value;
        default:
            return value;
    }
};
