export interface ImageItem {
  id: number;
  user_id: string;
  filename: string;
  original_path: string;
  thumbnail_path: string;
  file_size?: number;
  mime_type?: string;
  uploaded_at: string;
  image_metadata?: ImageMetadata | ImageMetadata[];
}

export interface ImageMetadata {
  id: number;
  image_id: number;
  user_id: string;
  description?: string;
  tags?: string[];
  colors?: string[];
  ai_processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface UploadProgress {
  filename: string;
  progress: number;
  status: "uploading" | "processing" | "completed" | "error";
  error?: string;
}
