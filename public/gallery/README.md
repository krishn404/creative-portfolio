# Dome gallery collection

Put the 365 original JPGs in this directory. Keep the originals intact. The current six portfolio samples are named `1.jpg` through `6.jpg`; the remaining local slots use zero-padded names such as `007.jpg` through `365.jpg`.

Run `npm run gallery:optimize` to create separate WebP derivatives under `tiny/`, `320/`, `640/`, and `960/`. The optimizer skips missing originals and reports every missing filename. Once all 365 JPGs are present, it generates all variants. The gallery requests only the tiny and screen-appropriate variant for its visible tile window. It fetches an original JPG only after that frame is opened in the fullscreen viewer.

For object storage or a CDN, set `NEXT_PUBLIC_GALLERY_IMAGE_BASE_URL` to the public gallery prefix. Keep the same relative paths: `{id}.jpg` for originals and `{variant}/{id}.webp` for derivatives. Allow anonymous GET requests and set permissive CORS headers for the gallery origin so WebGL can upload the fetched images to its texture atlas. The configured prefix is the only storage-provider detail used by the manifest and renderer.
