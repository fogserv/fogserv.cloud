import { createFileRoute } from '@tanstack/react-router'

function VaultPage() {
  return (
    <iframe
      src="/apps/vault.html"
      className="w-full h-screen border-0"
      title="Password Vault"
    />
  )
}

export const Route = createFileRoute('/vault')({
  component: VaultPage,
})
