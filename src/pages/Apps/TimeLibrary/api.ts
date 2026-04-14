import request from '@/utils/request';
import type { ApiResponse } from '@/types';
import type { Book, BookListParams, BookCreateParams, BookUpdateParams, AppendChapterParams, SetupPersonaParams, BookDetail } from './types';

// 获取图书列表 (前端可能需要分页等，但后端只有 start_year / end_year 过滤)
export const getBooks = (params?: BookListParams) => {
  return request.get<ApiResponse<Book[]>>('/api/v1/time-library/books', { params });
};

// 获取图书详情 (含内容、人设)
export const getBookDetail = (bookId: string) => {
  return request.get<ApiResponse<BookDetail>>(`/api/v1/time-library/books/${bookId}`);
};

// 录入书籍 (管理端)
export const addBook = (data: BookCreateParams) => {
  return request.post<ApiResponse<Book>>('/api/v1/time-library/admin/books', data);
};

// 更新书籍信息 (管理端)
export const updateBook = (bookId: string, data: BookUpdateParams) => {
  return request.put<ApiResponse<Book>>(`/api/v1/time-library/admin/books/${bookId}`, data);
};

// 下架书籍 (管理端 - DELETE)
export const deleteBook = (bookId: string) => {
  return request.delete<ApiResponse<any>>(`/api/v1/time-library/admin/books/${bookId}`);
};

// 追加章节内容
export const appendBookChapter = (bookId: string, data: AppendChapterParams) => {
  return request.post<ApiResponse<any>>(`/api/v1/time-library/admin/books/${bookId}/contents`, data);
};

// 配置AI 人设
export const setupBookPersona = (bookId: string, data: SetupPersonaParams) => {
  return request.post<ApiResponse<any>>(`/api/v1/time-library/admin/books/${bookId}/persona`, data);
};
