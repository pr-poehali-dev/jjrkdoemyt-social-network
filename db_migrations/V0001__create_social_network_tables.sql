-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar TEXT DEFAULT '👤',
    banner TEXT DEFAULT 'linear-gradient(135deg, #00F0FF 0%, #B026FF 100%)',
    bio TEXT DEFAULT '',
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица постов
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    post_type VARCHAR(20) DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'video', 'mod')),
    media_url TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    mod_link TEXT,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица клипов/шортсов (вертикальные видео)
CREATE TABLE IF NOT EXISTS shorts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица подписок
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    follower_id INTEGER NOT NULL REFERENCES users(id),
    following_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Таблица лайков постов
CREATE TABLE IF NOT EXISTS post_likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    post_id INTEGER NOT NULL REFERENCES posts(id),
    is_like BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id)
);

-- Таблица лайков шортсов
CREATE TABLE IF NOT EXISTS short_likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    short_id INTEGER NOT NULL REFERENCES shorts(id),
    is_like BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, short_id)
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shorts_user_id ON shorts(user_id);
CREATE INDEX IF NOT EXISTS idx_shorts_created_at ON shorts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_follower ON subscriptions(follower_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_following ON subscriptions(following_id);

-- Создаем главного пользователя JJRKDOEMYT
INSERT INTO users (username, email, password_hash, avatar, bio, phone) 
VALUES (
    'JJRKDOEMYT',
    'contact@jjrkdoemyt.net',
    '$2b$10$dummyhash',
    '👾',
    'Создатель киберпанк модов для Minecraft | Эксклюзивные релизы здесь',
    '+7 (999) 123-45-67'
) ON CONFLICT (username) DO NOTHING;

-- Создаем тестовые посты
INSERT INTO posts (user_id, content, post_type, likes, dislikes) 
SELECT id, 'Эксклюзивные новости! Скоро выйдет мой новый мод с киберпанк оружием для Minecraft! 🔫⚡', 'text', 42, 2
FROM users WHERE username = 'JJRKDOEMYT';

INSERT INTO posts (user_id, content, post_type, mod_link, likes, dislikes) 
SELECT id, 'Новый мод: CyberCity Pack - добавляет неоновые блоки и футуристические строения!', 'mod', '#', 128, 5
FROM users WHERE username = 'JJRKDOEMYT';