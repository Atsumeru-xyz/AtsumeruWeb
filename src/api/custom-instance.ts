import axios, {type AxiosRequestConfig} from 'axios';
import {useAuthStore} from '../store/authStore';
import i18n from '../i18n';

export const AXIOS_INSTANCE = axios.create({
    baseURL: ''
});

AXIOS_INSTANCE.interceptors.request.use((config) => {
    const {token} = useAuthStore.getState();
    if (token) {
        config.headers.Authorization = `Basic ${token}`;
    }
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    return config;
});

AXIOS_INSTANCE.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            useAuthStore.getState().logout();

            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }

            return Promise.reject(new Error(i18n.t('login_incorrect_login_or_password')));
        }
        return Promise.reject(error);
    }
);

export const customInstance = <T>(
    url: string,
    config?: AxiosRequestConfig & { body?: unknown },
): Promise<T> => {
    const source = axios.CancelToken.source();

    const { body, ...restConfig } = config || {};

    const promise = AXIOS_INSTANCE({
        url,
        ...restConfig,
        ...(body !== undefined ? { data: body } : {}),
        cancelToken: source.token,
    }).then(({data}) => data);

    // @ts-ignore
    promise.cancel = () => {
        source.cancel('Query was cancelled');
    };

    return promise;
};

export type CustomInstance = typeof customInstance;