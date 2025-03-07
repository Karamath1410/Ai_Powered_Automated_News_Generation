function updateNewsFeed() {
    fetch('/update_news')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error updating news:', data.error);
                return;
            }

            const newsContainer = document.querySelector('.news-container');
            if (!newsContainer) return;

            newsContainer.innerHTML = '';
            data.articles.forEach(article => {
                const articleElement = createArticleElement(article);
                newsContainer.appendChild(articleElement);
            });
        })
        .catch(error => console.error('Error fetching news:', error));
}

function createArticleElement(article) {
    const articleDiv = document.createElement('div');
    articleDiv.className = 'article';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'article-image-container';

    const img = document.createElement('img');
    img.src = article.image || '/static/images/placeholder.svg';
    img.alt = article.title;
    img.className = 'article-image';
    img.loading = 'lazy';
    img.onerror = function() {
        this.onerror = null;
        this.src = '/static/images/placeholder.svg';
    };

    const title = document.createElement('h2');
    const titleLink = document.createElement('a');
    titleLink.href = article.url;
    titleLink.target = '_blank';
    titleLink.rel = 'noopener';
    titleLink.textContent = article.title;
    title.appendChild(titleLink);

    const description = document.createElement('p');
    description.textContent = article.description;

    imageContainer.appendChild(img);
    articleDiv.appendChild(imageContainer);
    articleDiv.appendChild(title);
    articleDiv.appendChild(description);

    return articleDiv;
}

// Update news feed periodically
setInterval(updateNewsFeed, 300000); // Update every 5 minutes
