from setuptools import setup, find_packages

setup(
    name="ai-news-platform",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        'flask',
        'flask-sqlalchemy',
        'flask-login',
        'flask-wtf',
        'psycopg2-binary',
        'email-validator',
        'gunicorn',
        'googletrans==3.1.0a0',
        'python-dotenv',
        'requests',
        'urllib3'
    ],
    python_requires='>=3.11',
)
