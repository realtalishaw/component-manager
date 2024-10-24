import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zp1v56uxy8rdx5ypatb0ockcb9tr6a.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwMXY1NnV4eThyZHg1eXBhdGIwb2NrY2I5dHI2YSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzA5NzU5MjAwLCJleHAiOjIwMjUzMzUyMDB9.gqUW8KDVc9P4_0FxKTGPVQeP4yO5Q5YE5yH7-Kg4-Zs';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Component = {
  id: string;
  name: string;
  code: string;
  image_url: string;
  tags: string[];
  created_at: Date;
};

export async function uploadImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `components/${fileName}`;

  const { error: uploadError, data } = await supabase.storage
    .from('component-images')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('component-images')
    .getPublicUrl(filePath);

  return publicUrl;
}

export async function getComponents(): Promise<Component[]> {
  const { data, error } = await supabase
    .from('components')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching components:', error);
    throw error;
  }

  return data || [];
}

export async function addComponent(component: Omit<Component, 'id' | 'created_at'>): Promise<Component> {
  const { data, error } = await supabase
    .from('components')
    .insert([component])
    .select()
    .single();

  if (error) {
    console.error('Error adding component:', error);
    throw error;
  }

  return data;
}