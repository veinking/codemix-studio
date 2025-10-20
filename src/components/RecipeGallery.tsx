import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Search, Heart, Eye, Code2, Plus, Share2, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface Recipe {
  id: string;
  title: string;
  description: string;
  category: string;
  language: string;
  code: string;
  tags: string[];
  difficulty: string;
  likes_count: number;
  views_count: number;
  is_public: boolean;
  created_at: string;
  user_id: string;
}

interface RecipeGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRecipe: (code: string) => void;
  currentLanguage: string;
}

export const RecipeGallery = ({ open, onOpenChange, onSelectRecipe, currentLanguage }: RecipeGalleryProps) => {
  const { user, isGuest } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  // New recipe form state
  const [newRecipe, setNewRecipe] = useState({
    title: '',
    description: '',
    category: 'data-science',
    code: '',
    tags: '',
    difficulty: 'beginner',
    is_public: false
  });

  const categories = [
    { value: 'all', label: 'All Recipes' },
    { value: 'data-science', label: 'Data Science', icon: '📊' },
    { value: 'ml', label: 'Machine Learning', icon: '🤖' },
    { value: 'visualization', label: 'Visualization', icon: '📈' },
    { value: 'stats', label: 'Statistics', icon: '📉' },
    { value: 'cleaning', label: 'Data Cleaning', icon: '🧹' },
    { value: 'transform', label: 'Transformation', icon: '🔄' }
  ];

  const loadRecipes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_recipes')
        .select('*')
        .eq('language', currentLanguage)
        .order('likes_count', { ascending: false });

      if (error) throw error;
      setRecipes(data || []);

      // Load user's likes if authenticated
      if (!isGuest && user) {
        const { data: likesData } = await supabase
          .from('recipe_likes')
          .select('recipe_id')
          .eq('user_id', user.id);

        if (likesData) {
          setUserLikes(new Set(likesData.map(like => like.recipe_id)));
        }
      }
    } catch (error: any) {
      console.error('Error loading recipes:', error);
      toast.error('Failed to load recipes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeRecipe = async (recipeId: string) => {
    if (isGuest || !user) {
      toast.error('Sign in to like recipes');
      return;
    }

    try {
      const isLiked = userLikes.has(recipeId);

      if (isLiked) {
        await supabase
          .from('recipe_likes')
          .delete()
          .eq('recipe_id', recipeId)
          .eq('user_id', user.id);

        setUserLikes(prev => {
          const newSet = new Set(prev);
          newSet.delete(recipeId);
          return newSet;
        });
      } else {
        await supabase
          .from('recipe_likes')
          .insert({ recipe_id: recipeId, user_id: user.id });

        setUserLikes(prev => new Set([...prev, recipeId]));
      }

      await loadRecipes(); // Refresh to update counts
    } catch (error: any) {
      console.error('Error liking recipe:', error);
      toast.error('Failed to update like');
    }
  };

  const handleCreateRecipe = async () => {
    if (isGuest || !user) {
      toast.error('Sign in to create recipes');
      return;
    }

    if (!newRecipe.title || !newRecipe.description || !newRecipe.code) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('community_recipes')
        .insert({
          user_id: user.id,
          title: newRecipe.title,
          description: newRecipe.description,
          category: newRecipe.category,
          language: currentLanguage,
          code: newRecipe.code,
          tags: newRecipe.tags.split(',').map(t => t.trim()).filter(t => t),
          difficulty: newRecipe.difficulty,
          is_public: newRecipe.is_public
        });

      if (error) throw error;

      toast.success('Recipe created successfully!');
      setShowCreateDialog(false);
      setNewRecipe({
        title: '',
        description: '',
        category: 'data-science',
        code: '',
        tags: '',
        difficulty: 'beginner',
        is_public: false
      });
      await loadRecipes();
    } catch (error: any) {
      console.error('Error creating recipe:', error);
      toast.error('Failed to create recipe');
    }
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = searchQuery === '' ||
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || recipe.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'advanced': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  useEffect(() => {
    if (open) {
      loadRecipes();
    }
  }, [open, currentLanguage]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-primary" />
              Recipe Gallery
            </DialogTitle>
            <DialogDescription>
              Community-shared code recipes for {currentLanguage}. Learn, share, and discover!
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {/* Search and Actions */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search recipes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {!isGuest && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Recipe
                </Button>
              )}
            </div>

            {/* Categories */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="w-full justify-start overflow-x-auto">
                {categories.map(cat => (
                  <TabsTrigger key={cat.value} value={cat.value} className="whitespace-nowrap">
                    {cat.icon && <span className="mr-2">{cat.icon}</span>}
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Recipes Grid */}
            <ScrollArea className="h-[500px]">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading recipes...</div>
              ) : filteredRecipes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recipes found. {!isGuest && "Be the first to create one!"}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                  {filteredRecipes.map(recipe => (
                    <Card key={recipe.id} className="hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{recipe.title}</CardTitle>
                            <CardDescription className="mt-1">{recipe.description}</CardDescription>
                          </div>
                          {!isGuest && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLikeRecipe(recipe.id)}
                              className={userLikes.has(recipe.id) ? 'text-red-500' : ''}
                            >
                              <Heart className={`h-4 w-4 ${userLikes.has(recipe.id) ? 'fill-current' : ''}`} />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge className={getDifficultyColor(recipe.difficulty)}>
                            {recipe.difficulty}
                          </Badge>
                          {recipe.tags.map(tag => (
                            <Badge key={tag} variant="outline">{tag}</Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {recipe.likes_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {recipe.views_count}
                          </span>
                        </div>
                        <Button
                          onClick={() => {
                            onSelectRecipe(recipe.code);
                            onOpenChange(false);
                            toast.success('Recipe loaded!');
                          }}
                          className="w-full"
                          variant="secondary"
                        >
                          <Code2 className="h-4 w-4 mr-2" />
                          Use Recipe
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Recipe Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Recipe</DialogTitle>
            <DialogDescription>
              Share your code with the community
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Clean CSV Data Pipeline"
                value={newRecipe.title}
                onChange={(e) => setNewRecipe({ ...newRecipe, title: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe what your recipe does..."
                value={newRecipe.description}
                onChange={(e) => setNewRecipe({ ...newRecipe, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newRecipe.category}
                  onValueChange={(value) => setNewRecipe({ ...newRecipe, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c.value !== 'all').map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  value={newRecipe.difficulty}
                  onValueChange={(value) => setNewRecipe({ ...newRecipe, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="pandas, data-cleaning, csv"
                value={newRecipe.tags}
                onChange={(e) => setNewRecipe({ ...newRecipe, tags: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="code">Code *</Label>
              <Textarea
                id="code"
                placeholder="Paste your code here..."
                value={newRecipe.code}
                onChange={(e) => setNewRecipe({ ...newRecipe, code: e.target.value })}
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="public"
                checked={newRecipe.is_public}
                onCheckedChange={(checked) => setNewRecipe({ ...newRecipe, is_public: checked })}
              />
              <Label htmlFor="public">Make public (share with community)</Label>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRecipe}>
                <Share2 className="h-4 w-4 mr-2" />
                Create Recipe
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
