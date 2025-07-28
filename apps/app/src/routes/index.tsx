import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ModeToggle } from '~/components/mode-toggle'
import { Button } from '~/components/ui/button'
import { useSession, signIn, signOut } from '~/lib/auth-client'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { data: session, isPending } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  const handleAnonymousSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn.anonymous()
    } catch (error) {
      console.error('Anonymous sign in failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isPending) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Welcome!</h1>
        <ModeToggle />
      </div>

      {session?.user ? (
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-semibold mb-2">
              {session.user.isAnonymous ? "Anonymous User" : "Signed In"}
            </h2>
            <div className="space-y-2 text-sm">
              <p><strong>Name:</strong> {session.user.name}</p>
              <p><strong>ID:</strong> {session.user.id}</p>
              {session.user.isAnonymous && (
                <p className="text-muted-foreground">You're browsing anonymously</p>
              )}
            </div>
          </div>
          <Button 
            onClick={handleSignOut} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Signing out...' : 'Sign Out'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p>Get started without providing any personal information:</p>
          <Button 
            onClick={handleAnonymousSignIn} 
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Continue Anonymously'}
          </Button>
        </div>
      )}
    </div>
  )
}
