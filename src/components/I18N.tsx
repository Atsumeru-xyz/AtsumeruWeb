import {useTranslation} from 'react-i18next';

interface I18NProps {
    children: string;
    values?: Record<string, unknown>;
}

export const I18N = ({children, values}: I18NProps) => {
    const {t} = useTranslation();
    return <>{t(children, values)}</>;
};