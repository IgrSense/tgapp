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

// Функция для анимации чисел
function animateNumber(element, value) {
    if (!element) return;
    element.textContent = value;
    element.classList.remove('pulse');
    void element.offsetWidth; // Форсируем перерисовку
    element.classList.add('pulse');
}

// Функция обновления статистики
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

// Функция переключения страниц
function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    // Если открываем карту, обновляем её размер
    if (pageId === 'mapPage' && map) {
        setTimeout(() => map.invalidateSize(), 100);
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

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initMaps();
    initializeStats();
    
    // Обработчики для навигационных кнопок
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            switchPage(btn.dataset.tab === 'map' ? 'mapPage' : 
                      btn.dataset.tab === 'history' ? 'historyPage' : 
                      btn.dataset.tab === 'profile' ? 'profilePage' : 'dashboard');
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
                switchPage('mapPage');
                map.setView([parkedLocation.lat, parkedLocation.lng], 16);
            }
        });
    }
    
    // Обработчик для кнопки "Назад"
    const backBtn = document.getElementById('backToMain');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            switchPage('dashboard');
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === 'dashboard');
            });
        });
    }
}); 