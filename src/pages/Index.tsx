import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface Post {
  id: number;
  author: string;
  authorAvatar: string;
  content: string;
  likes: number;
  dislikes: number;
  timestamp: string;
  type: 'news' | 'mod';
  modLink?: string;
}

interface User {
  username: string;
  avatar: string;
  banner: string;
  bio: string;
  email: string;
  phone: string;
  followers: number;
  following: number;
  isFollowing: boolean;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState<'feed' | 'profile'>('feed');
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      author: 'JJRKDOEMYT',
      authorAvatar: '👾',
      content: 'Эксклюзивные новости! Скоро выйдет мой новый мод с киберпанк оружием для Minecraft! 🔫⚡',
      likes: 42,
      dislikes: 2,
      timestamp: '2 часа назад',
      type: 'news'
    },
    {
      id: 2,
      author: 'JJRKDOEMYT',
      authorAvatar: '👾',
      content: 'Новый мод: CyberCity Pack - добавляет неоновые блоки и футуристические строения!',
      likes: 128,
      dislikes: 5,
      timestamp: '5 часов назад',
      type: 'mod',
      modLink: '#'
    }
  ]);

  const [currentUser] = useState<User>({
    username: 'JJRKDOEMYT',
    avatar: '👾',
    banner: 'linear-gradient(135deg, #00F0FF 0%, #B026FF 100%)',
    bio: 'Создатель киберпанк модов для Minecraft | Эксклюзивные релизы здесь',
    email: 'contact@jjrkdoemyt.net',
    phone: '+7 (999) 123-45-67',
    followers: 1547,
    following: 42
  });

  const [newPostContent, setNewPostContent] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editProfile, setEditProfile] = useState(false);

  const handleLike = (postId: number) => {
    setPosts(posts.map(post => 
      post.id === postId ? { ...post, likes: post.likes + 1 } : post
    ));
  };

  const handleDislike = (postId: number) => {
    setPosts(posts.map(post => 
      post.id === postId ? { ...post, dislikes: post.dislikes + 1 } : post
    ));
  };

  const createPost = () => {
    if (newPostContent.trim()) {
      const newPost: Post = {
        id: posts.length + 1,
        author: 'JJRKDOEMYT',
        authorAvatar: '👾',
        content: newPostContent,
        likes: 0,
        dislikes: 0,
        timestamp: 'только что',
        type: 'news'
      };
      setPosts([newPost, ...posts]);
      setNewPostContent('');
      setShowCreatePost(false);
    }
  };

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
              <nav className="flex gap-4">
                <Button
                  variant={activeTab === 'feed' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('feed')}
                  className="font-bold"
                >
                  <Icon name="Home" className="mr-2" size={20} />
                  ЛЕНТА
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
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          {activeTab === 'feed' && (
            <div className="space-y-6 fade-in">
              <Card className="p-6 neon-border bg-card/80 backdrop-blur-sm border-primary/30">
                <div className="flex items-start gap-4">
                  <div className="text-5xl">{currentUser.avatar}</div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-primary mb-2">
                      ЭКСКЛЮЗИВНЫЕ НОВОСТИ ОТ {currentUser.username}
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      Публикую моды для Minecraft и делюсь новостями о разработке
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
                    <Button onClick={createPost} className="w-full bg-primary text-primary-foreground font-bold">
                      ОПУБЛИКОВАТЬ
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id} className="p-6 bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{post.authorAvatar}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-primary">{post.author}</span>
                          <Badge variant="outline" className="border-primary/50 text-primary">
                            Автор
                          </Badge>
                          <span className="text-sm text-muted-foreground ml-auto">{post.timestamp}</span>
                        </div>
                        
                        <p className="text-foreground mb-4">{post.content}</p>
                        
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
                            onClick={() => handleLike(post.id)}
                            className="text-primary hover:bg-primary/20"
                          >
                            <Icon name="ThumbsUp" className="mr-2" size={18} />
                            {post.likes}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDislike(post.id)}
                            className="text-destructive hover:bg-destructive/20"
                          >
                            <Icon name="ThumbsDown" className="mr-2" size={18} />
                            {post.dislikes}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                            <Icon name="MessageCircle" className="mr-2" size={18} />
                            Комментарии
                          </Button>
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                            <Icon name="Share2" className="mr-2" size={18} />
                            Поделиться
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6 fade-in">
              <Card className="overflow-hidden bg-card/80 backdrop-blur-sm border-primary/30">
                <div 
                  className="h-48 relative"
                  style={{ background: currentUser.banner }}
                >
                  <div className="absolute inset-0 bg-black/20" />
                </div>
                
                <div className="p-6">
                  <div className="flex items-start gap-6 -mt-20 mb-6">
                    <div className="text-8xl bg-card rounded-full p-4 border-4 border-primary neon-border">
                      {currentUser.avatar}
                    </div>
                    <div className="flex-1 mt-16">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-3xl font-black text-primary neon-glow">{currentUser.username}</h2>
                          <div className="flex gap-6 mt-2">
                            <span className="text-muted-foreground">
                              <strong className="text-primary">{currentUser.followers}</strong> подписчиков
                            </span>
                            <span className="text-muted-foreground">
                              <strong className="text-primary">{currentUser.following}</strong> подписок
                            </span>
                          </div>
                        </div>
                        <Dialog open={editProfile} onOpenChange={setEditProfile}>
                          <DialogTrigger asChild>
                            <Button className="bg-primary text-primary-foreground font-bold">
                              <Icon name="Settings" className="mr-2" size={18} />
                              РЕДАКТИРОВАТЬ
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-card border-primary/30 max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="text-primary">Редактирование профиля</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                              <div>
                                <Label>Аватар (эмодзи)</Label>
                                <Input placeholder="👾" className="text-4xl text-center border-primary/30" />
                              </div>
                              <div>
                                <Label>Описание</Label>
                                <Textarea placeholder="Расскажите о себе..." defaultValue={currentUser.bio} className="border-primary/30" />
                              </div>
                              <div>
                                <Label>Email</Label>
                                <Input type="email" defaultValue={currentUser.email} className="border-primary/30" />
                              </div>
                              <div>
                                <Label>Телефон</Label>
                                <Input type="tel" defaultValue={currentUser.phone} className="border-primary/30" />
                              </div>
                              <div>
                                <Label>Цвета баннера (CSS gradient)</Label>
                                <Input defaultValue={currentUser.banner} className="border-primary/30" />
                              </div>
                              <Button className="w-full bg-primary text-primary-foreground font-bold">
                                СОХРАНИТЬ ИЗМЕНЕНИЯ
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-primary mb-1">О СЕБЕ</h3>
                      <p className="text-foreground">{currentUser.bio}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-primary mb-1">EMAIL</h3>
                        <p className="text-foreground">{currentUser.email}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-primary mb-1">ТЕЛЕФОН</h3>
                        <p className="text-foreground">{currentUser.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card/80 backdrop-blur-sm border-primary/30">
                <h3 className="text-xl font-bold text-primary mb-4">МОИ ПОСТЫ</h3>
                <div className="space-y-4">
                  {posts.filter(p => p.author === currentUser.username).map(post => (
                    <div key={post.id} className="p-4 border border-primary/20 rounded-lg hover:border-primary/50 transition-all">
                      <p className="text-foreground mb-2">{post.content}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Icon name="ThumbsUp" size={16} /> {post.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="ThumbsDown" size={16} /> {post.dislikes}
                        </span>
                        <span className="ml-auto">{post.timestamp}</span>
                      </div>
                    </div>
                  ))}
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