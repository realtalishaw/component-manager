import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Component } from '@/lib/supabase';
import { updateComponent } from '@/lib/supabase';
import { TagInput } from './TagInput';

type Props = {
  component: Component;
  onSuccess: () => void;
  onClose: () => void;
  existingTags: string[];
};

export default function EditComponentForm({ component, onSuccess, onClose, existingTags }: Props) {
  const [name, setName] = useState(component.name);
  const [code, setCode] = useState(component.code);
  const [tags, setTags] = useState<string[]>(component.tags);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      await updateComponent(component.id, {
        name,
        code,
        tags,
      });

      toast({
        title: "Success",
        description: "Component updated successfully",
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating component:', error);
      toast({
        title: "Error",
        description: "Failed to update component",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
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
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">Component Code</Label>
        <Textarea
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="font-mono"
          rows={10}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <TagInput tags={tags} setTags={setTags} suggestions={existingTags} />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isUpdating}>
          {isUpdating ? 'Updating Component...' : 'Update Component'}
        </Button>
      </DialogFooter>
    </form>
  );
}
