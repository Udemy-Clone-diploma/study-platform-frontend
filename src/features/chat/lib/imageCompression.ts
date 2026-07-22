const MAX_IMAGE_SIDE = 1920;
const IMAGE_QUALITY = 0.82;

/** Compresses an image in the browser while keeping the original when it is already smaller. */
export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || typeof createImageBitmap === "undefined") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));

    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return file;
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", IMAGE_QUALITY),
    );
    const result =
      blob && blob.size < file.size
        ? new File([blob], `${file.name.replace(/\.[^/.]+$/, "") || "photo"}.webp`, {
            type: "image/webp",
            lastModified: file.lastModified,
          })
        : file;
    canvas.width = 0;
    canvas.height = 0;
    return result;
  } catch {
    return file;
  }
}
