import {
    IconArrowBarRight,
    IconArrowForwardUp,
    IconArrowLeft,
    IconArrowRight,
    IconArrowRightCircle,
    IconArrowsCross,
    IconArrowsJoin,
    IconArrowsRight,
    IconBook,
    IconChevronsRight,
    IconDots,
    IconGitBranch,
    IconMovie,
    IconPalette,
    IconQuestionMark,
    IconRefresh,
    IconUsers
} from '@tabler/icons-react';
import {I18N} from "../components/I18N.tsx";
import type {ReactNode} from "react";

export const PlotTypeEnum = {
    UNKNOWN: 'UNKNOWN',
    MAIN_STORY: 'MAIN_STORY',
    ALTERNATIVE_STORY: 'ALTERNATIVE_STORY',
    PREQUEL: 'PREQUEL',
    INTERQUEL: 'INTERQUEL',
    SEQUEL: 'SEQUEL',
    THREEQUEL: 'THREEQUEL',
    QUADRIQUEL: 'QUADRIQUEL',
    MIDQUEL: 'MIDQUEL',
    PARALLELQUEL: 'PARALLELQUEL',
    REQUEL: 'REQUEL',
    ADAPTATION: 'ADAPTATION',
    SPIN_OFF: 'SPIN_OFF',
    CROSSOVER: 'CROSSOVER',
    COMMON_CHARACTER: 'COMMON_CHARACTER',
    COLORED: 'COLORED',
    OTHER: 'OTHER',
} as const;

export type PlotType = keyof typeof PlotTypeEnum;

// eslint-disable-next-line react-refresh/only-export-components
export const BOOK_PLOT_TYPE_CONFIG: Record<PlotType, {
    label: ReactNode;
    color: string;
    icon: React.FC<any>
}> = {
    UNKNOWN: {label: <I18N>plot_type_unknown</I18N>, color: 'gray', icon: IconQuestionMark},
    MAIN_STORY: {label: <I18N>plot_type_main_story</I18N>, color: 'blue', icon: IconBook},
    ALTERNATIVE_STORY: {label: <I18N>plot_type_alternative_story</I18N>, color: 'grape', icon: IconGitBranch},
    PREQUEL: {label: <I18N>plot_type_prequel</I18N>, color: 'teal', icon: IconArrowLeft},
    INTERQUEL: {label: <I18N>plot_type_interquel</I18N>, color: 'cyan', icon: IconArrowsJoin},
    SEQUEL: {label: <I18N>plot_type_sequel</I18N>, color: 'green', icon: IconArrowRight},
    THREEQUEL: {label: <I18N>plot_type_threequel</I18N>, color: 'lime', icon: IconChevronsRight},
    QUADRIQUEL: {label: <I18N>plot_type_quadriquel</I18N>, color: 'yellow', icon: IconArrowBarRight},
    MIDQUEL: {label: <I18N>plot_type_midquel</I18N>, color: 'orange', icon: IconArrowRightCircle},
    PARALLELQUEL: {label: <I18N>plot_type_parallelquel</I18N>, color: 'pink', icon: IconArrowsRight},
    REQUEL: {label: <I18N>plot_type_requel</I18N>, color: 'red', icon: IconRefresh},
    ADAPTATION: {label: <I18N>plot_type_adaptation</I18N>, color: 'indigo', icon: IconMovie},
    SPIN_OFF: {label: <I18N>plot_type_spin_off</I18N>, color: 'violet', icon: IconArrowForwardUp},
    CROSSOVER: {label: <I18N>plot_type_crossover</I18N>, color: 'red', icon: IconArrowsCross},
    COMMON_CHARACTER: {label: <I18N>plot_type_common_character</I18N>, color: 'cyan', icon: IconUsers},
    COLORED: {label: <I18N>plot_type_colored</I18N>, color: 'pink', icon: IconPalette},
    OTHER: {label: <I18N>plot_type_other</I18N>, color: 'gray', icon: IconDots},
};