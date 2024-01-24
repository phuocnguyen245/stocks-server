import app from './src/app.ts'
import dotenv from 'dotenv'
dotenv.config()

const PORT = process.env.PORT || 8080

const server = app.listen(PORT, () => {
  console.log(`App running on port ${PORT}`)
})

app.on('SIGINT', () => {
  server.close(() => {
    console.log('Server shut down')
  })
})
