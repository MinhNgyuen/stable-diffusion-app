## Starting Development

Start the app in the `dev` environment:

```bash
npm start
```

## Packaging for Production

To package apps for the local platform:

```bash
npm run build
npm pack
npm run dist
ii C:\Users\minhi\Documents\projects\stable-diffusion-app\release\build
signtool sign /debug /n "Minh Nguyen" /t http://time.certum.pl/ /fd sha256 /v 'C:\Users\minhi\Documents\projects\stable-diffusion-app\release\build\Stable Diffusion App Installer.msi'
signtool verify /pa 'C:\Users\minhi\Documents\projects\stable-diffusion-app\release\build\Stable Diffusion App Installer.msi'
```
