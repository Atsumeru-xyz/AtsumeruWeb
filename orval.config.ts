import { defineConfig } from 'orval';

export default defineConfig({
    atsumeru: {
        input: './src/api/atsumeru-openapi.json',
        output: {
            mode: 'tags-split',
            target: './src/api/generated',
            schemas: './src/api/model',
            client: 'react-query',
            override: {
                mutator: {
                    path: './src/api/custom-instance.ts',
                    name: 'customInstance',
                },
            },
        },
    },
});