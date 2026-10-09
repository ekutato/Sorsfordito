// Megosztás: az APK-ban (Capacitor) a telefon saját megosztó felülete, böngészőben a Web Share API,
// ha egyik sincs, letöltés. Az Android WebView nem ismeri a navigator.share-t, ezért kell a natív út.
import { Capacitor } from '@capacitor/core';

export type ShareResult = 'shared' | 'cancelled' | 'downloaded' | 'failed';

const toBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
  r.onerror = () => reject(r.error);
  r.readAsDataURL(blob);
});

const isCancel = (e: unknown) => /cancel|abort/i.test(String((e as Error)?.name ?? '') + String((e as Error)?.message ?? e));

export async function shareImage(blob: Blob, fileName: string, title: string, text: string): Promise<ShareResult> {
  try {
    if (Capacitor.isNativePlatform()) {
      const [{ Filesystem, Directory }, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')]);
      const { uri } = await Filesystem.writeFile({ path: fileName, data: await toBase64(blob), directory: Directory.Cache });
      await Share.share({ title, text, files: [uri], dialogTitle: 'Eredmény megosztása' });
      return 'shared';
    }
    const file = new File([blob], fileName, { type: blob.type || 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title, text, files: [file] });
      return 'shared';
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return 'downloaded';
  } catch (e) {
    return isCancel(e) ? 'cancelled' : 'failed';
  }
}
