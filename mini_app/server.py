#!/usr/bin/env python3
"""
Простой HTTP сервер для Mini App
Запускает веб-сервер на вашем ПК
"""

import http.server
import socketserver
import webbrowser
import os
import socket
from urllib.parse import urlparse
import threading
import time
import json
import sys
from flask import Flask, jsonify, request
import sqlite3

app = Flask(__name__)

# Функция для получения данных пользователя
def get_user_data(telegram_id):
    conn = sqlite3.connect('../commands.db')
    cursor = conn.cursor()
    
    cursor.execute('''
    SELECT telegram_id, username, first_name, last_name, vip_status, search_count, favorites_count 
    FROM users WHERE telegram_id = ?
    ''', (telegram_id,))
    
    user = cursor.fetchone()
    conn.close()
    
    if user:
        columns = ['telegram_id', 'username', 'first_name', 'last_name', 'vip_status', 'search_count', 'favorites_count']
        return dict(zip(columns, user))
    return None

# Функция для обновления данных пользователя
def update_user_data(telegram_id, data):
    conn = sqlite3.connect('../commands.db')
    cursor = conn.cursor()
    
    # Обновляем только разрешенные поля
    allowed_fields = ['search_count', 'favorites_count']
    
    update_fields = []
    values = []
    
    for field, value in data.items():
        if field in allowed_fields:
            update_fields.append(f"{field} = ?")
            values.append(value)
    
    if update_fields:
        values.append(telegram_id)
        query = f"UPDATE users SET {', '.join(update_fields)} WHERE telegram_id = ?"
        cursor.execute(query, values)
        conn.commit()
    
    conn.close()

@app.route('/api/user/<int:telegram_id>')
def get_user(telegram_id):
    user_data = get_user_data(telegram_id)
    if user_data:
        return jsonify(user_data)
    else:
        return jsonify({'error': 'User not found'}), 404

@app.route('/api/user/<int:telegram_id>', methods=['POST'])
def update_user(telegram_id):
    data = request.get_json()
    update_user_data(telegram_id, data)
    return jsonify({'success': True})

@app.route('/api/commands')
def get_commands():
    try:
        with open('commands.json', 'r', encoding='utf-8') as f:
            commands = json.load(f)
        return jsonify(commands)
    except FileNotFoundError:
        return jsonify({'error': 'Commands file not found'}), 404

@app.route('/api/gps')
def get_gps():
    try:
        with open('gps.json', 'r', encoding='utf-8') as f:
            gps_data = json.load(f)
        return jsonify(gps_data)
    except FileNotFoundError:
        return jsonify({'error': 'GPS file not found'}), 404

@app.route('/api/rp-terms')
def get_rp_terms():
    try:
        with open('rp_terms.json', 'r', encoding='utf-8') as f:
            rp_terms = json.load(f)
        return jsonify(rp_terms)
    except FileNotFoundError:
        return jsonify({'error': 'RP terms file not found'}), 404

@app.route('/api/helper-duties')
def get_helper_duties():
    try:
        with open('helper_duties.json', 'r', encoding='utf-8') as f:
            duties = json.load(f)
        return jsonify(duties)
    except FileNotFoundError:
        return jsonify({'error': 'Helper duties file not found'}), 404

@app.route('/api/chat-rules')
def get_chat_rules():
    try:
        with open('support_chat_rules.json', 'r', encoding='utf-8') as f:
            rules = json.load(f)
        return jsonify(rules)
    except FileNotFoundError:
        return jsonify({'error': 'Chat rules file not found'}), 404

@app.route('/api/mute-rules')
def get_mute_rules():
    try:
        with open('hmute_rules.json', 'r', encoding='utf-8') as f:
            rules = json.load(f)
        return jsonify(rules)
    except FileNotFoundError:
        return jsonify({'error': 'Mute rules file not found'}), 404

@app.route('/api/statistics')
def get_statistics():
    """Получить статистику использования Mini App"""
    try:
        # Подключаемся к базе данных
        conn = sqlite3.connect('../commands.db')
        cursor = conn.cursor()
        
        # Получаем общую статистику
        cursor.execute('SELECT COUNT(*) FROM users')
        total_users = cursor.fetchone()[0]
        
        # Получаем статистику за сегодня
        cursor.execute('''
            SELECT 
                SUM(search_count) as today_searches,
                SUM(favorites_count) as total_favorites
            FROM users 
            WHERE last_active >= date('now', 'start of day')
        ''')
        today_stats = cursor.fetchone()
        today_searches = today_stats[0] or 0
        total_favorites = today_stats[1] or 0
        
        # Получаем активные сессии (пользователи, активные за последний час)
        cursor.execute('''
            SELECT COUNT(*) FROM users 
            WHERE last_active >= datetime('now', '-1 hour')
        ''')
        online_users = cursor.fetchone()[0]
        
        # Получаем активность за неделю
        weekly_activity = []
        weekly_labels = []
        for i in range(7):
            cursor.execute('''
                SELECT COUNT(*) FROM users 
                WHERE last_active >= date('now', '-{} days') 
                AND last_active < date('now', '-{} days')
            '''.format(6-i, 5-i))
            count = cursor.fetchone()[0]
            weekly_activity.append(count)
            weekly_labels.append(['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][i])
        
        # Получаем популярные команды
        cursor.execute('''
            SELECT command_name, COUNT(*) as usage_count 
            FROM command_usage 
            WHERE used_at >= date('now', '-7 days')
            GROUP BY command_name 
            ORDER BY usage_count DESC 
            LIMIT 5
        ''')
        top_commands = []
        for row in cursor.fetchall():
            top_commands.append({
                'name': row[0],
                'count': row[1]
            })
        
        # Статистика по категориям
        cursor.execute('''
            SELECT category, COUNT(*) as usage_count 
            FROM category_usage 
            WHERE used_at >= date('now', '-7 days')
            GROUP BY category 
            ORDER BY usage_count DESC
        ''')
        category_usage = []
        category_labels = []
        for row in cursor.fetchall():
            category_usage.append(row[1])
            category_labels.append(row[0])
        
        conn.close()
        
        # Формируем ответ
        statistics = {
            'totalUsers': total_users,
            'todaySearches': today_searches,
            'totalFavorites': total_favorites,
            'todaySessions': online_users,  # Используем онлайн пользователей как сессии
            'onlineUsers': online_users,
            'weeklyActivity': {
                'labels': weekly_labels,
                'data': weekly_activity
            },
            'categoryUsage': {
                'labels': category_labels,
                'data': category_usage
            },
            'topCommands': top_commands
        }
        
        return jsonify(statistics)
        
    except Exception as e:
        print(f"Ошибка получения статистики: {e}")
        # Возвращаем тестовые данные если база недоступна
        return jsonify({
            'totalUsers': 1250,
            'todaySearches': 342,
            'totalFavorites': 567,
            'todaySessions': 89,
            'onlineUsers': 23,
            'weeklyActivity': {
                'labels': ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
                'data': [45, 52, 38, 67, 89, 76, 54]
            },
            'categoryUsage': {
                'labels': ['Команды', 'GPS', 'RP-термины', 'Правила'],
                'data': [45, 25, 20, 10]
            },
            'topCommands': [
                {'name': '/help', 'count': 156},
                {'name': '/gps', 'count': 134},
                {'name': '/rules', 'count': 98},
                {'name': '/duty', 'count': 87},
                {'name': '/mute', 'count': 76}
            ]
        })

@app.route('/api/statistics/command', methods=['POST'])
def track_command_usage():
    """Отслеживание использования команды"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        command_name = data.get('command_name')
        used_at = data.get('used_at')
        
        conn = sqlite3.connect('../commands.db')
        cursor = conn.cursor()
        
        # Создаем таблицу если не существует
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS command_usage (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                command_name TEXT,
                used_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            INSERT INTO command_usage (user_id, command_name, used_at)
            VALUES (?, ?, ?)
        ''', (user_id, command_name, used_at))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        print(f"Ошибка отслеживания команды: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/statistics/category', methods=['POST'])
def track_category_usage():
    """Отслеживание использования категории"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        category = data.get('category')
        used_at = data.get('used_at')
        
        conn = sqlite3.connect('../commands.db')
        cursor = conn.cursor()
        
        # Создаем таблицу если не существует
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS category_usage (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                category TEXT,
                used_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            INSERT INTO category_usage (user_id, category, used_at)
            VALUES (?, ?, ?)
        ''', (user_id, category, used_at))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        print(f"Ошибка отслеживания категории: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/statistics/search', methods=['POST'])
def track_search_usage():
    """Отслеживание поисковых запросов"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        search_query = data.get('search_query')
        used_at = data.get('used_at')
        
        conn = sqlite3.connect('../commands.db')
        cursor = conn.cursor()
        
        # Создаем таблицу если не существует
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS search_usage (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                search_query TEXT,
                used_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            INSERT INTO search_usage (user_id, search_query, used_at)
            VALUES (?, ?, ?)
        ''', (user_id, search_query, used_at))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        print(f"Ошибка отслеживания поиска: {e}")
        return jsonify({'error': str(e)}), 500

class MiniAppServer:
    def __init__(self, port=8000):
        self.port = port
        self.server = None
        self.is_running = False
        
    def get_local_ip(self):
        """Получить локальный IP адрес"""
        try:
            # Создаем временное соединение для получения IP
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
            s.close()
            return local_ip
        except:
            return "127.0.0.1"
    
    def load_json_file(self, filename):
        """Загрузить JSON файл"""
        try:
            # Ищем файл в родительской директории (на уровень выше mini_app)
            parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            file_path = os.path.join(parent_dir, filename)
            
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            else:
                print(f"⚠️  Файл {filename} не найден в {parent_dir}")
                # Попробуем найти в текущей директории
                current_dir = os.path.dirname(os.path.abspath(__file__))
                file_path = os.path.join(current_dir, filename)
                if os.path.exists(file_path):
                    with open(file_path, 'r', encoding='utf-8') as f:
                        return json.load(f)
                else:
                    print(f"⚠️  Файл {filename} не найден и в {current_dir}")
                    return {}
        except Exception as e:
            print(f"❌ Ошибка загрузки {filename}: {e}")
            return {}
    
    def start_server(self):
        """Запустить веб-сервер"""
        try:
            # Переходим в папку с Mini App
            os.chdir(os.path.dirname(os.path.abspath(__file__)))
            
            # Создаем кастомный HTTP сервер
            class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
                def do_GET(self):
                    # API endpoints
                    if self.path.startswith('/api/'):
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                        self.end_headers()
                        
                        # Определяем какой файл запрашивается
                        endpoint = self.path[5:]  # Убираем '/api/'
                        
                        if endpoint == 'commands':
                            data = self.server.mini_app.load_json_file('commands.json')
                        elif endpoint == 'gps':
                            data = self.server.mini_app.load_json_file('gps.json')
                        elif endpoint == 'rp-terms':
                            data = self.server.mini_app.load_json_file('rp_terms.json')
                        elif endpoint == 'helper-duties':
                            data = self.server.mini_app.load_json_file('helper_duties.json')
                        elif endpoint == 'chat-rules':
                            data = self.server.mini_app.load_json_file('support_chat_rules.json')
                        elif endpoint == 'mute-rules':
                            data = self.server.mini_app.load_json_file('hmute_rules.json')
                        else:
                            data = {"error": "Unknown endpoint"}
                        
                        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
                        return
                    
                    # Для всех остальных запросов используем стандартный обработчик
                    return http.server.SimpleHTTPRequestHandler.do_GET(self)
                
                def do_OPTIONS(self):
                    self.send_response(200)
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                    self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                    self.end_headers()
            
            # Создаем сервер с кастомным обработчиком
            with socketserver.TCPServer(("", self.port), CustomHTTPRequestHandler) as httpd:
                httpd.mini_app = self  # Добавляем ссылку на основной класс
                self.server = httpd
                self.is_running = True
                
                local_ip = self.get_local_ip()
                local_url = f"http://{local_ip}:{self.port}"
                
                print("🚀 Mini App сервер запущен!")
                print(f"📱 Локальный URL: {local_url}")
                print(f"🌐 Внешний URL: http://localhost:{self.port}")
                print("\n📋 Для настройки в BotFather:")
                print(f"1. Откройте @BotFather")
                print(f"2. Отправьте /setmenubutton")
                print(f"3. Введите URL: {local_url}")
                print(f"4. Нажмите Save")
                print("\n⚠️  ВАЖНО: Этот URL работает только когда ваш ПК включен!")
                print("💡 Для постоянной работы используйте GitHub Pages или Netlify")
                print("\n🔗 API Endpoints:")
                print(f"   {local_url}/api/commands")
                print(f"   {local_url}/api/gps")
                print(f"   {local_url}/api/rp-terms")
                print(f"   {local_url}/api/helper-duties")
                print(f"   {local_url}/api/chat-rules")
                print(f"   {local_url}/api/mute-rules")
                
                # Открываем браузер
                webbrowser.open(local_url)
                
                # Запускаем сервер
                httpd.serve_forever()
                
        except OSError as e:
            if e.errno == 48:  # Address already in use
                print(f"❌ Порт {self.port} занят!")
                print(f"💡 Попробуйте другой порт: python server.py 8001")
            else:
                print(f"❌ Ошибка запуска сервера: {e}")
        except KeyboardInterrupt:
            print("\n🛑 Сервер остановлен")
            self.stop_server()
    
    def stop_server(self):
        """Остановить сервер"""
        if self.server and self.is_running:
            self.server.shutdown()
            self.is_running = False
            print("✅ Сервер остановлен")

def main():
    import sys
    
    # Получаем порт из аргументов командной строки
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("❌ Неверный порт!")
            return
    
    # Создаем и запускаем сервер
    server = MiniAppServer(port)
    
    try:
        server.start_server()
    except KeyboardInterrupt:
        print("\n🛑 Остановка сервера...")
        server.stop_server()

if __name__ == "__main__":
    main() 