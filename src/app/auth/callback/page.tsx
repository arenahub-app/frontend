import { Suspense } from 'react'
import { OAuthCallbackClient } from './oauth-callback-client'

export default function OAuthCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense>
        <OAuthCallbackClient />
      </Suspense>
    </div>
  )
}
