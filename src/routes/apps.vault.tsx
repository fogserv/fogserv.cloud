import { createFileRoute } from '@tanstack/react-router'

function VaultPage() {
  return (
    <div className="min-h-screen">
      <iframe
        src="/apps/vault.html"
        className="w-full h-screen border-0"
        title="Password Vault"
      />
    </div>
  )
}

export const Route = createFileRoute('/apps/vault')({
  component: VaultPage,
})
