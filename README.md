## Stable diffusion app

A stable diffusion launcher for your computer no matter what operating system or gpu you have.

<img width="1181" alt="image" src="https://github.com/MinhNgyuen/stable-diffusion-app/assets/8717105/25c857cc-bad7-4a2e-b811-f1c8bcc308d4">

It's complicated to install stable diffusion web ui. Depending on what operating system or gpu you have, you need to install a different repo with different settings. Also, the manual process of installing git, python, and packages is not accessible to the average user.

This project aims to make stable diffusion dead simple to use no matter what computer you own.

Currently the project supports Windows w/ Nvidia. The goal is to support stable diffusion on Windows, Linux, Mac running on CPU or GPU (Nvidia, AMD, Intel Arc)

## Features

- Desktop application to install and launch stable diffusion web ui
- Clear environment -> wipe stable diffusion models and code from your computer
- View app data -> Easily open the file directory that contains your models and configuration files

## Starting Development

This is my first time creating, maintaining, and contributing to an open source project.
I'm open to all feedback and help. You can reach me via [discord](https://discord.gg/62VkDXtrW8)!

Start the app in the `dev` environment:

```bash
npm install
npm start
```

If you are looking to contribute, the following files are a great starting point

- frontend: src/renderer/App.tsx
- backend: src/main/main.ts

## Packaging for Production

To package apps for the local platform:

```bash
npm run build
npm run dist
```
