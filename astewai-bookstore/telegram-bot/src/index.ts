import { AstewaiBot } from './bot'
import { config } from './config'

async function main() {
  console.log('🚀 Astewai Telegram Bot Starting...')
  console.log(`Environment: ${config.nodeEnv}`)
  console.log(`Website API: ${config.websiteApiUrl}`)
  
  const bot = new AstewaiBot()
  await bot.start()
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

// Start the bot
main().catch((error) => {
  console.error('❌ Failed to start bot:', error)
  process.exit(1)
})