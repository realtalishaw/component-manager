import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Component = {
  id: string;
  user_id: string;
  name: string;
  code: string;
  image_url: string;
  tags: string[];
  created_at: Date;
};

export async function uploadImage(file: File): Promise<string> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) {
    throw new Error('User not authenticated');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExt}`;
  const filePath = `${user.data.user.id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('images')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(filePath);

  return publicUrl;
}

export async function getComponents(): Promise<Component[]> {
  const { data, error } = await supabase
    .from('components')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase error details:', error);
    throw error;
  }

  return data || [];
}

export async function addComponent(component: Omit<Component, 'id' | 'user_id' | 'created_at'>): Promise<Component> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('components')
    .insert([{ ...component, user_id: user.data.user.id }])
    .select()
    .single();

  if (error) {
    console.error('Error adding component:', error);
    throw error;
  }

  return data;
}

export async function updateComponent(id: string, component: Partial<Omit<Component, 'id' | 'user_id' | 'created_at'>>): Promise<Component> {
  const { data, error } = await supabase
    .from('components')
    .update(component)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating component:', error);
    throw error;
  }

  return data;
}

export async function deleteComponent(id: string): Promise<void> {
  const { error } = await supabase
    .from('components')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting component:', error);
    throw error;
  }
}
