/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_EMAIL_PROVIDER?: 'api' | 'console'
	readonly VITE_EMAIL_API_BASE_URL?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
