import './index.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { AuthProvider } from './hooks/useAuth'
import { routeTree } from './routeTree.gen'

// Create router with file-based routes
const router = createRouter({
  routeTree,
  history: createBrowserHistory(),
  context: {
    auth: { user: null, token: null, loading: true },
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
