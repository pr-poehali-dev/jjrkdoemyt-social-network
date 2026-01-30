import json
import os
import psycopg2
import bcrypt
import jwt
from datetime import datetime, timedelta

def handler(event: dict, context) -> dict:
    """API для регистрации и авторизации пользователей"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body = json.loads(event.get('body', '{}'))
    action = body.get('action')
    
    db_url = os.environ.get('DATABASE_URL')
    jwt_secret = os.environ.get('JWT_SECRET', 'fallback-secret')
    
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    try:
        if action == 'register':
            username = body.get('username')
            email = body.get('email')
            password = body.get('password')
            
            if not username or not email or not password:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing required fields'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("SELECT id FROM users WHERE username = %s OR email = %s", (username, email))
            if cur.fetchone():
                return {
                    'statusCode': 409,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User already exists'}),
                    'isBase64Encoded': False
                }
            
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            cur.execute(
                "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id, username, email, avatar, banner, bio",
                (username, email, password_hash)
            )
            user_data = cur.fetchone()
            conn.commit()
            
            token = jwt.encode({
                'user_id': user_data[0],
                'username': user_data[1],
                'exp': datetime.utcnow() + timedelta(days=30)
            }, jwt_secret, algorithm='HS256')
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'token': token,
                    'user': {
                        'id': user_data[0],
                        'username': user_data[1],
                        'email': user_data[2],
                        'avatar': user_data[3],
                        'banner': user_data[4],
                        'bio': user_data[5]
                    }
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'login':
            username = body.get('username')
            password = body.get('password')
            
            if not username or not password:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing credentials'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "SELECT id, username, email, password_hash, avatar, banner, bio FROM users WHERE username = %s OR email = %s",
                (username, username)
            )
            user_data = cur.fetchone()
            
            if not user_data:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid credentials'}),
                    'isBase64Encoded': False
                }
            
            try:
                password_valid = bcrypt.checkpw(password.encode('utf-8'), user_data[3].encode('utf-8'))
            except ValueError:
                password_valid = False
            
            if not password_valid:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid credentials'}),
                    'isBase64Encoded': False
                }
            
            token = jwt.encode({
                'user_id': user_data[0],
                'username': user_data[1],
                'exp': datetime.utcnow() + timedelta(days=30)
            }, jwt_secret, algorithm='HS256')
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'token': token,
                    'user': {
                        'id': user_data[0],
                        'username': user_data[1],
                        'email': user_data[2],
                        'avatar': user_data[4],
                        'banner': user_data[5],
                        'bio': user_data[6]
                    }
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'verify':
            auth_header = event.get('headers', {}).get('X-Authorization', '')
            if not auth_header.startswith('Bearer '):
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'No token provided'}),
                    'isBase64Encoded': False
                }
            
            token = auth_header.replace('Bearer ', '')
            
            try:
                payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
                user_id = payload.get('user_id')
                
                cur.execute(
                    "SELECT id, username, email, avatar, banner, bio, phone FROM users WHERE id = %s",
                    (user_id,)
                )
                user_data = cur.fetchone()
                
                if not user_data:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'User not found'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    "SELECT COUNT(*) FROM subscriptions WHERE following_id = %s",
                    (user_id,)
                )
                followers = cur.fetchone()[0]
                
                cur.execute(
                    "SELECT COUNT(*) FROM subscriptions WHERE follower_id = %s",
                    (user_id,)
                )
                following = cur.fetchone()[0]
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'user': {
                            'id': user_data[0],
                            'username': user_data[1],
                            'email': user_data[2],
                            'avatar': user_data[3],
                            'banner': user_data[4],
                            'bio': user_data[5],
                            'phone': user_data[6],
                            'followers': followers,
                            'following': following
                        }
                    }),
                    'isBase64Encoded': False
                }
            except jwt.ExpiredSignatureError:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Token expired'}),
                    'isBase64Encoded': False
                }
            except jwt.InvalidTokenError:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid token'}),
                    'isBase64Encoded': False
                }
        
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid action'}),
                'isBase64Encoded': False
            }
    
    finally:
        cur.close()
        conn.close()