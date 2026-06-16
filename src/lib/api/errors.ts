import type { AxiosError } from 'axios'

export interface ApiErrorBody {
  type?: string
  title?: string
  status?: number
  detail?: string
}

export type ApiError = AxiosError<ApiErrorBody>
