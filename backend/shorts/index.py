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
    """API для работы с клипами и шортсами"""
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
                    s.id, s.title, s.video_url, s.thumbnail_url, s.duration,
                    s.likes, s.dislikes, s.views, s.created_at,
                    u.id, u.username, u.avatar
                FROM shorts s
                JOIN users u ON s.user_id = u.id
                ORDER BY s.created_at DESC
                LIMIT 50
            """)
            
            shorts = []
            for row in cur.fetchall():
                shorts.append({
                    'id': row[0],
                    'title': row[1],
                    'videoUrl': row[2],
                    'thumbnailUrl': row[3],
                    'duration': row[4],
                    'likes': row[5],
                    'dislikes': row[6],
                    'views': row[7],
                    'timestamp': row[8].isoformat() if row[8] else None,
                    'author': {
                        'id': row[9],
                        'username': row[10],
                        'avatar': row[11]
                    }
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'shorts': shorts}),
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
                title = body.get('title')
                video_url = body.get('videoUrl')
                thumbnail_url = body.get('thumbnailUrl')
                duration = body.get('duration', 0)
                
                if not title or not video_url:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Title and video URL are required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    INSERT INTO shorts (user_id, title, video_url, thumbnail_url, duration)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id, created_at
                """, (user_id, title, video_url, thumbnail_url, duration))
                
                short_id, created_at = cur.fetchone()
                conn.commit()
                
                cur.execute("SELECT username, avatar FROM users WHERE id = %s", (user_id,))
                username, avatar = cur.fetchone()
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'short': {
                            'id': short_id,
                            'title': title,
                            'videoUrl': video_url,
                            'thumbnailUrl': thumbnail_url,
                            'duration': duration,
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
                short_id = body.get('shortId')
                is_like = body.get('isLike', True)
                
                cur.execute("""
                    INSERT INTO short_likes (user_id, short_id, is_like)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (user_id, short_id) 
                    DO UPDATE SET is_like = %s
                """, (user_id, short_id, is_like, is_like))
                
                if is_like:
                    cur.execute("UPDATE shorts SET likes = likes + 1 WHERE id = %s", (short_id,))
                else:
                    cur.execute("UPDATE shorts SET dislikes = dislikes + 1 WHERE id = %s", (short_id,))
                
                conn.commit()
                
                cur.execute("SELECT likes, dislikes FROM shorts WHERE id = %s", (short_id,))
                likes, dislikes = cur.fetchone()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'likes': likes, 'dislikes': dislikes}),
                    'isBase64Encoded': False
                }
            
            elif action == 'view':
                short_id = body.get('shortId')
                cur.execute("UPDATE shorts SET views = views + 1 WHERE id = %s", (short_id,))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
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