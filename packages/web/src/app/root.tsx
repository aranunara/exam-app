import { RouterProvider } from 'react-router'
import { Providers } from './providers'
import { router } from './router'

export function Root() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  )
}
