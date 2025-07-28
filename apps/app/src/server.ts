import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'
import { createRouter } from './router'
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient()
 
export default createStartHandler({
  createRouter: () => createRouter(queryClient),
})(defaultStreamHandler)
