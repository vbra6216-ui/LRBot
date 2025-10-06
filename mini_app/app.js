// Глобальное состояние приложения
const appState = {
    userData: null,
    commands: [],
    categories: {},
    gpsData: {},
    rpTerms: {},
    helperDuties: {},
    chatRules: {},
    muteRules: {},
    currentSection: 'main',
    searchResults: [],
    tg: null
};

// Русские соответствия для RP-терминов
const rpTermsRussian = {
    'RP': 'РП',
    'DM': 'ДМ',
    'DB': 'ДБ',
    'SK': 'СК',
    'TK': 'ТК',
    'PG': 'ПГ',
    'RK': 'РК',
    'MG': 'МГ',
    'BX': 'ВХ',
    'YK': 'УК',
    'AK': 'АК',
    'ZZ': 'ЗЗ',
    'FR': 'ФР',
    'FM': 'ФМ',
    'SH': 'СХ',
    'FF': 'ФФ',
    'FearRP': 'FearRp',
    'OOC': 'ООС',
    'IC': 'ИК'
};

// Элементы DOM
const elements = {

    burgerMenuBtn: document.getElementById('burgerMenuBtn'),
    burgerMenu: document.getElementById('burgerMenu'),
    closeBurgerMenu: document.getElementById('closeBurgerMenu'),

    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    searchSuggestions: document.getElementById('searchSuggestions'),

    resultsSection: document.getElementById('resultsSection'),
    resultsTitle: document.getElementById('resultsTitle'),
    resultsContainer: document.getElementById('resultsContainer'),
    clearResults: document.getElementById('clearResults'),

    categoriesSection: document.getElementById('categoriesSection'),
    categoriesGrid: document.getElementById('categoriesGrid'),
    backToMain: document.getElementById('backToMain'),

    gpsSection: document.getElementById('gpsSection'),
    gpsContent: document.getElementById('gpsContent'),
    backFromGPS: document.getElementById('backFromGPS'),

    rpTermsSection: document.getElementById('rpTermsSection'),
    rpTermsContent: document.getElementById('rpTermsContent'),
    backFromRPTerms: document.getElementById('backFromRPTerms'),

    helperDutiesSection: document.getElementById('helperDutiesSection'),
    helperDutiesContent: document.getElementById('helperDutiesContent'),
    backFromHelperDuties: document.getElementById('backFromHelperDuties'),

    chatRulesSection: document.getElementById('chatRulesSection'),
    chatRulesContent: document.getElementById('chatRulesContent'),
    backFromChatRules: document.getElementById('backFromChatRules'),

    muteRulesSection: document.getElementById('muteRulesSection'),
    muteRulesContent: document.getElementById('muteRulesContent'),
    backFromMuteRules: document.getElementById('backFromMuteRules'),

    premiumSection: document.getElementById('premiumSection'),
    premiumContent: document.getElementById('premiumContent'),
    backFromPremium: document.getElementById('backFromPremium'),

    categorySection: document.getElementById('categorySection'),
    categoryTitle: document.getElementById('categoryTitle'),
    categoryContent: document.getElementById('categoryContent'),
    backFromCategory: document.getElementById('backFromCategory'),

    loadingOverlay: document.getElementById('loadingOverlay')
};

// Модальное окно поиска
const searchModal = {
    modal: null,
    content: null,
    closeBtn: null,
    
    init() {
        this.modal = document.getElementById('searchModal');
        this.content = document.getElementById('searchResultsList');
        this.closeBtn = document.getElementById('closeSearchModal');
    },
    
    show() {
        if (!this.modal) this.init();
        if (this.modal) {
            this.modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },
    
    hide() {
        if (!this.modal) this.init();
        if (this.modal) {
            this.modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },
    
    setContent(html) {
        if (!this.content) this.init();
        if (this.content) {
            this.content.innerHTML = html;
        }
    }
};

// Инициализация приложения
async function initializeApp() {
    try {
        // Инициализируем Telegram Web App
        if (window.Telegram && window.Telegram.WebApp) {
            appState.tg = window.Telegram.WebApp;
            appState.tg.ready();
            appState.tg.expand();

            // Устанавливаем тему
            if (appState.tg.colorScheme === 'dark') {
                document.body.classList.add('dark-theme');
            }

            console.log('Telegram Web App инициализирован');
        } else {
            console.log('Telegram Web App недоступен, запускаем в режиме тестирования');
            // Устанавливаем темную тему по умолчанию для тестирования
            document.body.classList.add('dark-theme');
        }

        // Загружаем все данные сразу
        await loadAllData();

        // Настраиваем обработчики событий
        setupEventListeners();

        // Показываем главную страницу
        showMainSection();

        // Загружаем профиль пользователя
        await loadUserProfileFromTelegram();

    } catch (error) {
        console.error('Ошибка инициализации приложения:', error);

        // Показываем главную страницу даже при ошибке
        showMainSection();

        // Пытаемся загрузить профиль пользователя
        await loadUserProfileFromTelegram();
    }
}

// Загрузка команд из API
async function loadCommands() {
    try {
        const commandsUrl = (typeof window !== 'undefined' && window.COMMANDS_JSON) ? window.COMMANDS_JSON : 'commands.json';
        const response = await fetch(commandsUrl);
        const commands = await response.json();
        appState.commands = commands;

        // Группируем команды по категориям
        appState.categories = {};
        commands.forEach(command => {
            if (!appState.categories[command.category]) {
                appState.categories[command.category] = [];
            }
            appState.categories[command.category].push(command);
        });

        console.log('Команды загружены:', commands.length);
    } catch (error) {
        console.error('Ошибка загрузки команд:', error);
        appState.commands = [];
    }
}

// Загрузка профиля пользователя из Telegram
async function loadUserProfileFromTelegram() {
    try {
        let userData = null;

        // Проверяем, есть ли Telegram Web App
        if (appState.tg && appState.tg.initDataUnsafe?.user) {
            const user = appState.tg.initDataUnsafe.user;
            console.log('Данные пользователя из Telegram:', user);

            // Формируем объект пользователя из Telegram
            userData = {
                telegram_id: user.id,
                username: user.username || `user_${user.id}`,
                first_name: user.first_name || 'Пользователь',
                last_name: user.last_name || '',
                language_code: user.language_code || 'ru',
                is_premium: user.is_premium || false,
                added_to_attachment_menu: user.added_to_attachment_menu || false,
                allows_write_to_pm: user.allows_write_to_pm || false,
                photo_url: user.photo_url || null,
                // Статистика из локального хранилища или API
                search_count: getLocalStorageValue('search_count', 0),
                favorites_count: getLocalStorageValue('favorites_count', 0),
                commands_used: getLocalStorageValue('commands_used', 0),
                last_active: new Date().toISOString(),
                achievements: getLocalStorageValue('achievements', [])
            };
        } else {
            // Создаем fallback данные пользователя для тестирования
            console.log('Telegram Web App не доступен, создаем тестового пользователя');

            // Пытаемся получить сохраненные данные из localStorage
            const savedUserId = localStorage.getItem('tg_user_id');
            const savedUsername = localStorage.getItem('tg_user_username');
            const savedFirstName = localStorage.getItem('tg_user_first_name');

            userData = {
                telegram_id: savedUserId || Math.floor(Math.random() * 1000000),
                username: savedUsername || 'test_user',
                first_name: savedFirstName || 'Тестовый',
                last_name: 'Пользователь',
                language_code: 'ru',
                is_premium: false,
                added_to_attachment_menu: false,
                allows_write_to_pm: false,
                photo_url: null,
                // Статистика из локального хранилища
                search_count: getLocalStorageValue('search_count', 0),
                favorites_count: getLocalStorageValue('favorites_count', 0),
                commands_used: getLocalStorageValue('commands_used', 0),
                last_active: new Date().toISOString(),
                achievements: getLocalStorageValue('achievements', [])
            };

            // Сохраняем тестовые данные
            localStorage.setItem('tg_user_id', userData.telegram_id);
            localStorage.setItem('tg_user_username', userData.username);
            localStorage.setItem('tg_user_first_name', userData.first_name);
        }

        appState.userData = userData;

        // Сохраняем данные в локальное хранилище
        saveUserDataToStorage(userData);

    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);

        // Создаем минимальные данные пользователя в случае ошибки
        const fallbackUserData = {
            telegram_id: Math.floor(Math.random() * 1000000),
            username: 'user',
            first_name: 'Пользователь',
            last_name: '',
            language_code: 'ru',
            is_premium: false,
            added_to_attachment_menu: false,
            allows_write_to_pm: false,
            photo_url: null,
            search_count: 0,
            favorites_count: 0,
            commands_used: 0,
            last_active: new Date().toISOString(),
            achievements: []
        };

        appState.userData = fallbackUserData;
        saveUserDataToStorage(fallbackUserData);
    }
}

// Загрузка всех данных
async function loadAllData() {
    try {
        if (window.RODINA_MODE) {
            await loadCommands();
        } else {
            await Promise.all([
                loadCommands(),
                loadGPSData(),
                loadRPTerms(),
                loadHelperDuties(),
                loadChatRules(),
                loadMuteRules()
            ]);
        }
        console.log('Все данные загружены');
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

// Загрузка GPS данных
async function loadGPSData() {
    try {
        const response = await fetch('gps.json');
        if (!response.ok) throw new Error('Ошибка загрузки GPS данных');
        appState.gpsData = await response.json();
    } catch (error) {
        console.error('Ошибка загрузки GPS данных:', error);
        appState.gpsData = {};
    }
}

// Загрузка RP терминов
async function loadRPTerms() {
    try {
        const response = await fetch('rp_terms.json');
        if (!response.ok) throw new Error('Ошибка загрузки RP терминов');
        appState.rpTerms = await response.json();
    } catch (error) {
        console.error('Ошибка загрузки RP терминов:', error);
        appState.rpTerms = {};
    }
}

// Загрузка обязанностей хелпера
async function loadHelperDuties() {
    try {
        const response = await fetch('helper_duties.json');
        if (!response.ok) throw new Error('Ошибка загрузки обязанностей хелпера');
        appState.helperDuties = await response.json();
    } catch (error) {
        console.error('Ошибка загрузки обязанностей хелпера:', error);
        appState.helperDuties = {};
    }
}

// Загрузка правил чата
async function loadChatRules() {
    try {
        const response = await fetch('support_chat_rules.json');
        if (!response.ok) throw new Error('Ошибка загрузки правил чата');
        appState.chatRules = await response.json();
    } catch (error) {
        console.error('Ошибка загрузки правил чата:', error);
        appState.chatRules = {};
    }
}

// Загрузка правил мута
async function loadMuteRules() {
    try {
        const response = await fetch('hmute_rules.json');
        if (!response.ok) throw new Error('Ошибка загрузки правил мута');
        appState.muteRules = await response.json();
    } catch (error) {
        console.error('Ошибка загрузки правил мута:', error);
        appState.muteRules = {};
    }
}

// Получить значение из localStorage
function getLocalStorageValue(key, defaultValue) {
    try {
        const value = localStorage.getItem(`tg_user_${key}`);
        return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
        console.error('Ошибка чтения из localStorage:', error);
        return defaultValue;
    }
}

// Сохранить данные пользователя в localStorage
function saveUserDataToStorage(userData) {
    try {
        localStorage.setItem('tg_user_search_count', JSON.stringify(userData.search_count));
        localStorage.setItem('tg_user_favorites_count', JSON.stringify(userData.favorites_count));
        localStorage.setItem('tg_user_commands_used', JSON.stringify(userData.commands_used));
        localStorage.setItem('tg_user_achievements', JSON.stringify(userData.achievements));
        localStorage.setItem('tg_user_last_active', JSON.stringify(userData.last_active));
    } catch (error) {
        console.error('Ошибка сохранения в localStorage:', error);
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Бургер меню
    if (elements.burgerMenuBtn && elements.burgerMenu && elements.closeBurgerMenu) {
        elements.burgerMenuBtn.addEventListener('click', showBurgerMenu);
        elements.closeBurgerMenu.addEventListener('click', hideBurgerMenu);

        // Закрытие бургер меню при клике вне его
        document.addEventListener('click', function(event) {
            if (event.target === elements.burgerMenu) {
                hideBurgerMenu();
            }
        });
    }

    // Поиск
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', handleSearchInput);
        elements.searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    if (elements.searchBtn) {
        elements.searchBtn.addEventListener('click', performSearch);
    }
    
    if (elements.clearResults) {
        elements.clearResults.addEventListener('click', clearSearchResults);
    }

    // Быстрые действия - исправляем обработчики
    document.addEventListener('click', function(event) {
        const actionCard = event.target.closest('.action-card');
        if (actionCard) {
            const href = actionCard.getAttribute('href');
            if (href) {
                // Если это ссылка-якорь на внутреннее действие, предотвращаем переход
                if (!href.includes('.html')) {
                    event.preventDefault();
                    handleActionClick(href);
                    return;
                }

                // Переход на внешние страницы .html
                window.location.href = href;
            }
        }
    });

    // Кнопки "Назад"
    if (elements.backToMain) {
        elements.backToMain.addEventListener('click', showMainSection);
    }
    if (elements.backFromGPS) {
        elements.backFromGPS.addEventListener('click', showMainSection);
    }
    if (elements.backFromRPTerms) {
        elements.backFromRPTerms.addEventListener('click', showMainSection);
    }
    if (elements.backFromHelperDuties) {
        elements.backFromHelperDuties.addEventListener('click', showMainSection);
    }
    if (elements.backFromChatRules) {
        elements.backFromChatRules.addEventListener('click', showMainSection);
    }
    if (elements.backFromMuteRules) {
        elements.backFromMuteRules.addEventListener('click', showMainSection);
    }
    if (elements.backFromPremium) {
        elements.backFromPremium.addEventListener('click', showMainSection);
    }
    if (elements.backFromCategory) {
        elements.backFromCategory.addEventListener('click', showCategoriesSection);
    }

    // Модальное окно поиска
    if (searchModal.closeBtn) {
        searchModal.closeBtn.addEventListener('click', () => searchModal.hide());
    }

    // Закрытие модального окна при клике на фон
    if (searchModal.modal) {
        searchModal.modal.addEventListener('click', function(e) {
            if (e.target === searchModal.modal) {
                searchModal.hide();
            }
        });
    }

    // Закрытие модального окна по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            searchModal.hide();
        }
    });
}



// Показать бургер меню
function showBurgerMenu() {
    elements.burgerMenu.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Блокируем скролл
}

// Скрыть бургер меню
function hideBurgerMenu() {
    elements.burgerMenu.style.display = 'none';
    document.body.style.overflow = ''; // Возвращаем скролл
}



// Обработка ввода в поиск
function handleSearchInput(event) {
    const query = event.target.value.toLowerCase().trim();
    const searchSuggestions = document.getElementById('searchSuggestions');
    
    if (!searchSuggestions) return;

    if (query.length < 2) {
        searchSuggestions.innerHTML = '';
        return;
    }

    // Показываем подсказки
    showSearchSuggestions(query);
}

// Показать подсказки поиска
function showSearchSuggestions(query) {
    const searchSuggestions = document.getElementById('searchSuggestions');
    if (!searchSuggestions) return;
    
    const suggestions = [];

    // Добавляем команды
    if (appState.commands.length > 0) {
        const matchingCommands = appState.commands.filter(cmd =>
            cmd.command.toLowerCase().includes(query) ||
            cmd.description.toLowerCase().includes(query)
        ).slice(0, 2);

        suggestions.push(...matchingCommands.map(cmd => ({
            type: 'command',
            text: cmd.command,
            description: cmd.description,
            icon: '🔧'
        })));
    }

    // В Rodina режиме скрываем GPS из подсказок
    if (!window.RODINA_MODE && appState.gpsData) {
        Object.entries(appState.gpsData).forEach(([category, locations]) => {
            if (Array.isArray(locations)) {
                const matchingLocations = locations.filter(location =>
                    location.toLowerCase().includes(query) ||
                    category.toLowerCase().includes(query)
                ).slice(0, 1);

                suggestions.push(...matchingLocations.map(location => ({
                    type: 'gps',
                    text: location,
                    description: `📍 ${category}`,
                    icon: '📍'
                })));
            }
        });
    }

    // В Rodina режиме скрываем RP термины
    if (!window.RODINA_MODE && appState.rpTerms) {
        Object.entries(appState.rpTerms).forEach(([term, description]) => {
            // Проверяем оригинальный термин
            if (term.toLowerCase().includes(query) ||
                description.toLowerCase().includes(query)) {
                suggestions.push({
                    type: 'rp',
                    text: term,
                    description: description,
                    icon: '📖'
                });
            }
            // Проверяем русский вариант термина
            const russianTerm = rpTermsRussian[term];
            if (russianTerm && (russianTerm.toLowerCase().includes(query) ||
                description.toLowerCase().includes(query))) {
                suggestions.push({
                    type: 'rp',
                    text: term,
                    description: description,
                    icon: '📖'
                });
            }
        });
    }

    // Ограничиваем количество подсказок
    suggestions.splice(3);

    // Отображаем подсказки
    searchSuggestions.innerHTML = suggestions.map(suggestion => `
        <div class="suggestion-item" data-type="${suggestion.type}" data-text="${suggestion.text}">
            <div class="suggestion-icon">${suggestion.icon}</div>
            <div class="suggestion-content">
                <div class="suggestion-text">${suggestion.text}</div>
                <div class="suggestion-desc">${suggestion.description}</div>
            </div>
        </div>
    `).join('');

    // Добавляем обработчики кликов
    searchSuggestions.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = item.dataset.text;
            }
            searchSuggestions.innerHTML = '';
            performSearch();
        });
    });
}

// Выполнить поиск
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) {
        console.log('Search input not found');
        return;
    }
    
    const query = searchInput.value.toLowerCase().trim();

    if (query.length < 2) {
        hideSearchResults();
        return;
    }

    showLoading();

    // Имитируем задержку поиска
    setTimeout(() => {
        const results = performSearchLogic(query);
        displaySearchResults(results);
        hideLoading();

        // Увеличиваем счетчик поисков
        if (appState.userData) {
            updateUserSearchCount();
            updateUserCommandsUsed();
        }
    }, 500);
}

// Логика поиска
function performSearchLogic(query) {
    const results = [];
    const words = query.split(/\s+/).filter(Boolean);
    if (words.length === 0) return results;



    // Поиск по командам
    if (appState.commands && appState.commands.length > 0) {
        const matchingCommands = appState.commands.filter(cmd => {
            const text = `${cmd.command} ${cmd.description} ${cmd.category}`.toLowerCase();
            return words.some(word => text.includes(word));
        });
        results.push(...matchingCommands.map(cmd => ({
            type: 'command',
            title: cmd.command,
            description: cmd.description,
            category: cmd.category
        })));
    }

    // В Rodina режиме отключаем поиск по GPS
    if (!window.RODINA_MODE && appState.gpsData && Object.keys(appState.gpsData).length > 0) {
        Object.entries(appState.gpsData).forEach(([category, locations]) => {
            if (Array.isArray(locations)) {
                const matchingLocations = locations.filter(location => {
                    const text = `${location} ${category}`.toLowerCase();
                    return words.some(word => text.includes(word));
                });
                results.push(...matchingLocations.map(location => ({
                    type: 'gps',
                    title: location,
                    description: `📍 ${category}`,
                    category: category
                })));
            }
        });
    }

    // В Rodina режиме отключаем поиск по RP терминам
    if (!window.RODINA_MODE && appState.rpTerms && Object.keys(appState.rpTerms).length > 0) {
        Object.entries(appState.rpTerms).forEach(([term, description]) => {
            // Проверяем оригинальный термин
            const text = `${term} ${description}`.toLowerCase();
            if (words.some(word => text.includes(word))) {
                results.push({
                    type: 'rp',
                    title: term,
                    description: description,
                    category: 'RP термины'
                });
            }
            // Проверяем русский вариант термина
            const russianTerm = rpTermsRussian[term];
            if (russianTerm) {
                const russianText = `${russianTerm} ${description}`.toLowerCase();
                if (words.some(word => russianText.includes(word))) {
                    results.push({
                        type: 'rp',
                        title: term,
                        description: description,
                        category: 'RP термины'
                    });
                }
            }
        });
    }

    // В Rodina режиме отключаем обязанности хелпера
    if (!window.RODINA_MODE && appState.helperDuties && Object.keys(appState.helperDuties).length > 0) {
        Object.entries(appState.helperDuties).forEach(([section, duties]) => {
            if (Array.isArray(duties)) {
                const matchingDuties = duties.filter(duty => {
                    const text = `${duty} ${section}`.toLowerCase();
                    return words.some(word => text.includes(word));
                });
                results.push(...matchingDuties.map(duty => ({
                    type: 'helper',
                    title: duty,
                    description: `👨‍💼 ${section}`,
                    category: section
                })));
            }
        });
    }

    // В Rodina режиме отключаем правила чата
    if (!window.RODINA_MODE && appState.chatRules && Object.keys(appState.chatRules).length > 0) {
        Object.entries(appState.chatRules).forEach(([rule, description]) => {
            const text = `${rule} ${description}`.toLowerCase();
            if (words.some(word => text.includes(word))) {
                results.push({
                    type: 'chat',
                    title: rule,
                    description: description,
                    category: 'Правила чата'
                });
            }
        });
    }

    // В Rodina режиме отключаем правила мута
    if (!window.RODINA_MODE && appState.muteRules && Object.keys(appState.muteRules).length > 0) {
        Object.entries(appState.muteRules).forEach(([rule, description]) => {
            const text = `${rule} ${description}`.toLowerCase();
            if (words.some(word => text.includes(word))) {
                results.push({
                    type: 'mute',
                    title: rule,
                    description: description,
                    category: 'Правила мута'
                });
            }
        });
    }


    return results;
}

// Отобразить результаты поиска
function displaySearchResults(results) {
    if (results.length === 0) {
        searchModal.setContent(`
            <div class="no-search-results">
                <div class="no-search-results-icon">🔍</div>
                <div class="no-search-results-title">Ничего не найдено</div>
                <div class="no-search-results-desc">Попробуйте изменить запрос</div>
            </div>
        `);
    } else {
        const resultsHtml = results.map(result => `
            <div class="search-result-item" onclick="handleSearchResultClick('${result.type}', '${result.title}')">
                <div class="search-result-title">${result.title}</div>
                <div class="search-result-desc">${result.description}</div>
                <div class="search-result-category">${result.category}</div>
            </div>
        `).join('');
        
        searchModal.setContent(resultsHtml);
    }

    searchModal.show();
}

// Обработка клика по результату поиска
function handleSearchResultClick(type, title) {
    console.log('Выбран результат:', type, title);
    // Здесь можно добавить логику для обработки выбора результата
    searchModal.hide();
}

// Получить иконку для результата
function getResultIcon(type) {
    const icons = {
        command: '🔧',
        gps: '📍',
        rp: '📖',
        helper: '👨‍💼',
        chat: '💬',
        mute: '🔇'
    };
    return icons[type] || '📄';
}

// Показать результаты поиска
function showSearchResults() {
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'block';
    }
    appState.currentSection = 'search';
}

// Скрыть результаты поиска
function hideSearchResults() {
    const resultsSection = document.getElementById('resultsSection');
    const searchSuggestions = document.getElementById('searchSuggestions');
    
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }
    if (searchSuggestions) {
        searchSuggestions.innerHTML = '';
    }
}

// Очистить результаты поиска
function clearSearchResults() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    searchModal.hide();
    showMainSection();
}

// Обновить счетчик поисков
async function updateUserSearchCount() {
    if (!appState.userData) return;

    try {
        const newCount = (appState.userData.search_count || 0) + 1;
        appState.userData.search_count = newCount;
        if (elements.searchCount) {
            elements.searchCount.textContent = newCount;
        }

        // Сохраняем в localStorage
        localStorage.setItem('tg_user_search_count', JSON.stringify(newCount));

        // Обновляем время последней активности
        appState.userData.last_active = new Date().toISOString();
        localStorage.setItem('tg_user_last_active', JSON.stringify(appState.userData.last_active));

    } catch (error) {
        console.error('Ошибка обновления счетчика поисков:', error);
    }
}

// Обновить счетчик использованных команд
function updateUserCommandsUsed() {
    if (!appState.userData) return;

    try {
        const newCount = (appState.userData.commands_used || 0) + 1;
        appState.userData.commands_used = newCount;
        if (elements.commandsUsed) {
            elements.commandsUsed.textContent = newCount;
        }

        // Сохраняем в localStorage
        localStorage.setItem('tg_user_commands_used', JSON.stringify(newCount));

    } catch (error) {
        console.error('Ошибка обновления счетчика команд:', error);
    }
}



// Обработка клика по действию
function handleActionClick(action) {
    console.log('Клик по действию:', action);

    switch (action) {
        case 'categories':
            showCategoriesSection();
            break;
        case 'all-commands':
            showAllCommandsSection();
            break;
        case 'premium':
            showPremiumSection();
            break;
        default:
            console.log('Неизвестное действие:', action);
    }
}

// Показать секцию категорий
function showCategoriesSection() {
    hideAllSections();
    elements.categoriesSection.style.display = 'block';
    appState.currentSection = 'categories';

    displayCategories();
}

// Отобразить категории
function displayCategories() {
    if (!appState.commands.length) {
        loadCommands().then(() => displayCategories());
        return;
    }

    const categories = {};
    appState.commands.forEach(cmd => {
        if (!categories[cmd.category]) {
            categories[cmd.category] = [];
        }
        categories[cmd.category].push(cmd);
    });

    elements.categoriesGrid.innerHTML = Object.entries(categories).map(([category, commands]) => `
        <div class="category-card" data-category="${category}">
            <div class="category-icon">${getCategorySVG(category)}</div>
            <div class="category-name">${category}</div>
            <div class="category-count">${commands.length} команд</div>
        </div>
    `).join('');

    // Добавляем обработчики кликов
    elements.categoriesGrid.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            showCategoryCommands(category);
        });
    });
}

// Получить SVG для категории
function getCategorySVG(category) {
    const icons = {
        'Общие': `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="18" height="14" rx="2" stroke="#7B61FF" stroke-width="2"/><path d="M3 8H21" stroke="#7B61FF" stroke-width="2"/></svg>`,
        'Автомобиль': `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="11" width="18" height="6" rx="2" stroke="#7B61FF" stroke-width="2"/><circle cx="7" cy="18" r="2" fill="#7B61FF"/><circle cx="17" cy="18" r="2" fill="#7B61FF"/></svg>`,
        'Дом': `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 10L12 3L21 10V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V10Z" stroke="#7B61FF" stroke-width="2"/><rect x="9" y="14" width="6" height="7" fill="#7B61FF"/></svg>`,
        'Бизнес': `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="7" width="18" height="14" rx="2" stroke="#7B61FF" stroke-width="2"/><rect x="7" y="3" width="10" height="4" rx="2" stroke="#7B61FF" stroke-width="2"/></svg>`,
        'Армия': `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="12,2 15,8 22,9 17,14 18,21 12,18 6,21 7,14 2,9 9,8" stroke="#7B61FF" stroke-width="2" fill="none"/></svg>`,
        'Семья': `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 4C16 6.20914 14.2091 8 12 8C9.79086 8 8 6.20914 8 4C8 1.79086 9.79086 0 12 0C14.2091 0 16 1.79086 16 4Z" stroke="#7B61FF" stroke-width="2"/><path d="M24 20C24 22.2091 22.2091 24 20 24H4C1.79086 24 0 22.2091 0 20C0 17.7909 1.79086 16 4 16H20C22.2091 16 24 17.7909 24 20Z" stroke="#7B61FF" stroke-width="2"/></svg>`,
        'Общение': `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="#7B61FF" stroke-width="2"/></svg>`,
        'Лидеры/заместители': `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L15.09 8.26L22 9L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9L8.91 8.26L12 2Z" stroke="#7B61FF" stroke-width="2"/></svg>`,
        'Транспортные/Авиакомпании': `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.8 19.2L16 11L21.6 13L17.8 19.2ZM7.2 19.2L2.4 13L8 11L6.2 19.2H7.2ZM4 10L20 10L18 4H6L4 10Z" stroke="#7B61FF" stroke-width="2"/></svg>`,
        'Больница': `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 14C19 16.7614 16.7614 19 14 19H10C7.23858 19 5 16.7614 5 14V10C5 7.23858 7.23858 5 10 5H14C16.7614 5 19 7.23858 19 10V14Z" stroke="#7B61FF" stroke-width="2"/><path d="M12 8V16M8 12H16" stroke="#7B61FF" stroke-width="2"/></svg>`,
        'ГИБДД/МВД': `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L13.09 8.26L20 9L14 14.14L15.18 21.02L12 17.77L8.82 21.02L10 14.14L4 9L10.91 8.26L12 2Z" stroke="#7B61FF" stroke-width="2"/></svg>`,
        'Правительство': `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 21H21V3H3V21ZM5 5H19V19H5V5Z" stroke="#7B61FF" stroke-width="2"/><path d="M7 7H17V9H7V7ZM7 11H17V13H7V11ZM7 15H17V17H7V15Z" stroke="#7B61FF" stroke-width="2"/></svg>`,
        'ТРК': `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="6" width="20" height="12" rx="2" stroke="#7B61FF" stroke-width="2"/><path d="M8 2L16 2" stroke="#7B61FF" stroke-width="2"/></svg>`,
        'ФСБ': `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L13.09 8.26L20 9L14 14.14L15.18 21.02L12 17.77L8.82 21.02L10 14.14L4 9L10.91 8.26L12 2Z" stroke="#7B61FF" stroke-width="2"/></svg>`,
        'Криминальные структуры': `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L13.09 8.26L20 9L14 14.14L15.18 21.02L12 17.77L8.82 21.02L10 14.14L4 9L10.91 8.26L12 2Z" stroke="#7B61FF" stroke-width="2"/></svg>`,
        'МЧС': `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L13.09 8.26L20 9L14 14.14L15.18 21.02L12 17.77L8.82 21.02L10 14.14L4 9L10.91 8.26L12 2Z" stroke="#7B61FF" stroke-width="2"/></svg>`
    };
    return icons[category] || `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="16" height="16" rx="2" stroke="#7B61FF" stroke-width="2"/></svg>`;
}

// Показать команды категории
function showCategoryCommands(category) {
    hideAllSections();
    elements.categorySection.style.display = 'block';
    elements.categoryTitle.textContent = category;
    appState.currentSection = 'category';

    const categoryCommands = appState.commands.filter(cmd => cmd.category === category);

    elements.categoryContent.innerHTML = categoryCommands.map(cmd => `
        <div class="command-item">
            <div class="command-name">${cmd.command}</div>
            <div class="command-desc">${cmd.description}</div>
        </div>
    `).join('');
}

// Показать все команды
function showAllCommandsSection() {
    hideAllSections();
    elements.categorySection.style.display = 'block';
    elements.categoryTitle.textContent = 'Все команды';
    appState.currentSection = 'all-commands';

    elements.categoryContent.innerHTML = appState.commands.map(cmd => `
        <div class="command-item">
            <div class="command-name">${cmd.command}</div>
            <div class="command-desc">${cmd.description}</div>
            <div class="command-category">${cmd.category}</div>
        </div>
    `).join('');
}

// Показать премиум секцию
function showPremiumSection() {
    hideAllSections();
    elements.premiumSection.style.display = 'block';
    appState.currentSection = 'premium';

    elements.premiumContent.innerHTML = `
        <div class="premium-header">
            <h2>💎 Премиум функции</h2>
            <p>Доступны только для VIP пользователей</p>
        </div>
        <div class="premium-features">
            <div class="premium-feature">
                <div class="feature-icon">🔍</div>
                <div class="feature-text">
                    <h3>Расширенный поиск</h3>
                    <p>Поиск по всем разделам с фильтрами и сортировкой</p>
                </div>
            </div>
            <div class="premium-feature">
                <div class="feature-icon">⭐</div>
                <div class="feature-text">
                    <h3>Избранные команды</h3>
                    <p>Сохраняйте часто используемые команды</p>
                </div>
            </div>
            <div class="premium-feature">
                <div class="feature-icon">⚙️</div>
                <div class="feature-text">
                    <h3>Персональные настройки</h3>
                    <p>Настройте интерфейс под себя</p>
                </div>
            </div>
            <div class="premium-feature">
                <div class="feature-icon">🎯</div>
                <div class="feature-text">
                    <h3>Приоритетная поддержка</h3>
                    <p>Быстрая помощь от команды разработчиков</p>
                </div>
            </div>
        </div>
    `;
}

// Скрыть все секции
function hideAllSections() {
    const sections = [
        elements.resultsSection,
        elements.categoriesSection,
        elements.gpsSection,
        elements.rpTermsSection,
        elements.helperDutiesSection,
        elements.chatRulesSection,
        elements.muteRulesSection,
        elements.premiumSection,
        elements.categorySection
    ];

    sections.forEach(section => {
        if (section) section.style.display = 'none';
    });
}

// Показать главную секцию
function showMainSection() {
    hideAllSections();
    appState.currentSection = 'main';
}

// Показать загрузку
function showLoading() {
    if (elements.loadingOverlay) {
        elements.loadingOverlay.style.display = 'flex';
    }
}

// Скрыть загрузку
function hideLoading() {
    if (elements.loadingOverlay) {
        elements.loadingOverlay.style.display = 'none';
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', initializeApp);

// ===== РЕАЛЬНАЯ СИСТЕМА СТАТИСТИКИ =====

// Инициализация статистики
function initStatistics() {
    if (!localStorage.getItem('miniAppStats')) {
        localStorage.setItem('miniAppStats', JSON.stringify({
            totalSearches: 0,
            totalCommandsUsed: 0,
            totalCategoriesViewed: 0,
            totalFavorites: 0,
            userSessions: 0,
            searchHistory: [],
            commandHistory: [],
            categoryHistory: [],
            lastActivity: new Date().toISOString(),
            firstVisit: new Date().toISOString()
        }));
    }
}

// Получение статистики
function getStatistics() {
    const stats = JSON.parse(localStorage.getItem('miniAppStats') || '{}');
    return stats;
}

// Обновление статистики
function updateStatistics(key, value) {
    const stats = getStatistics();
    stats[key] = value;
    stats.lastActivity = new Date().toISOString();
    localStorage.setItem('miniAppStats', JSON.stringify(stats));
}

// Увеличение счетчика
function incrementStat(key) {
    const stats = getStatistics();
    stats[key] = (stats[key] || 0) + 1;
    stats.lastActivity = new Date().toISOString();
    localStorage.setItem('miniAppStats', JSON.stringify(stats));
}

// Отслеживание поиска
function trackSearch(query) {
    incrementStat('totalSearches');
    
    const stats = getStatistics();
    stats.searchHistory = stats.searchHistory || [];
    stats.searchHistory.push({
        query: query,
        timestamp: new Date().toISOString()
    });
    
    // Ограничиваем историю последними 100 поисками
    if (stats.searchHistory.length > 100) {
        stats.searchHistory = stats.searchHistory.slice(-100);
    }
    
    localStorage.setItem('miniAppStats', JSON.stringify(stats));
}

// Отслеживание использования команды
function trackCommand(command) {
    incrementStat('totalCommandsUsed');
    
    const stats = getStatistics();
    stats.commandHistory = stats.commandHistory || [];
    stats.commandHistory.push({
        command: command,
        timestamp: new Date().toISOString()
    });
    
    // Ограничиваем историю последними 100 командами
    if (stats.commandHistory.length > 100) {
        stats.commandHistory = stats.commandHistory.slice(-100);
    }
    
    localStorage.setItem('miniAppStats', JSON.stringify(stats));
}

// Отслеживание просмотра категории
function trackCategory(category) {
    incrementStat('totalCategoriesViewed');
    
    const stats = getStatistics();
    stats.categoryHistory = stats.categoryHistory || [];
    stats.categoryHistory.push({
        category: category,
        timestamp: new Date().toISOString()
    });
    
    // Ограничиваем историю последними 50 категориями
    if (stats.categoryHistory.length > 50) {
        stats.categoryHistory = stats.categoryHistory.slice(-50);
    }
    
    localStorage.setItem('miniAppStats', JSON.stringify(stats));
}

// Отслеживание сессии
function trackSession() {
    const stats = getStatistics();
    const now = new Date();
    const lastActivity = new Date(stats.lastActivity || 0);
    
    // Если прошло больше 30 минут, считаем новой сессией
    if (now.getTime() - lastActivity.getTime() > 30 * 60 * 1000) {
        incrementStat('userSessions');
    }
    
    stats.lastActivity = now.toISOString();
    localStorage.setItem('miniAppStats', JSON.stringify(stats));
}

// Получение топ команд
function getTopCommands() {
    const stats = getStatistics();
    const commandCounts = {};
    
    if (stats.commandHistory) {
        stats.commandHistory.forEach(item => {
            commandCounts[item.command] = (commandCounts[item.command] || 0) + 1;
        });
    }
    
    return Object.entries(commandCounts)
        .map(([command, count]) => ({ name: command, count: count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
}

// Получение топ категорий
function getTopCategories() {
    const stats = getStatistics();
    const categoryCounts = {};
    
    if (stats.categoryHistory) {
        stats.categoryHistory.forEach(item => {
            categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
        });
    }
    
    return Object.entries(categoryCounts)
        .map(([category, count]) => ({ name: category, count: count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
}

// Получение активности за неделю
function getWeeklyActivity() {
    const stats = getStatistics();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const dailyActivity = {};
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekAgo.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        dailyActivity[dateStr] = 0;
    }
    
    // Подсчитываем активность по дням
    const allHistory = [
        ...(stats.searchHistory || []),
        ...(stats.commandHistory || []),
        ...(stats.categoryHistory || [])
    ];
    
    allHistory.forEach(item => {
        const itemDate = new Date(item.timestamp).toISOString().split('T')[0];
        if (dailyActivity[itemDate] !== undefined) {
            dailyActivity[itemDate]++;
        }
    });
    
    return Object.values(dailyActivity);
}

// Отправка статистики на сервер (если доступен)
function sendStatsToServer() {
    const stats = getStatistics();
    
    // Пытаемся отправить на сервер
    fetch('/api/statistics/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(stats)
    }).catch(error => {
        console.log('Сервер недоступен, статистика сохранена локально');
    });
}

// Отслеживание использования команды
function trackCommandUsage(commandName) {
    trackCommand(commandName);
    sendStatsToServer();
}

// Отслеживание использования категории
function trackCategoryUsage(categoryName) {
    trackCategory(categoryName);
    sendStatsToServer();
}

// Отслеживание поиска
function trackSearchUsage(searchQuery) {
    trackSearch(searchQuery);
    sendStatsToServer();
}

// Инициализация статистики при загрузке
document.addEventListener('DOMContentLoaded', function() {
    initStatistics();
    trackSession();
});

// Обновляем существующие функции для отслеживания
const originalPerformSearch = performSearch;
performSearch = function() {
    const query = elements.searchInput.value.trim();
    if (query) {
        trackSearchUsage(query);
    }
    return originalPerformSearch.apply(this, arguments);
};

const originalHandleActionClick = handleActionClick;
handleActionClick = function(action) {
    if (action.type === 'command') {
        trackCommandUsage(action.command);
    }
    return originalHandleActionClick.apply(this, arguments);
};

const originalShowCategoryCommands = showCategoryCommands;
showCategoryCommands = function(category) {
    trackCategoryUsage(category.name);
    return originalShowCategoryCommands.apply(this, arguments);
};

// Отслеживаем активность каждые 5 минут
setInterval(trackSession, 5 * 60 * 1000); 