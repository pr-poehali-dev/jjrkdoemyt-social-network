import json
import os
import psycopg2
import jwt

def get_user_from_token(auth_header: str, jwt_secret: str):
    """Извлечь user_id из JWT токена"""
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.replace('Bearer ', '')
    try:
        payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
        return payload.get('user_id')
    except:
        return None

def handler(event: dict, context) -> dict:
    """API для работы с постами и лентой новостей"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    db_url = os.environ.get('DATABASE_URL')
    jwt_secret = os.environ.get('JWT_SECRET', 'fallback-secret')
    
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            cur.execute("""
                SELECT 
                    p.id, p.content, p.post_type, p.media_url, p.video_url, 
                    p.thumbnail_url, p.mod_link, p.likes, p.dislikes, p.views,
                    p.created_at, u.id, u.username, u.avatar
                FROM posts p
                JOIN users u ON p.user_id = u.id
                ORDER BY p.created_at DESC
                LIMIT 50
            """)
            
            posts = []
            for row in cur.fetchall():
                posts.append({
                    'id': row[0],
                    'content': row[1],
                    'type': row[2],
                    'mediaUrl': row[3],
                    'videoUrl': row[4],
                    'thumbnailUrl': row[5],
                    'modLink': row[6],
                    'likes': row[7],
                    'dislikes': row[8],
                    'views': row[9],
                    'timestamp': row[10].isoformat() if row[10] else None,
                    'author': {
                        'id': row[11],
                        'username': row[12],
                        'avatar': row[13]
                    }
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'posts': posts}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            auth_header = event.get('headers', {}).get('X-Authorization', '')
            user_id = get_user_from_token(auth_header, jwt_secret)
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unauthorized'}),
                    'isBase64Encoded': False
                }
            
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'create':
                content = body.get('content')
                post_type = body.get('type', 'text')
                video_url = body.get('videoUrl')
                media_url = body.get('mediaUrl')
                mod_link = body.get('modLink')
                
                if not content:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Content is required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    INSERT INTO posts (user_id, content, post_type, video_url, media_url, mod_link)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id, created_at
                """, (user_id, content, post_type, video_url, media_url, mod_link))
                
                post_id, created_at = cur.fetchone()
                conn.commit()
                
                cur.execute("SELECT username, avatar FROM users WHERE id = %s", (user_id,))
                username, avatar = cur.fetchone()
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'post': {
                            'id': post_id,
                            'content': content,
                            'type': post_type,
                            'videoUrl': video_url,
                            'mediaUrl': media_url,
                            'modLink': mod_link,
                            'likes': 0,
                            'dislikes': 0,
                            'views': 0,
                            'timestamp': created_at.isoformat(),
                            'author': {
                                'id': user_id,
                                'username': username,
                                'avatar': avatar
                            }
                        }
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'like':
                post_id = body.get('postId')
                is_like = body.get('isLike', True)
                
                cur.execute("""
                    INSERT INTO post_likes (user_id, post_id, is_like)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (user_id, post_id) 
                    DO UPDATE SET is_like = %s
                """, (user_id, post_id, is_like, is_like))
                
                if is_like:
                    cur.execute("UPDATE posts SET likes = likes + 1 WHERE id = %s", (post_id,))
                else:
                    cur.execute("UPDATE posts SET dislikes = dislikes + 1 WHERE id = %s", (post_id,))
                
                conn.commit()
                
                cur.execute("SELECT likes, dislikes FROM posts WHERE id = %s", (post_id,))
                likes, dislikes = cur.fetchone()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'likes': likes, 'dislikes': dislikes}),
                    'isBase64Encoded': False
                }
            
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid action'}),
                    'isBase64Encoded': False
                }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    finally:
        cur.close()
        conn.close()