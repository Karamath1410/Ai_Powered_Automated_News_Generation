# AI-Powered Automated News Generation

A Flask-based news platform with enhanced category management functionality, supporting 10+ languages and providing flexible user category customization.

## Prerequisites
Before starting, ensure you have:
1. Python 3.11 or higher installed
2. PostgreSQL installed and running
3. News API key from newsapi.org
4. Google Fact Check API key

## Database Setup (Important!)
1. Install PostgreSQL:
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Mac: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql`

2. Start PostgreSQL service:
   - Windows: PostgreSQL service should start automatically
   - Mac: `brew services start postgresql`
   - Linux: `sudo service postgresql start`

3. Create the database:
```sql
psql -U postgres
CREATE DATABASE news_db;
\q
```

## Installation Steps

1. Extract the project files:
```bash
unzip project.zip
cd project
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Unix or MacOS:
source venv/bin/activate
```

3. Install the project:
```bash
pip install .
```

4. Configure environment variables:
Create a `.env` file with:
```ini
# Required API keys
news_api_key=your_news_api_key
fact_check_api_key=your_fact_check_api_key

# Security
SESSION_SECRET=your_secret_here_make_it_very_secure_and_unique

# Database configuration
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/news_db
```

5. Run the application:
```bash
python app.py
```

The application will be available at `http://localhost:5000`

## Project Structure
```
.
├── app.py              # Main application file
├── static/            
│   ├── js/            # JavaScript files
│   │   ├── category-manager.js  # Category management
│   │   ├── image-handler.js     # Image loading and optimization
│   │   └── profile.js          # User profile management
│   └── styles.css     # CSS styles
├── templates/          # HTML templates
│   ├── index.html     # Main news page
│   ├── login.html     # Authentication
│   ├── profile.html   # User settings
│   └── signup.html    # Registration
├── .env               # Environment configuration
└── README.md          # Documentation
```

## Features in Detail

### 1. User Management
- User registration with preferences
- Secure authentication
- Guest access option
- Profile customization

### 2. News Categories
- Dynamic category selection
- Personalized news feed
- Category-based filtering
- Drag-and-drop reordering

### 3. Multilingual Support
- 10+ language options
- Real-time translation
- Language preference saving
- Interface localization

### 4. News Feed
- Real-time updates
- Image optimization
- Lazy loading
- Responsive layout

### 5. Fact Checking
- Integrated fact verification
- Real-time claim checking
- Source verification
- Rating system

## Development Guidelines
1. Follow Flask best practices
2. Use SQLAlchemy for database operations
3. Implement proper error handling
4. Maintain code documentation
5. Follow responsive design principles

## Troubleshooting

### Common Issues
1. Database Connection:
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env
   - Ensure database exists

2. API Keys:
   - Verify API keys are valid
   - Check .env file configuration
   - Monitor API rate limits

3. Translation Issues:
   - Check language codes
   - Verify Google Translate API access
   - Monitor translation quotas

## Support
For issues or questions, please:
1. Check the troubleshooting guide
2. Review error logs
3. Contact support with detailed information

## Security Notes
- Keep API keys secure
- Use strong SESSION_SECRET
- Never commit .env file
- Regular security updates