import request from '@/core/utils/request';
import type { ApiResponse } from '@/core/types';
import type {
  Book,
  BookListParams,
  BookCreateParams,
  BookUpdateParams,
  AppendChapterParams,
  SetupPersonaParams,
  BookDetail,
} from '../types';

export const getBooks = (params?: BookListParams) => {
  return request.get<ApiResponse<Book[]>>('/api/v1/time-library/books', { params });
};

export const getBookDetail = (bookId: string) => {
  return request.get<ApiResponse<BookDetail>>(`/api/v1/time-library/books/${bookId}`);
};

export const addBook = (data: BookCreateParams) => {
  return request.post<ApiResponse<Book>>('/api/v1/time-library/admin/books', data);
};

export const updateBook = (bookId: string, data: BookUpdateParams) => {
  return request.put<ApiResponse<Book>>(`/api/v1/time-library/admin/books/${bookId}`, data);
};

export const deleteBook = (bookId: string) => {
  return request.delete<ApiResponse<any>>(`/api/v1/time-library/admin/books/${bookId}`);
};

export const appendBookChapter = (bookId: string, data: AppendChapterParams) => {
  return request.post<ApiResponse<any>>(`/api/v1/time-library/admin/books/${bookId}/contents`, data);
};

export const setupBookPersona = (bookId: string, data: SetupPersonaParams) => {
  return request.post<ApiResponse<any>>(`/api/v1/time-library/admin/books/${bookId}/persona`, data);
};
