import funcUrls from '../../backend/func2url.json';

const API_URLS = {
  auth: funcUrls.auth,
  posts: funcUrls.posts,
  shorts: funcUrls.shorts,
};

export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string;
  banner: string;
  bio: string;
  phone?: string;
  followers?: number;
  following?: number;
}

export interface Post {
  id: number;
  content: string;
  type: 'text' | 'image' | 'video' | 'mod';
  mediaUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  modLink?: string;
  likes: number;
  dislikes: number;
  views: number;
  timestamp: string;
  author: {
    id: number;
    username: string;
    avatar: string;
  };
}

export interface Short {
  id: number;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  likes: number;
  dislikes: number;
  views: number;
  timestamp: string;
  author: {
    id: number;
    username: string;
    avatar: string;
  };
}

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const auth = {
  async register(username: string, email: string, password: string) {
    const response = await fetch(API_URLS.auth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', username, email, password }),
    });
    const data = await response.json();
    if (response.ok && data.token) {
      localStorage.setItem('authToken', data.token);
    }
    return { ok: response.ok, data };
  },

  async login(username: string, password: string) {
    const response = await fetch(API_URLS.auth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username, password }),
    });
    const data = await response.json();
    if (response.ok && data.token) {
      localStorage.setItem('authToken', data.token);
    }
    return { ok: response.ok, data };
  },

  async verify(): Promise<{ ok: boolean; user?: User }> {
    const token = localStorage.getItem('authToken');
    if (!token) return { ok: false };

    const response = await fetch(API_URLS.auth, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ action: 'verify' }),
    });
    
    if (response.ok) {
      const data = await response.json();
      return { ok: true, user: data.user };
    }
    
    localStorage.removeItem('authToken');
    return { ok: false };
  },

  logout() {
    localStorage.removeItem('authToken');
  },
};

export const posts = {
  async getFeed(): Promise<Post[]> {
    const response = await fetch(API_URLS.posts);
    const data = await response.json();
    return data.posts || [];
  },

  async create(content: string, type: string = 'text', videoUrl?: string, mediaUrl?: string, modLink?: string) {
    const response = await fetch(API_URLS.posts, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ 
        action: 'create', 
        content, 
        type, 
        videoUrl, 
        mediaUrl, 
        modLink 
      }),
    });
    const data = await response.json();
    return { ok: response.ok, post: data.post };
  },

  async like(postId: number, isLike: boolean = true) {
    const response = await fetch(API_URLS.posts, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ action: 'like', postId, isLike }),
    });
    return await response.json();
  },
};

export const shorts = {
  async getFeed(): Promise<Short[]> {
    const response = await fetch(API_URLS.shorts);
    const data = await response.json();
    return data.shorts || [];
  },

  async create(title: string, videoUrl: string, thumbnailUrl?: string, duration: number = 0) {
    const response = await fetch(API_URLS.shorts, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ 
        action: 'create', 
        title, 
        videoUrl, 
        thumbnailUrl, 
        duration 
      }),
    });
    const data = await response.json();
    return { ok: response.ok, short: data.short };
  },

  async like(shortId: number, isLike: boolean = true) {
    const response = await fetch(API_URLS.shorts, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ action: 'like', shortId, isLike }),
    });
    return await response.json();
  },

  async view(shortId: number) {
    await fetch(API_URLS.shorts, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ action: 'view', shortId }),
    });
  },
};