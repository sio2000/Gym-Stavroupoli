import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { SplashScreen } from '@capacitor/splash-screen'
import { Capacitor } from '@capacitor/core'
import App from './App.tsx'
import './index.css'
import { initCapacitor } from './capacitor-app'

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui', background: '#111827', color: '#fff', minHeight: '100vh' }}>
          <h1 style={{ fontSize: 20, marginBottom: 12 }}>GetFit — startup error</h1>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 14, opacity: 0.9 }}>{this.state.error.message}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

void initCapacitor()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </RootErrorBoundary>
  </React.StrictMode>,
)

if (Capacitor.isNativePlatform()) {
  requestAnimationFrame(() => {
    void SplashScreen.hide()
  })
}
