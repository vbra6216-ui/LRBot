// Глобальное состояние приложения для Admin Bot
const adminAppState = {
    userData: null,
    tg: null
};

// Элементы DOM для Admin Bot
const adminElements = {
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.querySelector('.search-btn'),
    searchModal: document.getElementById('searchModal'),
    closeSearchModal: document.getElementById('closeSearchModal'),
    searchResultsList: document.getElementById('searchResultsList')
};

// Модальное окно поиска для Admin Bot
const adminSearchModal = {
    modal: null,
    content: null,
    closeBtn: null,
    
    init() {
        this.modal = document.getElementById('searchModal');
        this.content = document.getElementById('searchResultsList');
        this.closeBtn = document.getElementById('closeSearchModal');
        
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.hide());
        }
        
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.hide();
                }
            });
        }
        
        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hide();
            }
        });
    },
    
    show() {
        if (this.modal) {
            this.modal.style.display = 'flex';
        }
    },
    
    hide() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    },
    
    setContent(html) {
        if (this.content) {
            this.content.innerHTML = html;
        }
    }
};

// Инициализация Admin Bot
async function initializeAdminApp() {
    try {
        // Инициализация Telegram Web App
        if (window.Telegram && window.Telegram.WebApp) {
            adminAppState.tg = window.Telegram.WebApp;
            adminAppState.tg.ready();
            adminAppState.tg.expand();
        }

        // Инициализация модального окна
        adminSearchModal.init();

        // Настройка обработчиков событий
        setupAdminEventListeners();

        console.log('Admin Bot инициализирован');
    } catch (error) {
        console.error('Ошибка инициализации Admin Bot:', error);
    }
}

// Настройка обработчиков событий для Admin Bot
function setupAdminEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performAdminSearch();
            }
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', performAdminSearch);
    }
}

// Функция поиска для Admin Bot
function performAdminSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) {
        console.log('Search input not found in Admin Bot');
        return;
    }
    
    const query = searchInput.value.toLowerCase().trim();

    if (query.length < 2) {
        adminSearchModal.hide();
        return;
    }

    // Показываем модальное окно
    adminSearchModal.show();
    
    // Имитируем задержку поиска
    setTimeout(() => {
        const results = performAdminSearchLogic(query);
        displayAdminSearchResults(results);
    }, 300);
}

// Логика поиска для Admin Bot
function performAdminSearchLogic(query) {
    const results = [];
    const words = query.split(/\s+/).filter(Boolean);
    if (words.length === 0) return results;

    // Для Admin Bot пока возвращаем пустой результат
    // В будущем здесь можно добавить поиск по административным данным
    console.log('Admin Bot поиск по запросу:', query);
    
    return results;
}

// Отображение результатов поиска для Admin Bot
function displayAdminSearchResults(results) {
    if (results.length === 0) {
        adminSearchModal.setContent(`
            <div class="no-search-results">
                <div class="no-search-results-icon">🔍</div>
                <div class="no-search-results-title">Ничего не найдено</div>
                <div class="no-search-results-desc">Попробуйте изменить запрос</div>
            </div>
        `);
    } else {
        const resultsHtml = results.map(result => `
            <div class="search-result-item" onclick="handleAdminResultClick('${result.type}', '${result.title}')">
                <div class="search-result-title">${result.title}</div>
                <div class="search-result-desc">${result.description}</div>
                <div class="search-result-category">${result.category}</div>
            </div>
        `).join('');
        
        adminSearchModal.setContent(resultsHtml);
    }

    adminSearchModal.show();
}

// Обработка клика по результату для Admin Bot
function handleAdminResultClick(type, title) {
    console.log('Admin Bot: Выбран результат:', type, title);
    adminSearchModal.hide();
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', initializeAdminApp); 