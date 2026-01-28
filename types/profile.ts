export interface User {
  id: string
  email: string
  name?: string
  age?: number
  bio?: string
  contactInfo?: string
  isMale?: boolean
  image?: string
  personalityQuizResult?: Record<string, unknown> | null
  createdAt?: string
  updatedAt?: string
}
