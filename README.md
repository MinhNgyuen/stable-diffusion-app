## Stable diffusion app

A stable diffusion launcher for your computer no matter what operating system or gpu you have.

<img width="1181" alt="image" src="https://github.com/MinhNgyuen/stable-diffusion-app/assets/8717105/25c857cc-bad7-4a2e-b811-f1c8bcc308d4">

It's not clear which stable diffusion project is compatible with your computer or how to install it.

This project aims to make stable diffusion dead simple to use no matter what computer you own.

Right now, we can only launch stable diffusion web ui for Windows computers with Nvidia gpus.

The goal is to support stable diffusion on Windows, Linux, Mac running on CPU or GPU (Nvidia, AMD, Intel Arc)


## Starting Development

Start the app in the `dev` environment:

```bash
npm run dev
```

If you are looking to contribute, start reading the code at the following files

- frontend: src/renderer/App.tsx
- backend: src/main/main.ts

## Packaging for Production

To package apps for the local platform:

```bash
npm run build
npm run dist
```
