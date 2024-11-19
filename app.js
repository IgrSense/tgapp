let tg = window.Telegram.WebApp;
tg.expand();

// Переменные для карт
let map = null;
let miniMap = null;
let carMarker = null;
let routeControl = null;
let currentLocation = {
    lat: null,
    lng: null
};
let parkedLocation = null;

// Переменные для парковки
let isParked = false;
let parkingStartTime = null;
let parkingInterval = null;
let currentStats = {
    distance: 57,
    driveTime: 43,
    money: 324
};

// Добавляем стили для анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); color: inherit; }
        50% { transform: scale(1.2); color: #7B61FF; }
        100% { transform: scale(1); color: inherit; }
    }

    .stat h3.pulse {
        animation: pulse 0.3s ease-in-out;
    }
`;
document.head.appendChild(style);

// Добавляем моковые данные для истории
const mockData = {
    history: [
        {
            date: '2024-03-15',
            time: '14:30',
            location: 'ТЦ Мега',
            duration: '2ч 15мин',
            cost: '$45.00',
            paid: false
        },
        {
            date: '2024-03-15',
            time: '10:15',
            location: 'Центр города',
            duration: '1ч 30мин',
            cost: '$32.50',
            paid: true
        },
        {
            date: '2024-03-14',
            time: '19:45',
            location: 'Аэропорт',
            duration: '3ч 00мин',
            cost: '$67.00',
            paid: true
        }
    ]
};

// Функция инициализации карт
function initMaps() {
    try {
        // Основная карта
        map = L.map('map').setView([55.7522, 37.6156], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Мини-карта
        miniMap = L.map('mini-map', {
            zoomControl: false,
            dragging: false,
            touchZoom: false,
            scrollWheelZoom: false,
            doubleClickZoom: false
        }).setView([55.7522, 37.6156], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(miniMap);

        // Получаем текущую геолокацию
        getCurrentLocation();
    } catch (error) {
        console.error('Ошибка инициализации карт:', error);
        tg.showAlert('Ошибка инициализации карт: ' + error.message);
    }
}

// Функция получения геолокации
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                currentLocation.lat = position.coords.latitude;
                currentLocation.lng = position.coords.longitude;
                
                // Центрируем карты
                if (map && miniMap) {
                    map.setView([currentLocation.lat, currentLocation.lng], 12);
                    miniMap.setView([currentLocation.lat, currentLocation.lng], 12);
                }
            },
            error => {
                tg.showAlert('Ошибка получения геолокации: ' + error.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    }
}

// Функция добавления маркера
function addMarker(coords) {
    try {
        // Удаляем старый маркер если есть
        if (carMarker) {
            map.removeLayer(carMarker);
            miniMap.removeLayer(carMarker);
        }

        // Создаем иконку для маркера
        const carIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
        });

        // Создаем новый маркер
        carMarker = L.marker([coords[0], coords[1]], {icon: carIcon})
            .bindPopup('Ваша машина здесь');

        // Добавляем на обе карты
        carMarker.addTo(map);
        L.marker([coords[0], coords[1]], {icon: carIcon}).addTo(miniMap);
    } catch (error) {
        console.error('Ошибка добавления маркера:', error);
    }
}

// Функция построения маршрута
async function buildRoute(startPoint, endPoint) {
    try {
        // Удаляем предыдущий маршрут если есть
        if (routeControl) {
            map.removeControl(routeControl);
        }

        // Создаем новый маршрут
        routeControl = L.Routing.control({
            waypoints: [
                L.latLng(startPoint[0], startPoint[1]),
                L.latLng(endPoint[0], endPoint[1])
            ],
            routeWhileDragging: true,
            lineOptions: {
                styles: [{color: '#7B61FF', weight: 6}]
            },
            createMarker: function(i, wp) {
                const icon = L.icon({
                    iconUrl: i === 0 
                        ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png'
                        : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41]
                });
                return L.marker(wp.latLng, {icon: icon});
            }
        }).addTo(map);

        // Подписываемся на событие получения маршрута
        routeControl.on('routesfound', function(e) {
            const routes = e.routes;
            const summary = routes[0].summary;
            tg.showAlert(
                `Расстояние до машины: ${(summary.totalDistance / 1000).toFixed(1)} км\n` +
                `Время пешком: ${Math.round(summary.totalTime / 60)} мин`
            );
        });

        return routeControl;
    } catch (error) {
        console.error('Ошибка построения маршрута:', error);
        tg.showAlert('Ошибка построения маршрута: ' + error.message);
    }
}

// Добавляем функцию инициализации статистики
function initializeStats() {
    const distanceElement = document.querySelector('.stats-card.modern .stat:nth-child(1) h3');
    const timeElement = document.querySelector('.stats-card.modern .stat:nth-child(2) h3');
    const moneyElement = document.querySelector('.stats-card.modern .stat:nth-child(3) h3');

    if (distanceElement) distanceElement.textContent = `${Math.round(currentStats.distance)}km`;
    if (timeElement) timeElement.textContent = `${currentStats.driveTime}min`;
    if (moneyElement) moneyElement.textContent = `$${currentStats.money.toFixed(2)}`;
}

// Обновляем функцию для анимации чисел
function animateNumber(element, value) {
    if (!element) return;
    
    // Удаляем предыдущую анимацию
    element.classList.remove('pulse');
    
    // Обновляем значение
    element.textContent = value;
    
    // Форсируем перерисовку
    void element.offsetWidth;
    
    // Добавляем анимацию
    element.classList.add('pulse');
}

// Обновляем функцию переключе страниц
function switchPage(pageId) {
    // Скрываем все страницы
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    
    // Показываем нужную страницу
    const currentPage = document.getElementById(pageId);
    if (currentPage) {
        currentPage.style.display = 'block';
        
        // Если открываем карту, обновляем её размер
        if (pageId === 'mapPage' && map) {
            setTimeout(() => {
                map.invalidateSize();
                // Если есть сохраненная локация, центрируем карту на ней
                if (parkedLocation) {
                    map.setView([parkedLocation.lat, parkedLocation.lng], 16);
                }
            }, 100);
        }
    }
}

// Функция для парковки
function toggleParking() {
    const parkBtn = document.getElementById('parkBtn');
    const navigateBtn = document.getElementById('navigateBtn');
    
    if (!isParked) {
        // Начинаем парковку
        isParked = true;
        parkingStartTime = new Date();
        parkBtn.classList.add('active');
        parkBtn.querySelector('.text').textContent = 'Завершить парковку';
        
        // Показываем кнопку навигации
        if (navigateBtn) {
            navigateBtn.style.display = 'flex';
        }
        
        // Сохраняем локацию парковки
        if (currentLocation.lat && currentLocation.lng) {
            parkedLocation = {...currentLocation};
            addMarker([parkedLocation.lat, parkedLocation.lng]);
        }
        
        // Запускаем обновление статистики
        parkingInterval = setInterval(updateStats, 1000);
    } else {
        // Завершаем парковку
        isParked = false;
        clearInterval(parkingInterval);
        parkBtn.classList.remove('active');
        parkBtn.querySelector('.text').textContent = 'Припарковаться';
        
        if (navigateBtn) {
            navigateBtn.style.display = 'none';
        }
        
        // Очищаем маркер
        if (carMarker) {
            map.removeLayer(carMarker);
            miniMap.removeLayer(carMarker);
        }
    }
}

// Обновляем функцию обновления статистики
function updateStats() {
    if (!isParked) return;

    const now = new Date();
    const timeDiff = (now - parkingStartTime) / 1000; // разница в секундах

    // Обновляем расстояние (случайное изменение)
    currentStats.distance += Math.random() * 0.1;
    const distanceElement = document.querySelector('.stats-card.modern .stat:nth-child(1) h3');
    animateNumber(distanceElement, `${Math.round(currentStats.distance)}km`);

    // Обновляем время
    currentStats.driveTime = Math.floor(timeDiff / 60);
    const timeElement = document.querySelector('.stats-card.modern .stat:nth-child(2) h3');
    animateNumber(timeElement, `${currentStats.driveTime}min`);

    // Обновляем деньги (1 цент в секунду)
    currentStats.money += 0.01;
    const moneyElement = document.querySelector('.stats-card.modern .stat:nth-child(3) h3');
    animateNumber(moneyElement, `$${currentStats.money.toFixed(2)}`);
}

// Обновляем обработчики событий
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация карт и статистики
    initMaps();
    initializeStats();
    
    // Обработчики для навигационных кнопок
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const tab = btn.dataset.tab;
            switch(tab) {
                case 'dashboard':
                    switchPage('dashboard');
                    break;
                case 'map':
                    switchPage('mapPage');
                    break;
                case 'history':
                    switchPage('historyPage');
                    renderHistory();
                    break;
                case 'profile':
                    switchPage('profilePage');
                    break;
            }
        });
    });
    
    // Обработчик для кнопки парковки
    const parkBtn = document.getElementById('parkBtn');
    if (parkBtn) {
        parkBtn.addEventListener('click', toggleParking);
    }
    
    // Обработчик для кнопки навигации
    const navigateBtn = document.getElementById('navigateBtn');
    if (navigateBtn) {
        navigateBtn.addEventListener('click', () => {
            if (parkedLocation) {
                navigateToCar();
            } else {
                tg.showAlert('Локация машины не сохранена');
            }
        });
    }
    
    // Обработчик для кнопки "Назад"
    const backBtn = document.getElementById('backToMain');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            switchPage('dashboard');
            // Обновляем активную кнопку в навигации
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === 'dashboard');
            });
        });
    }
}); 

// Обновляем функцию навигации к машине
async function navigateToCar() {
    if (!parkedLocation) {
        tg.showAlert('Локация машины не сохранена');
        return;
    }

    try {
        // Получаем текущую геопозицию
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            });
        });

        // Координаты текущего положения и машины
        const startPoint = [position.coords.latitude, position.coords.longitude];
        const endPoint = [parkedLocation.lat, parkedLocation.lng];

        // Переключаемся на страницу карты
        switchPage('mapPage');

        // Рисуем линию маршрута на карте
        if (routeControl) {
            map.removeLayer(routeControl);
        }

        // Добавляем маркеры начала и конца маршрута
        const startIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41]
        });

        const endIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41]
        });

        const startMarker = L.marker([startPoint[0], startPoint[1]], {icon: startIcon}).addTo(map);
        const endMarker = L.marker([endPoint[0], endPoint[1]], {icon: endIcon}).addTo(map);

        // Рисуем прямую линию между точками
        routeControl = L.polyline([
            [startPoint[0], startPoint[1]],
            [endPoint[0], endPoint[1]]
        ], {color: '#7B61FF', weight: 6}).addTo(map);

        // Подгоняем карту под маршрут
        map.fitBounds(routeControl.getBounds(), {padding: [50, 50]});

        // Создаем универсальную ссылку для навигации
        const universalUrl = `geo:${endPoint[0]},${endPoint[1]}?q=${endPoint[0]},${endPoint[1]}(Моя машина)`;

        // Создаем кнопку навигации
        const navButton = document.createElement('button');
        navButton.className = 'navigation-btn modern';
        navButton.innerHTML = '🗺️ Открыть навигацию';
        navButton.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            max-width: 400px;
            background: #4CAF50;
            color: white;
            padding: 16px 24px;
            border-radius: 24px;
            border: none;
            font-size: 16px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;

        // Обновляем обработчик для кнопки навигации
        navButton.addEventListener('click', () => {
            // Создаем контейнер для меню выбора навигатора
            const menuContainer = document.createElement('div');
            menuContainer.className = 'nav-menu modern';
            menuContainer.style.cssText = `
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: rgba(30, 30, 30, 0.95);
                backdrop-filter: blur(10px);
                padding: 20px;
                border-radius: 20px 20px 0 0;
                z-index: 1001;
                transform: translateY(100%);
                transition: transform 0.3s ease;
            `;

            // Создаем заголовок
            const title = document.createElement('div');
            title.style.cssText = `
                text-align: center;
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 20px;
                color: white;
            `;
            title.textContent = 'Выберите навигатор';

            // Создаем список навигаторов
            const navigators = [
                {
                    name: 'Apple Maps',
                    icon: '🗺️',
                    url: `maps://maps.apple.com/?dirflg=w&saddr=${startPoint[0]},${startPoint[1]}&daddr=${endPoint[0]},${endPoint[1]}`,
                    platform: 'ios'
                },
                {
                    name: 'Яндекс.Карты',
                    icon: '📍',
                    url: `yandexmaps://maps.yandex.ru/?rtext=${startPoint[0]},${startPoint[1]}~${endPoint[0]},${endPoint[1]}&rtt=pd`,
                    webUrl: `https://yandex.ru/maps/?rtext=${startPoint[0]},${startPoint[1]}~${endPoint[0]},${endPoint[1]}&rtt=pd`
                },
                {
                    name: 'Яндекс.Навигатор',
                    icon: '🚗',
                    url: `yandexnavi://build_route_on_map?lat_to=${endPoint[0]}&lon_to=${endPoint[1]}&lat_from=${startPoint[0]}&lon_from=${startPoint[1]}`
                },
                {
                    name: '2ГИС',
                    icon: '🌍',
                    url: `dgis://2gis.ru/routeSearch/rsType/car/from/${startPoint[1]},${startPoint[0]}/to/${endPoint[1]},${endPoint[0]}`,
                    webUrl: `https://2gis.ru/routeSearch/rsType/car/from/${startPoint[1]},${startPoint[0]}/to/${endPoint[1]},${endPoint[0]}`
                }
            ];

            // Создаем кнопки для каждого навигатора
            const buttonsList = document.createElement('div');
            buttonsList.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 12px;
            `;

            navigators.forEach(nav => {
                const button = document.createElement('button');
                button.className = 'nav-option modern';
                button.style.cssText = `
                    width: 100%;
                    padding: 16px;
                    border: none;
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    font-size: 16px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                `;
                button.innerHTML = `${nav.icon} ${nav.name}`;
                
                button.addEventListener('click', () => {
                    // Пробуем открыть приложение
                    window.location.href = nav.url;
                    
                    // Если есть веб-версия, открываем её через 2 секунды, если приложение не открылось
                    if (nav.webUrl) {
                        setTimeout(() => {
                            window.location.href = nav.webUrl;
                        }, 2000);
                    }
                    
                    // Закрываем меню
                    menuContainer.style.transform = 'translateY(100%)';
                    setTimeout(() => menuContainer.remove(), 300);
                });

                buttonsList.appendChild(button);
            });

            // Добавляем кнопку закрытия
            const closeButton = document.createElement('button');
            closeButton.className = 'close-nav-menu modern';
            closeButton.style.cssText = `
                width: 100%;
                padding: 16px;
                border: none;
                background: rgba(255, 0, 0, 0.2);
                color: white;
                font-size: 16px;
                font-weight: 500;
                border-radius: 12px;
                margin-top: 12px;
                cursor: pointer;
            `;
            closeButton.textContent = 'Закрыть';
            closeButton.onclick = () => {
                menuContainer.style.transform = 'translateY(100%)';
                setTimeout(() => menuContainer.remove(), 300);
            };

            // Собираем меню
            menuContainer.appendChild(title);
            menuContainer.appendChild(buttonsList);
            menuContainer.appendChild(closeButton);

            // Добавляем меню на страницу
            document.body.appendChild(menuContainer);

            // Показываем меню с анимацией
            requestAnimationFrame(() => {
                menuContainer.style.transform = 'translateY(0)';
            });
        });

        // Удаляем старую кнопку навигации, если она есть
        const oldButton = document.querySelector('.navigation-btn');
        if (oldButton) {
            oldButton.remove();
        }

        // Добавляем новую кнопку
        document.getElementById('mapPage').appendChild(navButton);

        // Показываем информацию о маршруте
        const distance = calculateDistance(startPoint, endPoint);
        const walkingTime = Math.round(distance / 80); // Примерная скорость ходьбы 4.8 км/ч
        
        tg.showAlert(
            `🚗 Машина найдена!\n` +
            `📍 Расстояние: ${(distance/1000).toFixed(1)} км\n` +
            `⏱ Время пешком: ${walkingTime} мин\n\n` +
            `Нажмите "Открыть навигацию" для построения маршрута`
        );

    } catch (error) {
        console.error('Ошибка навигации:', error);
        tg.showAlert('Ошибка получения маршрута: ' + error.message);
    }
}

// Добавляем функцию расчета расстояния
function calculateDistance(start, end) {
    const R = 6371e3; // радиус Земли в метрах
    const φ1 = start[0] * Math.PI/180;
    const φ2 = end[0] * Math.PI/180;
    const Δφ = (end[0]-start[0]) * Math.PI/180;
    const Δλ = (end[1]-start[1]) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // расстояние в метрах
}

// Функция отображения истории
function renderHistory() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;

    historyList.innerHTML = mockData.history.map(item => `
        <div class="history-item modern animate__animated animate__fadeInUp">
            <div class="history-item-header">
                <div class="history-date">
                    <h3>${item.date}</h3>
                    <p>${item.time}</p>
                </div>
                <div class="history-cost">${item.cost}</div>
            </div>
            <div class="history-details">
                <p class="history-location">📍 ${item.location}</p>
                <p class="history-duration">⏱ ${item.duration}</p>
            </div>
            <div class="history-actions">
                ${item.paid 
                    ? '<button class="history-btn paid">✓ Оплачено</button>'
                    : '<button class="history-btn pay" onclick="payHistoryItem(this)">Оплатить</button>'
                }
            </div>
        </div>
    `).join('');

    // Добавляем обработчики для фильтров
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            filterHistory(e.target.textContent.toLowerCase());
        });
    });
}

// Функция фильтрации истории
function filterHistory(filter) {
    const items = document.querySelectorAll('.history-item');
    items.forEach(item => {
        const isPaid = item.querySelector('.history-btn.paid') !== null;
        switch(filter) {
            case 'paid':
                item.style.display = isPaid ? 'block' : 'none';
                break;
            case 'unpaid':
                item.style.display = !isPaid ? 'block' : 'none';
                break;
            default:
                item.style.display = 'block';
        }
    });
}

// Функция оплаты
function payHistoryItem(button) {
    button.classList.remove('pay');
    button.classList.add('paid');
    button.textContent = '✓ Оплачено';
    button.onclick = null;
    
    // Анимация
    button.closest('.history-item').classList.add('animate__animated', 'animate__pulse');
    setTimeout(() => {
        button.closest('.history-item').classList.remove('animate__animated', 'animate__pulse');
    }, 1000);
} 