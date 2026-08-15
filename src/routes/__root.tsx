import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { AuthProvider } from '../hooks/useAuth'
import { Navigation } from '../components/Navigation'
import { Footer } from '../components/Footer'

interface RouterContext {
  auth: {
    user: { id: string; email: string; name: string | null; role: string; status: string } | null
    token: string | null
    loading: boolean
  } | null
}

function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})
