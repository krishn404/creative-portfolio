# 365 photo dome assets

The upload service reads original JPGs from `public/365`, loads the existing server-only Cloudinary settings (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and optional `CLOUDINARY_UPLOAD_FOLDER`) through Next's environment loader, and uploads with four concurrent requests. It does not modify or delete local originals.

Run `npm run gallery:upload` after adding or changing source images. Assets use stable filename-based public IDs in `<CLOUDINARY_UPLOAD_FOLDER>/365` (or `creative-portfolio/365` by default). Existing IDs are reused, and the generated `src/data/cloudinary-gallery.json` records original JPG URLs plus 24px, 320px, 640px, and 960px automatic-format/quality delivery URLs. Cloudinary creates WebP or AVIF derivatives at request time according to browser support.

Verify the remote asset set without uploading anything with `node scripts/upload-365-to-cloudinary.mjs --verify-only`.

The current `public/365` folder contains 364 JPGs. Its accompanying Instagram metadata manifest lists 377 records, including 13 JPG filenames that are not present. The gallery therefore displays the 364 available originals until the missing source image is added.
