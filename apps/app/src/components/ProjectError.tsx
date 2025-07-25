import { ErrorComponent, ErrorComponentProps } from '@tanstack/react-router'

export function ProjectErrorComponent({ error }: ErrorComponentProps) {
  return <ErrorComponent error={error} />
}
