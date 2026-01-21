import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export async function convertImageToBase64(url: string): Promise<string> {
    if (!url) return '';
    try {
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (proxyError) {
        console.warn('Proxy failed, trying direct fetch:', proxyError);
        try {
            // Fallback: try direct fetch (works if CORS is configured on source)
            const response = await fetch(url);
            if (!response.ok) throw new Error('Direct fetch failed');
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (directError) {
            console.error('All image fetch attempts failed:', directError, 'URL:', url);
            return '';
        }
    }
}
