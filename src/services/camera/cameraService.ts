/**
 * Camera & gallery capture with client-side compression before local storage.
 */
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { fileService } from '../filesystem/fileService';
import { webCamera } from './webCamera';

/** Thrown when the user dismisses a capture UI without taking a photo. */
export class CaptureCancelled extends Error {
  constructor() {
    super('Capture cancelled');
    this.name = 'CaptureCancelled';
  }
}

export interface CapturedImage {
  path: string;      // stored local path in SQLite
  dataUrl: string;   // in-memory preview
}

/** Downscale + JPEG-compress a dataURL in a canvas. Keeps files small. */
export async function compressDataUrl(
  dataUrl: string,
  maxDimension = 1280,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxDimension) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else if (height >= width && height > maxDimension) {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export const cameraService = {
  async capture(source: CameraSource, quality = 0.7, maxDim = 1280): Promise<CapturedImage> {
    let raw: string;

    // In the browser the Capacitor plugin falls back to a file picker for
    // "camera", so use a real getUserMedia capture when one is available.
    if (
      Capacitor.getPlatform() === 'web' &&
      source === CameraSource.Camera &&
      webCamera.isAvailable()
    ) {
      const shot = await webCamera.capture();
      if (!shot) throw new CaptureCancelled();
      raw = shot;
    } else {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source,
        quality: 80,
        correctOrientation: true,
        width: 1600,
      });
      raw = photo.dataUrl ?? '';
    }
    const compressed = await compressDataUrl(raw, maxDim, quality);
    const fileName = `img_${Date.now()}_${Math.floor(Math.random() * 1e4)}.jpg`;
    const path = await fileService.saveImage(compressed, fileName);
    return { path, dataUrl: compressed };
  },

  takePhoto: (quality?: number, maxDim?: number) =>
    cameraService.capture(CameraSource.Camera, quality, maxDim),

  pickFromGallery: (quality?: number, maxDim?: number) =>
    cameraService.capture(CameraSource.Photos, quality, maxDim),
};
