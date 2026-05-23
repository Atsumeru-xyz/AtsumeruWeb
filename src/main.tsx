import './i18n';
import './index.css';
import React from 'react'
import ReactDOM from 'react-dom/client'
import {colorsTuple, createTheme, MantineProvider} from '@mantine/core';
import {Notifications} from '@mantine/notifications';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import App from './App.tsx'

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

const queryClient = new QueryClient();

const theme = createTheme({
    colors: {
        custom: colorsTuple('#B5305F'),
        dynamic: colorsTuple(
            Array.from({length: 10}, (_, index) => '#B5305F')
        ),
    },
    primaryColor: 'custom',
    defaultRadius: 'md',
    components: {
        ScrollArea: {
            styles: {
                scrollbar: {
                    '&[data-orientation="horizontal"]': {height: 8},
                    '&[data-orientation="vertical"]': {width: 8},
                },
            },
        },
    },

});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <MantineProvider defaultColorScheme="dark" theme={theme}>
                <Notifications position="top-center" zIndex={1000}/>
                <App/>
            </MantineProvider>
        </QueryClientProvider>
    </React.StrictMode>,
)