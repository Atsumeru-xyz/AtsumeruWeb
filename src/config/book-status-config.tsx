import {
    IconActivity,
    IconBook,
    IconCalendarEvent,
    IconCheck,
    IconPlayerPause,
    IconQuestionMark,
    IconX
} from '@tabler/icons-react';
import {IBaseBookItemStatus} from '../api/model';
import {I18N} from "../components/I18N.tsx";
import type {ReactNode} from "react";

export type BookStatus = keyof typeof IBaseBookItemStatus;

// OVA and ONA never used by server!
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const BOOK_STATUS_CONFIG: Record<BookStatus, {
    label: ReactNode;
    color: string;
    icon: React.FC<any>
}> = {
   ONGOING: {label: <I18N>status_ongoing</I18N>, color: 'blue', icon: IconActivity},
   COMPLETE: {label: <I18N>status_complete</I18N>, color: 'green', icon: IconCheck},
   SINGLE: {label: <I18N>status_single</I18N>, color: 'teal', icon: IconBook},
   LICENSED: {label: <I18N>status_licensed</I18N>, color: 'violet', icon: IconBook},
   ANNOUNCEMENT: {label: <I18N>status_announcement</I18N>, color: 'yellow', icon: IconCalendarEvent},
   ON_HOLD: {label: <I18N>status_on_hold</I18N>, color: 'orange', icon: IconPlayerPause},
   CANCELED: {label: <I18N>status_canceled</I18N>, color: 'red', icon: IconX},
   UNKNOWN: {label: <I18N>status_unknown</I18N>, color: 'gray', icon: IconQuestionMark},
   EMPTY: {label: <I18N>status_empty</I18N>, color: 'gray', icon: IconQuestionMark},
   NOT_RELEASED: {label: <I18N>status_not_released</I18N>, color: 'gray', icon: IconCalendarEvent},
   ANTHOLOGY: {label: <I18N>status_anthology</I18N>, color: 'cyan', icon: IconBook},
   MAGAZINE: {label: <I18N>status_magazine</I18N>, color: 'pink', icon: IconBook},
};