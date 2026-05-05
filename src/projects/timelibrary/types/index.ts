export interface Book {
  id: string;
  title: string;
  author: string;
  year: number;
  latitude: number;
  longitude: number;
  cover_url?: string | null;
  description?: string | null;
  created_at: string;
}

export interface BookCreateParams {
  title: string;
  author: string;
  year: number;
  latitude: number;
  longitude: number;
  cover_url?: string | null;
  description?: string | null;
}

export interface BookUpdateParams extends Partial<BookCreateParams> {}

export interface AIPersona {
  name: string;
  system_prompt: string;
  avatar_url?: string | null;
}

export interface BookContent {
  id: string;
  chapter_title: string;
  content: string;
  order: number;
  created_at: string;
}

export interface BookDetail extends Book {
  contents: BookContent[];
  ai_persona?: AIPersona | null;
}

export interface BookListParams {
  start_year?: number;
  end_year?: number;
}

export interface AppendChapterParams {
  chapter_title: string;
  content: string;
  order?: number;
}

export interface SetupPersonaParams {
  name: string;
  system_prompt: string;
  avatar_url?: string | null;
}
