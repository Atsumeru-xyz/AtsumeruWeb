import {
    IconBook,
    IconBooks,
    IconDeviceMobile,
    IconFileText,
    IconFlame,
    IconHeart,
    IconLayoutList,
    IconMessageCircle2,
    IconNotebook,
    IconQuestionMark
} from '@tabler/icons-react';
import {IBaseBookItemContentType} from '../api/model';
import type {ReactNode} from "react";
import {I18N} from "../components/I18N.tsx";

export type ReadableContentType = Extract<keyof typeof IBaseBookItemContentType,
    | 'UNKNOWN'
    | 'MANGA'
    | 'MANHUA'
    | 'MANHWA'
    | 'DOUJINSHI'
    | 'HENTAI_MANGA'
    | 'YAOI'
    | 'YAOI_MANGA'
    | 'WEBCOMICS'
    | 'RUMANGA'
    | 'OEL_MANGA'
    | 'STRIP'
    | 'COMICS'
    | 'YURI'
    | 'YURI_MANGA'
    | 'HENTAI_MANHWA'
    | 'LIGHT_NOVEL'
    | 'NOVEL'
    | 'BOOK'
>;

export const BOOK_CONTENT_TYPE_CONFIG: Record<ReadableContentType, {
    label: ReactNode;
    color: string;
    icon: React.FC<any>
}> = {
    UNKNOWN: {label: <I18N>content_type_unknown</I18N>, color: 'gray', icon: IconQuestionMark},

    MANGA: {label: <I18N>content_type_manga</I18N>, color: 'blue', icon: IconBook},
    MANHWA: {label: <I18N>content_type_manhwa</I18N>, color: 'teal', icon: IconBook},
    MANHUA: {label: <I18N>content_type_manhua</I18N>, color: 'red', icon: IconBook},

    WEBCOMICS: {label: <I18N>content_type_webcomics</I18N>, color: 'green', icon: IconDeviceMobile},
    STRIP: {label: <I18N>content_type_strip</I18N>, color: 'orange', icon: IconLayoutList},
    COMICS: {label: <I18N>content_type_comics</I18N>, color: 'yellow', icon: IconMessageCircle2},
    DOUJINSHI: {label: <I18N>content_type_doujinshi</I18N>, color: 'violet', icon: IconBooks},
    RUMANGA: {label: <I18N>content_type_rumanga</I18N>, color: 'cyan', icon: IconBook},
    OEL_MANGA: {label: <I18N>content_type_oel_manga</I18N>, color: 'indigo', icon: IconBook},

    YAOI: {label: <I18N>content_type_yaoi</I18N>, color: 'indigo', icon: IconHeart},
    YAOI_MANGA: {label: <I18N>content_type_yaoi_manga</I18N>, color: 'indigo', icon: IconHeart},
    YURI: {label: <I18N>content_type_yuri</I18N>, color: 'pink', icon: IconHeart},
    YURI_MANGA: {label: <I18N>content_type_yuri_manga</I18N>, color: 'pink', icon: IconHeart},

    HENTAI_MANGA: {label: <I18N>content_type_hentai_manga</I18N>, color: 'red', icon: IconFlame},
    HENTAI_MANHWA: {label: <I18N>content_type_hentai_manhwa</I18N>, color: 'red', icon: IconFlame},

    LIGHT_NOVEL: {label: <I18N>content_type_light_novel</I18N>, color: 'violet', icon: IconNotebook},
    NOVEL: {label: <I18N>content_type_novel</I18N>, color: 'blue', icon: IconFileText},
    BOOK: {label: <I18N>content_type_book</I18N>, color: 'gray', icon: IconBook},
};