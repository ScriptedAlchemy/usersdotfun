import { createFileRoute } from '@tanstack/react-router'
import { ModeToggle } from '~/components/mode-toggle'
import { Button } from '~/components/ui/button'
export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="p-2">
      <ModeToggle />
      <Button>click me</Button>
      <h3>Welcome Home!!!</h3>
    </div>
  )
}
