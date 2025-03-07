import os
import logging
from flask import Flask, request, render_template, redirect, url_for, flash, session, g, jsonify
import requests
from googletrans import Translator
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load environment variables before any other operation
load_dotenv()

# Create the Flask app
app = Flask(__name__)

# Configure secret key
app.secret_key = os.environ.get("SESSION_SECRET")

# Verify database URL is present
database_url = os.environ.get("DATABASE_URL")
if not database_url:
    raise RuntimeError("DATABASE_URL environment variable is not set")

logger.info("Configuring database with URL: %s", database_url.split("@")[1])  # Log only host/db part

# Configure PostgreSQL database
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# Initialize extensions
db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Define User model with extended language support
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)
    categories = db.Column(db.String(200))
    age = db.Column(db.Integer)
    gender = db.Column(db.String(10))
    preferred_language = db.Column(db.String(10), default='en')

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

@login_manager.user_loader
def load_user(id):
    return User.query.get(int(id))

SUPPORTED_LANGUAGES = {
    'en': 'English',
    'te': 'Telugu',
    'hi': 'Hindi',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ar': 'Arabic',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean'
}

def init_db():
    with app.app_context():
        try:
            db.create_all()
            print("Database initialized successfully")
        except Exception as e:
            print(f"Error initializing database: {e}")

init_db()

translator = Translator()

def fetch_news(api_key, query, language='en', limit=20):
    url = f"https://newsapi.org/v2/everything?q={query}&language={language}&apiKey={api_key}"
    try:
        response = requests.get(url)
        data = response.json()
        if data.get('status') != 'ok':
            print(f"News API error: {data.get('message')}")
            return []

        articles = data.get('articles', [])[:limit]
        processed_articles = []

        for article in articles:
            processed_article = {
                'title': article.get('title', ''),
                'description': article.get('description', ''),
                'url': article.get('url', ''),
                'image': article.get('urlToImage') if article.get('urlToImage') else '/static/images/placeholder.svg'
            }
            processed_articles.append(processed_article)

        return processed_articles
    except Exception as e:
        print(f"Error fetching news: {e}")
        return []

def translate_articles(articles, dest_language):
    if dest_language == 'en':
        return articles

    translated_articles = []
    for article in articles:
        try:
            translated_article = {
                'title': translator.translate(article['title'], dest=dest_language).text,
                'description': translator.translate(article['description'], dest=dest_language).text if article['description'] else '',
                'url': article['url'],
                'image': article['image']
            }
        except Exception as e:
            print(f"Error translating article: {e}")
            translated_article = article
        translated_articles.append(translated_article)
    return translated_articles

def fetch_fact_check(query, api_key):
    url = f"https://factchecktools.googleapis.com/v1alpha1/claims:search?query={query}&key={api_key}"
    try:
        response = requests.get(url)
        if response.status_code != 200:
            print(f"Fact Check API error: {response.status_code}")
            return []
        return response.json().get('claims', [])
    except Exception as e:
        print(f"Error fetching fact checks: {e}")
        return []

@app.route('/profile')
@login_required
def profile():
    categories = current_user.categories.split(',') if current_user.categories else []
    return render_template('profile.html', 
                         user=current_user, 
                         categories=categories,
                         languages=SUPPORTED_LANGUAGES)

@app.route('/api/update_preferences', methods=['POST'])
@login_required
def update_preferences():
    try:
        data = request.get_json()

        if 'categories' in data:
            categories = data['categories']
            if isinstance(categories, list):
                current_user.categories = ','.join(categories)

        if 'language' in data:
            language = data['language']
            if language in SUPPORTED_LANGUAGES:
                current_user.preferred_language = language

        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/', methods=['GET', 'POST'])
def home():
    query = 'latest news'
    language = 'en'
    user_data = None

    if current_user.is_authenticated:
        language = current_user.preferred_language
        if current_user.categories:
            categories = [cat.strip() for cat in current_user.categories.split(',') if cat.strip()]
            if categories:
                query = ' OR '.join(categories)
                user_data = {
                    "username": current_user.username,
                    "categories": categories,
                    "preferred_language": current_user.preferred_language
                }

    if request.method == 'POST':
        query = request.form.get('query', 'latest news')
        language = request.form.get('language', 'en')

    news_api_key = os.getenv("news_api_key")
    fact_check_api_key = os.getenv("fact_check_api_key")

    articles = fetch_news(news_api_key, query)

    if language != 'en':
        articles = translate_articles(articles, language)

    fact_checks = fetch_fact_check(query, fact_check_api_key)

    return render_template('index.html',
                         articles=articles,
                         fact_checks=fact_checks,
                         selected_language=language,
                         languages=SUPPORTED_LANGUAGES,
                         user=user_data)

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for('home'))

    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        categories = request.form.getlist('categories')
        if not categories:
            flash('Please select at least one category', 'danger')
            return redirect(url_for('signup'))
        selected_categories = ','.join(categories)
        age = request.form['age']
        gender = request.form['gender']

        if User.query.filter_by(username=username).first():
            flash('Username already exists', 'danger')
            return redirect(url_for('signup'))

        user = User(username=username, categories=selected_categories, age=age, gender=gender)
        user.set_password(password)
        try:
            db.session.add(user)
            db.session.commit()
            flash('Registration successful! Please login.', 'success')
            return redirect(url_for('login'))
        except Exception as e:
            db.session.rollback()
            print(f"Error during registration: {e}")
            flash('Registration failed. Please try again.', 'danger')
            return redirect(url_for('signup'))

    return render_template('signup.html', languages=SUPPORTED_LANGUAGES)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('home'))

    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user)
            flash('Login successful!', 'success')
            next_page = request.args.get('next')
            return redirect(next_page if next_page else url_for('home'))
        else:
            flash('Invalid username or password', 'danger')
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'success')
    return redirect(url_for('login'))

@app.route('/guest')
def guest():
    return redirect(url_for('home'))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)