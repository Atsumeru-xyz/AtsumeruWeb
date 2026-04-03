import {IconEraser, IconEye, IconEyeOff, IconGridDots, IconQuestionMark, IconSquareHalf} from '@tabler/icons-react';
import type {ReactNode} from "react";
import {I18N} from '../components/I18N';

export const CensorshipType = {
    UNKNOWN: 'UNKNOWN',
    CENSORED: 'CENSORED',
    UNCENSORED: 'UNCENSORED',
    DECENSORED: 'DECENSORED',
    PARTIALLY_CENSORED: 'PARTIALLY_CENSORED',
    MOSAIC_CENSORSHIP: 'MOSAIC_CENSORSHIP',
} as const;

export type Censorship = keyof typeof CensorshipType;

// eslint-disable-next-line react-refresh/only-export-components
export const BOOK_CENSORSHIP_CONFIG: Record<Censorship, {
    label: ReactNode;
    color: string;
    icon: React.FC<any>
}> = {
    UNKNOWN: {label: <I18N>censorship_unknown</I18N>, color: 'gray', icon: IconQuestionMark},
    CENSORED: {label: <I18N>censorship_censored</I18N>, color: 'red', icon: IconEyeOff},
    UNCENSORED: {label: <I18N>censorship_uncensored</I18N>, color: 'green', icon: IconEye},
    DECENSORED: {label: <I18N>censorship_decensored</I18N>, color: 'blue', icon: IconEraser},
    PARTIALLY_CENSORED: {label: <I18N>censorship_partially</I18N>, color: 'yellow', icon: IconSquareHalf},
    MOSAIC_CENSORSHIP: {label: <I18N>censorship_mosaic</I18N>, color: 'violet', icon: IconGridDots},
};