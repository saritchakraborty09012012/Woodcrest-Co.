import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dist = path.join(__dirname, 'dist')
const app = express()
const PORT = process.env.PORT || 4173

app.use(express.static(dist, { index: false, maxAge: '1h' }))

app.get('*', (req, res) => {
  res.sendFile(path.join(dist, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Ludgear Fence Co. running at http://localhost:${PORT}`)
})
