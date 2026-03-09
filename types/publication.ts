export interface Publication {
  id: number
  title: string
  description: string
  type: string
  date: string
  readTime: string
  author: string
  category: string
  featured: boolean
  pdfUrl?: string
  hasPreview?: boolean
  videoUrl?: string
  audioUrl?: string
}
