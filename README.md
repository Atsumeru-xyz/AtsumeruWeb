# Atsumeru Web

`WebUI` for [Atsumeru](https://github.com/Atsumeru-xyz/Atsumeru) self-hosted server with `React`+`Vite`+`TypeScript`+`Mantine`

## Development

### Requirements
`Node.js v22.22+`

### First-time configuration

Execute in project root dir to download and configure dependencies:
```shell
npm install
```

Download latest `OpenAPI` specification from your [Atsumeru](https://github.com/Atsumeru-xyz/Atsumeru) instance from [/v3/api-docs](http://127.0.0.1:31337/v3/api-docs) and save it as `atsumeru-openapi.json` in `/src/api` folder

Execute command to generate API files in `/src/api/generated` and `/src/api/model`:
```shell
npm run api:gen
```

### Starting development server

Execute in project root dir:
```shell
npm run dev
```
and open provided `Vite` local development url (eg: http://localhost:5173/)

> [!NOTE]  
> By default, Vite configured to interact with [Atsumeru](https://github.com/Atsumeru-xyz/Atsumeru) instance at http://localhost:31337  
> You can change instance url in `vite.config.ts` file

## Building

Prepare project as described in `Development` section and execute in project root dir:
```shell
npm run build
```