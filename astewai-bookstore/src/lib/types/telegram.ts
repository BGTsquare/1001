/**
 * Telegram Bot API type definitions
 */

export interface TelegramUser {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

export interface TelegramChat {
  id: number
  type: 'private' | 'group' | 'supergroup' | 'channel'
  title?: string
  username?: string
  first_name?: string
  last_name?: string
  description?: string
}

export interface TelegramPhotoSize {
  file_id: string
  file_unique_id: string
  width: number
  height: number
  file_size?: number
}

export interface TelegramDocument {
  file_id: string
  file_unique_id: string
  file_name?: string
  mime_type?: string
  file_size?: number
  thumbnail?: TelegramPhotoSize
}

export interface TelegramMessage {
  message_id: number
  from?: TelegramUser
  sender_chat?: TelegramChat
  date: number
  chat: TelegramChat
  forward_from?: TelegramUser
  forward_from_chat?: TelegramChat
  forward_from_message_id?: number
  forward_signature?: string
  forward_sender_name?: string
  forward_date?: number
  reply_to_message?: TelegramMessage
  via_bot?: TelegramUser
  edit_date?: number
  media_group_id?: string
  author_signature?: string
  text?: string
  entities?: TelegramMessageEntity[]
  caption_entities?: TelegramMessageEntity[]
  audio?: TelegramAudio
  document?: TelegramDocument
  animation?: TelegramAnimation
  game?: TelegramGame
  photo?: TelegramPhotoSize[]
  sticker?: TelegramSticker
  video?: TelegramVideo
  voice?: TelegramVoice
  video_note?: TelegramVideoNote
  caption?: string
  contact?: TelegramContact
  location?: TelegramLocation
  venue?: TelegramVenue
  poll?: TelegramPoll
  dice?: TelegramDice
  new_chat_members?: TelegramUser[]
  left_chat_member?: TelegramUser
  new_chat_title?: string
  new_chat_photo?: TelegramPhotoSize[]
  delete_chat_photo?: boolean
  group_chat_created?: boolean
  supergroup_chat_created?: boolean
  channel_chat_created?: boolean
  migrate_to_chat_id?: number
  migrate_from_chat_id?: number
  pinned_message?: TelegramMessage
  invoice?: TelegramInvoice
  successful_payment?: TelegramSuccessfulPayment
  connected_website?: string
  passport_data?: TelegramPassportData
  proximity_alert_triggered?: TelegramProximityAlertTriggered
  voice_chat_scheduled?: TelegramVoiceChatScheduled
  voice_chat_started?: TelegramVoiceChatStarted
  voice_chat_ended?: TelegramVoiceChatEnded
  voice_chat_participants_invited?: TelegramVoiceChatParticipantsInvited
  reply_markup?: TelegramInlineKeyboardMarkup
}

export interface TelegramMessageEntity {
  type: string
  offset: number
  length: number
  url?: string
  user?: TelegramUser
  language?: string
}

export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
  edited_message?: TelegramMessage
  channel_post?: TelegramMessage
  edited_channel_post?: TelegramMessage
  inline_query?: TelegramInlineQuery
  chosen_inline_result?: TelegramChosenInlineResult
  callback_query?: TelegramCallbackQuery
  shipping_query?: TelegramShippingQuery
  pre_checkout_query?: TelegramPreCheckoutQuery
  poll?: TelegramPoll
  poll_answer?: TelegramPollAnswer
  my_chat_member?: TelegramChatMemberUpdated
  chat_member?: TelegramChatMemberUpdated
  chat_join_request?: TelegramChatJoinRequest
}

// Additional interfaces for completeness (can be expanded as needed)
export interface TelegramAudio {
  file_id: string
  file_unique_id: string
  duration: number
  performer?: string
  title?: string
  file_name?: string
  mime_type?: string
  file_size?: number
  thumbnail?: TelegramPhotoSize
}

export interface TelegramAnimation {
  file_id: string
  file_unique_id: string
  width: number
  height: number
  duration: number
  thumbnail?: TelegramPhotoSize
  file_name?: string
  mime_type?: string
  file_size?: number
}

export interface TelegramGame {
  title: string
  description: string
  photo: TelegramPhotoSize[]
  text?: string
  text_entities?: TelegramMessageEntity[]
  animation?: TelegramAnimation
}

export interface TelegramSticker {
  file_id: string
  file_unique_id: string
  width: number
  height: number
  is_animated: boolean
  is_video: boolean
  thumbnail?: TelegramPhotoSize
  emoji?: string
  set_name?: string
  mask_position?: TelegramMaskPosition
  file_size?: number
}

export interface TelegramVideo {
  file_id: string
  file_unique_id: string
  width: number
  height: number
  duration: number
  thumbnail?: TelegramPhotoSize
  file_name?: string
  mime_type?: string
  file_size?: number
}

export interface TelegramVoice {
  file_id: string
  file_unique_id: string
  duration: number
  mime_type?: string
  file_size?: number
}

export interface TelegramVideoNote {
  file_id: string
  file_unique_id: string
  length: number
  duration: number
  thumbnail?: TelegramPhotoSize
  file_size?: number
}

export interface TelegramContact {
  phone_number: string
  first_name: string
  last_name?: string
  user_id?: number
  vcard?: string
}

export interface TelegramLocation {
  longitude: number
  latitude: number
  horizontal_accuracy?: number
  live_period?: number
  heading?: number
  proximity_alert_radius?: number
}

export interface TelegramVenue {
  location: TelegramLocation
  title: string
  address: string
  foursquare_id?: string
  foursquare_type?: string
  google_place_id?: string
  google_place_type?: string
}

export interface TelegramPoll {
  id: string
  question: string
  options: TelegramPollOption[]
  total_voter_count: number
  is_closed: boolean
  is_anonymous: boolean
  type: string
  allows_multiple_answers: boolean
  correct_option_id?: number
  explanation?: string
  explanation_entities?: TelegramMessageEntity[]
  open_period?: number
  close_date?: number
}

export interface TelegramPollOption {
  text: string
  voter_count: number
}

export interface TelegramDice {
  emoji: string
  value: number
}

export interface TelegramInvoice {
  title: string
  description: string
  start_parameter: string
  currency: string
  total_amount: number
}

export interface TelegramSuccessfulPayment {
  currency: string
  total_amount: number
  invoice_payload: string
  shipping_option_id?: string
  order_info?: TelegramOrderInfo
  telegram_payment_charge_id: string
  provider_payment_charge_id: string
}

export interface TelegramOrderInfo {
  name?: string
  phone_number?: string
  email?: string
  shipping_address?: TelegramShippingAddress
}

export interface TelegramShippingAddress {
  country_code: string
  state: string
  city: string
  street_line1: string
  street_line2: string
  post_code: string
}

export interface TelegramPassportData {
  data: TelegramEncryptedPassportElement[]
  credentials: TelegramEncryptedCredentials
}

export interface TelegramEncryptedPassportElement {
  type: string
  data?: string
  phone_number?: string
  email?: string
  files?: TelegramPassportFile[]
  front_side?: TelegramPassportFile
  reverse_side?: TelegramPassportFile
  selfie?: TelegramPassportFile
  translation?: TelegramPassportFile[]
  hash: string
}

export interface TelegramPassportFile {
  file_id: string
  file_unique_id: string
  file_size: number
  file_date: number
}

export interface TelegramEncryptedCredentials {
  data: string
  hash: string
  secret: string
}

export interface TelegramProximityAlertTriggered {
  traveler: TelegramUser
  watcher: TelegramUser
  distance: number
}

export interface TelegramVoiceChatScheduled {
  start_date: number
}

export interface TelegramVoiceChatStarted {}

export interface TelegramVoiceChatEnded {
  duration: number
}

export interface TelegramVoiceChatParticipantsInvited {
  users: TelegramUser[]
}

export interface TelegramInlineKeyboardMarkup {
  inline_keyboard: TelegramInlineKeyboardButton[][]
}

export interface TelegramInlineKeyboardButton {
  text: string
  url?: string
  login_url?: TelegramLoginUrl
  callback_data?: string
  switch_inline_query?: string
  switch_inline_query_current_chat?: string
  callback_game?: TelegramCallbackGame
  pay?: boolean
}

export interface TelegramLoginUrl {
  url: string
  forward_text?: string
  bot_username?: string
  request_write_access?: boolean
}

export interface TelegramCallbackGame {}

export interface TelegramInlineQuery {
  id: string
  from: TelegramUser
  query: string
  offset: string
  chat_type?: string
  location?: TelegramLocation
}

export interface TelegramChosenInlineResult {
  result_id: string
  from: TelegramUser
  location?: TelegramLocation
  inline_message_id?: string
  query: string
}

export interface TelegramCallbackQuery {
  id: string
  from: TelegramUser
  message?: TelegramMessage
  inline_message_id?: string
  chat_instance: string
  data?: string
  game_short_name?: string
}

export interface TelegramShippingQuery {
  id: string
  from: TelegramUser
  invoice_payload: string
  shipping_address: TelegramShippingAddress
}

export interface TelegramPreCheckoutQuery {
  id: string
  from: TelegramUser
  currency: string
  total_amount: number
  invoice_payload: string
  shipping_option_id?: string
  order_info?: TelegramOrderInfo
}

export interface TelegramPollAnswer {
  poll_id: string
  user: TelegramUser
  option_ids: number[]
}

export interface TelegramChatMemberUpdated {
  chat: TelegramChat
  from: TelegramUser
  date: number
  old_chat_member: TelegramChatMember
  new_chat_member: TelegramChatMember
  invite_link?: TelegramChatInviteLink
}

export interface TelegramChatMember {
  status: string
  user: TelegramUser
  is_anonymous?: boolean
  custom_title?: string
  until_date?: number
  can_be_edited?: boolean
  can_post_messages?: boolean
  can_edit_messages?: boolean
  can_delete_messages?: boolean
  can_restrict_members?: boolean
  can_promote_members?: boolean
  can_change_info?: boolean
  can_invite_users?: boolean
  can_pin_messages?: boolean
  is_member?: boolean
  can_send_messages?: boolean
  can_send_media_messages?: boolean
  can_send_polls?: boolean
  can_send_other_messages?: boolean
  can_add_web_page_previews?: boolean
}

export interface TelegramChatInviteLink {
  invite_link: string
  creator: TelegramUser
  creates_join_request: boolean
  is_primary: boolean
  is_revoked: boolean
  name?: string
  expire_date?: number
  member_limit?: number
  pending_join_request_count?: number
}

export interface TelegramChatJoinRequest {
  chat: TelegramChat
  from: TelegramUser
  date: number
  bio?: string
  invite_link?: TelegramChatInviteLink
}

export interface TelegramMaskPosition {
  point: string
  x_shift: number
  y_shift: number
  scale: number
}

// Bot API response types
export interface TelegramApiResponse<T = any> {
  ok: boolean
  result?: T
  error_code?: number
  description?: string
}

// Webhook-specific types
export interface TelegramWebhookInfo {
  url: string
  has_custom_certificate: boolean
  pending_update_count: number
  ip_address?: string
  last_error_date?: number
  last_error_message?: string
  last_synchronization_error_date?: number
  max_connections?: number
  allowed_updates?: string[]
}