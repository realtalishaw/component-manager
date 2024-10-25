import { useState, useEffect } from 'react';
import { Plus, Search, Code2, Eye, Copy, Tags, Check, Edit, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import AddComponentForm from './components/AddComponentForm';
import EditComponentForm from './components/EditComponentForm';
import { AuthForm } from './components/AuthForm';
import type { Component } from '@/lib/supabase';
import { getComponents, addComponent, deleteComponent, supabase } from '@/lib/supabase';

type ViewMode = 'preview' | 'code';

export default function App() {
  const [components, setComponents] = useState<Component[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewModes, setViewModes] = useState<Record<string, ViewMode>>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const [isAddComponentDialogOpen, setIsAddComponentDialogOpen] = useState(false);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);
  const [deletingComponent, setDeletingComponent] = useState<Component | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (event === 'SIGNED_IN') {
        toast({
          title: "Logged In",
          description: "You have successfully logged in.",
        });
      }
    });

    checkUser();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadComponents();
    }
  }, [isAuthenticated]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

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
        description: "Failed to load components. Please check the console for more details.",
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

  const copyCode = async (componentId: string, code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedStates(prev => ({ ...prev, [componentId]: true }));
    toast({
      title: "Copied!",
      description: "Component code copied to clipboard.",
      duration: 2000,
    });
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [componentId]: false }));
    }, 2000);
  };

  const toggleView = (componentId: string, mode: ViewMode) => {
    setViewModes(prev => ({ ...prev, [componentId]: mode }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const handleAddComponentSuccess = async () => {
    await loadComponents();
    setIsAddComponentDialogOpen(false);
    toast({
      title: "Success",
      description: "New component has been added to your library.",
    });
  };

  const handleEditComponent = (component: Component) => {
    setEditingComponent(component);
  };

  const handleDeleteComponent = (component: Component) => {
    setDeletingComponent(component);
    setDeleteConfirmation('');
  };

  const confirmDelete = async () => {
    if (!deletingComponent || deleteConfirmation !== deletingComponent.name) {
      toast({
        title: "Error",
        description: "Please type the component name correctly to confirm deletion.",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteComponent(deletingComponent.id);
      await loadComponents();
      setDeletingComponent(null);
      toast({
        title: "Success",
        description: "Component deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting component:', error);
      toast({
        title: "Error",
        description: "Failed to delete component",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Component Library Login</h1>
          <AuthForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Component Library</h1>
          <div className="flex items-center gap-4">
            <Dialog open={isAddComponentDialogOpen} onOpenChange={setIsAddComponentDialogOpen}>
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
                <AddComponentForm 
                  onSuccess={handleAddComponentSuccess} 
                  onClose={() => setIsAddComponentDialogOpen(false)}
                  existingTags={allTags}
                />
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleLogout}>
              Log out
            </Button>
          </div>
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

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredComponents.map((component) => (
            <div
              key={component.id}
              className="rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col"
            >
              <div className="p-6 flex-grow">
                <div className="flex items-center justify-between mb-4">
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
                            onClick={() => copyCode(component.id, component.code)}
                          >
                            {copiedStates[component.id] ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{copiedStates[component.id] ? 'Copied!' : 'Copy code'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {component.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4">
                  {viewModes[component.id] === 'preview' ? (
                    <div className="rounded-md border p-4 h-48 flex items-center justify-center overflow-hidden">
                      <img 
                        src={component.image_url} 
                        alt={component.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    <pre className="max-h-[400px] overflow-auto rounded-md bg-muted p-4">
                      <code className="text-sm">{component.code}</code>
                    </pre>
                  )}
                </div>
              </div>
              <div className="p-4 border-t flex justify-end gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditComponent(component)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit component</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteComponent(component)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete component</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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

      {/* Edit Component Dialog */}
      <Dialog open={!!editingComponent} onOpenChange={() => setEditingComponent(null)}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Edit Component</DialogTitle>
          </DialogHeader>
          {editingComponent && (
            <EditComponentForm
              component={editingComponent}
              onSuccess={loadComponents}
              onClose={() => setEditingComponent(null)}
              existingTags={allTags}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingComponent} onOpenChange={() => setDeletingComponent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Component</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this component? This action cannot be undone.</p>
          <p>Type the component name <strong>{deletingComponent?.name}</strong> to confirm:</p>
          <Input
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            placeholder="Type component name here"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingComponent(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
