import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { uploadImage } from '@/lib/supabase';
import type { Component } from '@/lib/supabase';

type Props = {
  onSubmit: (component: Omit<Component, 'id' | 'created_at'>) => void;
};

export default function AddComponentForm({ onSubmit }: Props) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "Error",
        description: "Please select an image",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      const imageUrl = await uploadImage(file);
      
      onSubmit({
        name,
        code,
        image_url: imageUrl,
        tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      });

      setName('');
      setCode('');
      setTags('');
      setFile(null);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "Image size should be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Component Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Navbar, Button, Card"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">Component Code</Label>
        <Textarea
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste your component code here..."
          className="font-mono"
          rows={10}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Preview Image</Label>
        <div className="flex items-center gap-4">
          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            required
          />
          {file && (
            <img
              src={URL.createObjectURL(file)}
              alt="Preview"
              className="h-20 w-20 object-cover rounded-md"
            />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="e.g., navigation, layout, global"
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isUploading}>
          {isUploading ? 'Adding Component...' : 'Add Component'}
        </Button>
      </DialogFooter>
    </form>
  );
}