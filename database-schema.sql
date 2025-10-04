-- AI Image Gallery Database Schema
-- Run this in your Supabase SQL editor

-- Create images table
CREATE TABLE IF NOT EXISTS images (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_path TEXT NOT NULL,
  thumbnail_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Create image_metadata table
CREATE TABLE IF NOT EXISTS image_metadata (
  id SERIAL PRIMARY KEY,
  image_id INTEGER REFERENCES images(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT,
  tags TEXT[],
  colors VARCHAR(7)[],
  ai_processing_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies for images table
CREATE POLICY "Users can only see own images" ON images
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own images" ON images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own images" ON images
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own images" ON images
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for image_metadata table
CREATE POLICY "Users can only see own metadata" ON image_metadata
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metadata" ON image_metadata
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own metadata" ON image_metadata
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own metadata" ON image_metadata
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_uploaded_at ON images(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_metadata_user_id ON image_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_metadata_image_id ON image_metadata(image_id);
CREATE INDEX IF NOT EXISTS idx_metadata_tags ON image_metadata USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_metadata_colors ON image_metadata USING GIN(colors);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_image_metadata_updated_at 
  BEFORE UPDATE ON image_metadata 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
