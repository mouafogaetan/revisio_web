/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
    MathJax?: {
      typesetClear?: (elements?: Element[]) => void
      typesetPromise?: (elements: Element[]) => Promise<void> | void
    }
    adsbygoogle?: Array<Record<string, unknown>>
  }
}

export {}