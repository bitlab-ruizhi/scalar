import { serve } from '@hono/node-server'
import specification from '@scalar/galaxy/latest.yaml?raw'

import { createMockServer } from '../src/createMockServer'

const port = process.env.PORT || 5052

// Create the server instance
const app = await createMockServer({
  specification,
  onRequest: ({ context }) => {
    console.log(`${context.req.method} ${context.req.url}`)
  },
})

// Start the server
serve(
  {
    fetch: app.fetch,
    port: Number(port),
    hostname: '0.0.0.0',
  },
  (info) => {
    console.log()
    console.log(`🚧 Mock Server listening on http://0.0.0.0:${info.port}`)
    console.log()
  },
)
