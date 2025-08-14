interface TelegramMessage {
  chat_id: number
  text: string
  parse_mode?: 'Markdown' | 'HTML'
}

interface TelegramPhoto {
  chat_id: number
  photo: string
  caption?: string
  parse_mode?: 'Markdown' | 'HTML'
}

export class TelegramService {
  constructor(private botToken: string) {}

  async sendMessage(chatId: number, text: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'Markdown'
        } as TelegramMessage),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to send Telegram message:', errorText)
        return { success: false, error: errorText }
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error sending Telegram message:', errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  async sendPhoto(chatId: number, photoUrl: string, caption?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendPhoto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          photo: photoUrl,
          caption: caption,
          parse_mode: 'Markdown'
        } as TelegramPhoto),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to send Telegram photo:', errorText)
        return { success: false, error: errorText }
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error sending Telegram photo:', errorMessage)
      return { success: false, error: errorMessage }
    }
  }
}