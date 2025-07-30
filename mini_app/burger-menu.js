// Единый компонент бургер-меню для всех страниц
class BurgerMenu {
    constructor() {
        this.menu = null;
        this.menuBtn = null;
        this.closeBtn = null;
        this.isAdminBot = this.detectAdminBot();
        this.init();
    }

    detectAdminBot() {
        // Определяем, является ли это AdminBot по URL или заголовку
        return window.location.pathname.includes('admin') || 
               document.title.includes('Admin') ||
               document.querySelector('.logo')?.textContent.includes('Admin');
    }

    init() {
        // Создаем HTML структуру меню
        this.createMenuHTML();
        
        // Добавляем кнопку в хедер
        this.addMenuButton();
        
        // Инициализируем обработчики событий
        this.initEventListeners();
    }

    createMenuHTML() {
        // Проверяем, есть ли уже бургер-меню
        const existingMenu = document.getElementById('burgerMenu');
        if (existingMenu) {
            // Если меню уже есть, используем его
            this.menu = existingMenu;
            this.closeBtn = document.getElementById('closeBurgerMenu');
            return;
        }
        
        const menuHTML = `
            <div class="burger-menu" id="burgerMenu" style="display: none;">
                <div class="burger-menu-content">
                    <div class="burger-menu-header">
                        <h3>${this.isAdminBot ? 'Admin Bot' : 'Меню'}</h3>
                        <button class="burger-menu-close" id="closeBurgerMenu">×</button>
                    </div>
                    <div class="burger-menu-items">
                        ${this.isAdminBot ? this.getAdminMenuItems() : this.getHelperMenuItems()}
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', menuHTML);
        
        this.menu = document.getElementById('burgerMenu');
        this.closeBtn = document.getElementById('closeBurgerMenu');
    }

    getHelperMenuItems() {
        return `
            <a href="helper.html" class="burger-menu-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="#7B61FF" stroke-width="2"/>
                    <path d="M9 22V12H15V22" stroke="#7B61FF" stroke-width="2"/>
                </svg>
                <span>Главная</span>
            </a>
            <a href="categories.html" class="burger-menu-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="5" width="18" height="14" rx="2" stroke="#7B61FF" stroke-width="2"/>
                    <path d="M3 8H21" stroke="#7B61FF" stroke-width="2"/>
                </svg>
                <span>Категории</span>
            </a>
            <a href="all_commands.html" class="burger-menu-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#7B61FF" stroke-width="2"/>
                    <path d="M14 2V8H20" stroke="#7B61FF" stroke-width="2"/>
                </svg>
                <span>Все команды</span>
            </a>
            <a href="gps.html" class="burger-menu-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" stroke="#7B61FF" stroke-width="2"/>
                    <circle cx="12" cy="9" r="2.5" stroke="#7B61FF" stroke-width="2"/>
                </svg>
                <span>GPS</span>
            </a>
            <a href="rp.html" class="burger-menu-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#7B61FF" stroke-width="2"/>
                    <path d="M14 2V8H20" stroke="#7B61FF" stroke-width="2"/>
                </svg>
                <span>RP-термины</span>
            </a>
            <a href="helper_duties.html" class="burger-menu-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10" stroke="#7B61FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#7B61FF" stroke-width="2"/>
                </svg>
                <span>Обязанности</span>
            </a>
            <a href="chat_rules.html" class="burger-menu-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 8L22 12L18 16" stroke="#7B61FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M6 8L2 12L6 16" stroke="#7B61FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M14 4L10 20" stroke="#7B61FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Правила чата</span>
            </a>
            <a href="mute_rules.html" class="burger-menu-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L13.09 8.26L20 9L14 14.14L15.18 21.02L12 17.77L8.82 21.02L10 14.14L4 9L10.91 8.26L12 2Z" stroke="#7B61FF" stroke-width="2"/>
                </svg>
                <span>Правила мута</span>
            </a>
            <a href="ap_rules.html" class="burger-menu-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10" stroke="#7B61FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#7B61FF" stroke-width="2"/>
                </svg>
                <span>Правила АП</span>
            </a>
            <a href="jobs.html" class="burger-menu-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="7" width="18" height="12" rx="2" stroke="#7B61FF" stroke-width="2"/>
                    <path d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7" stroke="#7B61FF" stroke-width="2"/>
                    <path d="M9 13H15" stroke="#7B61FF" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span>Работы</span>
            </a>
            <a href="statistics.html" class="burger-menu-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 3V21H21" stroke="#7B61FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M9 9L12 6L16 10L21 5" stroke="#7B61FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M21 5H16V10" stroke="#7B61FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Статистика</span>
            </a>
        `;
    }

    getAdminMenuItems() {
        return `
            <a href="adminindex.html" class="burger-menu-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="#FF0000" stroke-width="2"/>
                    <path d="M9 22V12H15V22" stroke="#FF0000" stroke-width="2"/>
                </svg>
                <span>Главная</span>
            </a>
            <a href="choice.html" class="burger-menu-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" stroke="#FF0000" stroke-width="2"/>
                </svg>
                <span>Выбор бота</span>
            </a>
            <!-- Пока пусто - будет добавлено позже -->
        `;
    }

    addMenuButton() {
        const headerActions = document.querySelector('.header-actions');
        if (headerActions) {
            // Проверяем, есть ли уже кнопка меню
            const existingMenuBtn = document.getElementById('burgerMenuBtn');
            if (existingMenuBtn) {
                // Если кнопка уже есть, используем её
                this.menuBtn = existingMenuBtn;
                return;
            }
            
            // Если кнопки нет, создаём новую
            const menuBtn = document.createElement('button');
            menuBtn.className = 'btn-icon';
            menuBtn.id = 'burgerMenuBtn';
            menuBtn.title = 'Меню';
            const strokeColor = this.isAdminBot ? '#FF0000' : '#7B61FF';
            menuBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 12H21M3 6H21M3 18H21" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
            
            // Вставляем кнопку в начало header-actions
            headerActions.insertBefore(menuBtn, headerActions.firstChild);
            this.menuBtn = menuBtn;
        }
    }

    initEventListeners() {
        if (this.menuBtn) {
            this.menuBtn.addEventListener('click', () => this.openMenu());
        }
        
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closeMenu());
        }
        
        if (this.menu) {
            this.menu.addEventListener('click', (e) => {
                if (e.target === this.menu) {
                    this.closeMenu();
                }
            });
        }
    }

    openMenu() {
        if (this.menu) {
            this.menu.style.display = 'flex';
        }
    }

    closeMenu() {
        if (this.menu) {
            this.menu.style.display = 'none';
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    new BurgerMenu();
}); 