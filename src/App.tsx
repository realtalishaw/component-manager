import { useState, useEffect } from 'react';
import { Plus, Search, Code2, Eye, Copy, Tags } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import AddComponentForm from './components/AddComponentForm';
import type { Component } from '@/lib/supabase';
import { getComponents, addComponent } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type ViewMode = 'preview' | 'code';

export default function App() {
  const [components, setComponents] = useState<Component[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [viewModes, setViewModes] = useState<Record<string, ViewMode>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadComponents();
  }, []);

  const loadComponents = async () => {
    try {
      const data = await getComponents();
      setComponents(data);
      const modes: Record<string, ViewMode> = {};
      data.forEach(component => {
        modes[component.id] = 'preview';
      });
      setViewModes(modes);
    } catch (error) {
      console.error('Error loading components:', error);
      toast({
        title: "Error",
        description: "Failed to load components",
        variant: "destructive",
      });
    }
  };

  const allTags = Array.from(
    new Set(components.flatMap((component) => component.tags))
  );

  const filteredComponents = components.filter((component) => {
    const matchesSearch = component.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.every((tag) => component.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  const handleAddComponent = async (component: Omit<Component, 'id' | 'created_at'>) => {
    try {
      await addComponent(component);
      await loadComponents();
      setOpen(false);
      toast({
        title: "Success",
        description: `${component.name} has been added to your library.`,
      });
    } catch (error) {
      console.error('Error adding component:', error);
      toast({
        title: "Error",
        description: "Failed to add component",
        variant: "destructive",
      });
    }
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Component code copied to clipboard.",
      duration: 2000,
    });
  };

  const toggleView = (componentId: string, mode: ViewMode) => {
    setViewModes(prev => ({ ...prev, [componentId]: mode }));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Component Library</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Component
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle>Add New Component</DialogTitle>
              </DialogHeader>
              <AddComponentForm onSubmit={handleAddComponent} />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="p-6">
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search components..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Tags className="mr-2 h-4 w-4" />
                  Filter Tags
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Filter by Tags</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[300px]">
                  <div className="space-x-2">
                    {allTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedTags(
                            selectedTags.includes(tag)
                              ? selectedTags.filter((t) => t !== tag)
                              : [...selectedTags, tag]
                          );
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-6">
          {filteredComponents.map((component) => (
            <div
              key={component.id}
              className="rounded-lg border bg-card text-card-foreground shadow-sm"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{component.name}</h3>
                  <div className="flex items-center gap-2">
                    <Toggle 
                      pressed={viewModes[component.id] === 'preview'}
                      onPressedChange={() => toggleView(component.id, 'preview')}
                      aria-label="Toggle preview"
                    >
                      <Eye className="h-4 w-4" />
                    </Toggle>
                    <Toggle 
                      pressed={viewModes[component.id] === 'code'}
                      onPressedChange={() => toggleView(component.id, 'code')}
                      aria-label="Toggle code"
                    >
                      <Code2 className="h-4 w-4" />
                    </Toggle>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyCode(component.code)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copy code</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {component.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4">
                  {viewModes[component.id] === 'preview' ? (
                    <div className="rounded-md border p-4">
                      <img 
                        src={component.image_url} 
                        alt={component.name}
                        className="w-full h-auto rounded-md"
                      />
                    </div>
                  ) : (
                    <pre className="max-h-[400px] overflow-auto rounded-md bg-muted p-4">
                      <code className="text-sm">{component.code}</code>
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredComponents.length === 0 && (
          <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <h3 className="text-lg font-medium">No components found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}