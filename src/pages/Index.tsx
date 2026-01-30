import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { auth, posts, shorts, type User, type Post, type Short } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'shorts' | 'profile'>('feed');
  
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [shortsFeed, setShortsFeed] = useState<Short[]>([]);
  
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateShort, setShowCreateShort] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostVideo, setNewPostVideo] = useState('');
  const [newShortTitle, setNewShortTitle] = useState('');
  const [newShortVideo, setNewShortVideo] = useState('');
  
  const [authForm, setAuthForm] = useState({
    username: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    checkAuth();
    loadFeed();
    loadShorts();
  }, []);

  const checkAuth = async () => {
    const result = await auth.verify();
    if (result.ok && result.user) {
      setUser(result.user);
    } else {
      setShowAuth(true);
    }
  };

  const loadFeed = async () => {
    const data = await posts.getFeed();
    setFeedPosts(data);
  };

  const loadShorts = async () => {
    const data = await shorts.getFeed();
    setShortsFeed(data);
  };

  const handleAuth = async () => {
    const result = isLogin
      ? await auth.login(authForm.username, authForm.password)
      : await auth.register(authForm.username, authForm.email, authForm.password);

    if (result.ok) {
      setUser(result.data.user);
      setShowAuth(false);
      toast({ title: isLogin ? 'Вход выполнен!' : 'Регистрация завершена!' });
      loadFeed();
    } else {
      toast({ 
        title: 'Ошибка', 
        description: result.data.error || 'Произошла ошибка',
        variant: 'destructive' 
      });
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;

    const result = await posts.create(
      newPostContent,
      newPostVideo ? 'video' : 'text',
      newPostVideo || undefined
    );

    if (result.ok) {
      setFeedPosts([result.post, ...feedPosts]);
      setNewPostContent('');
      setNewPostVideo('');
      setShowCreatePost(false);
      toast({ title: 'Пост создан!' });
    }
  };

  const handleCreateShort = async () => {
    if (!newShortTitle.trim() || !newShortVideo.trim()) return;

    const result = await shorts.create(newShortTitle, newShortVideo);

    if (result.ok) {
      setShortsFeed([result.short, ...shortsFeed]);
      setNewShortTitle('');
      setNewShortVideo('');
      setShowCreateShort(false);
      toast({ title: 'Клип создан!' });
    }
  };

  const handleLikePost = async (postId: number, isLike: boolean) => {
    const result = await posts.like(postId, isLike);
    setFeedPosts(feedPosts.map(p => 
      p.id === postId ? { ...p, likes: result.likes, dislikes: result.dislikes } : p
    ));
  };

  const handleLikeShort = async (shortId: number, isLike: boolean) => {
    const result = await shorts.like(shortId, isLike);
    setShortsFeed(shortsFeed.map(s => 
      s.id === shortId ? { ...s, likes: result.likes, dislikes: result.dislikes } : s
    ));
  };

  const handleLogout = () => {
    auth.logout();
    setUser(null);
    setShowAuth(true);
  };

  if (showAuth) {
    return (
      <div className="min-h-screen bg-[#0A0E27] cyber-grid flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-card/90 backdrop-blur-sm border-primary/30">
          <h1 className="text-3xl font-black text-primary neon-glow text-center mb-6">
            JJRKDOEMYT NETWORK
          </h1>
          
          <Tabs value={isLogin ? 'login' : 'register'} onValueChange={(v) => setIsLogin(v === 'login')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>
            
            <div className="space-y-4">
              <div>
                <Label>Имя пользователя</Label>
                <Input
                  value={authForm.username}
                  onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                  className="border-primary/30"
                  placeholder="username"
                />
              </div>
              
              {!isLogin && (
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    className="border-primary/30"
                    placeholder="email@example.com"
                  />
                </div>
              )}
              
              <div>
                <Label>Пароль</Label>
                <Input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="border-primary/30"
                  placeholder="••••••••"
                />
              </div>
              
              <Button 
                onClick={handleAuth} 
                className="w-full bg-gradient-to-r from-primary to-secondary font-bold"
              >
                {isLogin ? 'ВОЙТИ' : 'ЗАРЕГИСТРИРОВАТЬСЯ'}
              </Button>
            </div>
          </Tabs>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E27] cyber-grid relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0E27] via-transparent to-[#0A0E27] pointer-events-none" />
      
      <div className="relative z-10">
        <header className="border-b border-primary/20 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-black neon-glow text-primary glitch">
                JJRKDOEMYT NETWORK
              </h1>
              <div className="flex items-center gap-4">
                <nav className="flex gap-2">
                  <Button
                    variant={activeTab === 'feed' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('feed')}
                    className="font-bold"
                  >
                    <Icon name="Home" className="mr-2" size={20} />
                    ЛЕНТА
                  </Button>
                  <Button
                    variant={activeTab === 'shorts' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('shorts')}
                    className="font-bold"
                  >
                    <Icon name="Play" className="mr-2" size={20} />
                    КЛИПЫ
                  </Button>
                  <Button
                    variant={activeTab === 'profile' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('profile')}
                    className="font-bold"
                  >
                    <Icon name="User" className="mr-2" size={20} />
                    ПРОФИЛЬ
                  </Button>
                </nav>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <Icon name="LogOut" size={18} />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          {activeTab === 'feed' && (
            <div className="space-y-6 fade-in">
              <Card className="p-6 neon-border bg-card/80 backdrop-blur-sm border-primary/30">
                <div className="flex items-start gap-4">
                  <div className="text-5xl">{user?.avatar || '👤'}</div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-primary mb-2">
                      ЭКСКЛЮЗИВНЫЕ НОВОСТИ И МОДЫ
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      Публикуй моды для Minecraft, делись новостями и видео
                    </p>
                    <Button 
                      onClick={() => setShowCreatePost(true)}
                      className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 font-bold"
                    >
                      <Icon name="Plus" className="mr-2" size={20} />
                      СОЗДАТЬ ПОСТ
                    </Button>
                  </div>
                </div>
              </Card>

              <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
                <DialogContent className="bg-card border-primary/30">
                  <DialogHeader>
                    <DialogTitle className="text-primary">Новый пост</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Поделитесь новостью или модом..."
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="min-h-[150px] border-primary/30"
                    />
                    <div>
                      <Label>Ссылка на видео (необязательно)</Label>
                      <Input
                        placeholder="https://youtube.com/..."
                        value={newPostVideo}
                        onChange={(e) => setNewPostVideo(e.target.value)}
                        className="border-primary/30"
                      />
                    </div>
                    <Button onClick={handleCreatePost} className="w-full bg-primary text-primary-foreground font-bold">
                      ОПУБЛИКОВАТЬ
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="space-y-4">
                {feedPosts.map((post) => (
                  <Card key={post.id} className="p-6 bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{post.author.avatar}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-primary">{post.author.username}</span>
                          {post.author.username === 'JJRKDOEMYT' && (
                            <Badge variant="outline" className="border-primary/50 text-primary">
                              Автор
                            </Badge>
                          )}
                          <span className="text-sm text-muted-foreground ml-auto">
                            {new Date(post.timestamp).toLocaleString('ru')}
                          </span>
                        </div>
                        
                        <p className="text-foreground mb-4">{post.content}</p>
                        
                        {post.videoUrl && (
                          <div className="mb-4 aspect-video bg-muted rounded-lg flex items-center justify-center border border-primary/30">
                            <Icon name="Play" size={48} className="text-primary" />
                            <span className="ml-2 text-muted-foreground">Видео: {post.videoUrl}</span>
                          </div>
                        )}
                        
                        {post.type === 'mod' && post.modLink && (
                          <Button variant="outline" className="mb-4 border-secondary text-secondary hover:bg-secondary/20">
                            <Icon name="Download" className="mr-2" size={18} />
                            СКАЧАТЬ МОД
                          </Button>
                        )}

                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLikePost(post.id, true)}
                            className="text-primary hover:bg-primary/20"
                          >
                            <Icon name="ThumbsUp" className="mr-2" size={18} />
                            {post.likes}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLikePost(post.id, false)}
                            className="text-destructive hover:bg-destructive/20"
                          >
                            <Icon name="ThumbsDown" className="mr-2" size={18} />
                            {post.dislikes}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                            <Icon name="Eye" className="mr-2" size={18} />
                            {post.views}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'shorts' && (
            <div className="space-y-6 fade-in">
              <Card className="p-6 neon-border bg-card/80 backdrop-blur-sm border-primary/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-primary mb-2">КЛИПЫ И ШОРТСЫ</h2>
                    <p className="text-muted-foreground">Короткие вертикальные видео как в YouTube Shorts</p>
                  </div>
                  <Button 
                    onClick={() => setShowCreateShort(true)}
                    className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 font-bold"
                  >
                    <Icon name="Plus" className="mr-2" size={20} />
                    СОЗДАТЬ КЛИП
                  </Button>
                </div>
              </Card>

              <Dialog open={showCreateShort} onOpenChange={setShowCreateShort}>
                <DialogContent className="bg-card border-primary/30">
                  <DialogHeader>
                    <DialogTitle className="text-primary">Новый клип</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Название</Label>
                      <Input
                        placeholder="Название клипа..."
                        value={newShortTitle}
                        onChange={(e) => setNewShortTitle(e.target.value)}
                        className="border-primary/30"
                      />
                    </div>
                    <div>
                      <Label>Ссылка на видео</Label>
                      <Input
                        placeholder="https://youtube.com/shorts/..."
                        value={newShortVideo}
                        onChange={(e) => setNewShortVideo(e.target.value)}
                        className="border-primary/30"
                      />
                    </div>
                    <Button onClick={handleCreateShort} className="w-full bg-primary text-primary-foreground font-bold">
                      ОПУБЛИКОВАТЬ
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {shortsFeed.map((short) => (
                  <Card key={short.id} className="overflow-hidden bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-all cursor-pointer group">
                    <div className="aspect-[9/16] bg-muted relative flex items-center justify-center">
                      <Icon name="Play" size={48} className="text-primary group-hover:scale-110 transition-transform" />
                      <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs">
                        {Math.floor(short.duration / 60)}:{(short.duration % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{short.author.avatar}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{short.title}</p>
                          <p className="text-xs text-muted-foreground">{short.author.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <button 
                          onClick={() => handleLikeShort(short.id, true)}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          <Icon name="ThumbsUp" size={14} />
                          {short.likes}
                        </button>
                        <button 
                          onClick={() => handleLikeShort(short.id, false)}
                          className="flex items-center gap-1 hover:text-destructive"
                        >
                          <Icon name="ThumbsDown" size={14} />
                          {short.dislikes}
                        </button>
                        <span className="flex items-center gap-1">
                          <Icon name="Eye" size={14} />
                          {short.views}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'profile' && user && (
            <div className="space-y-6 fade-in">
              <Card className="overflow-hidden bg-card/80 backdrop-blur-sm border-primary/30">
                <div 
                  className="h-48 relative"
                  style={{ background: user.banner }}
                >
                  <div className="absolute inset-0 bg-black/20" />
                </div>
                
                <div className="p-6">
                  <div className="flex items-start gap-6 -mt-20 mb-6">
                    <div className="text-8xl bg-card rounded-full p-4 border-4 border-primary neon-border">
                      {user.avatar}
                    </div>
                    <div className="flex-1 mt-16">
                      <h2 className="text-3xl font-black text-primary neon-glow">{user.username}</h2>
                      <div className="flex gap-6 mt-2">
                        <span className="text-muted-foreground">
                          <strong className="text-primary">{user.followers || 0}</strong> подписчиков
                        </span>
                        <span className="text-muted-foreground">
                          <strong className="text-primary">{user.following || 0}</strong> подписок
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-primary mb-1">О СЕБЕ</h3>
                      <p className="text-foreground">{user.bio || 'Описание не заполнено'}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-primary mb-1">EMAIL</h3>
                        <p className="text-foreground">{user.email}</p>
                      </div>
                      {user.phone && (
                        <div>
                          <h3 className="text-sm font-bold text-primary mb-1">ТЕЛЕФОН</h3>
                          <p className="text-foreground">{user.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;