let tg = window.Telegram.WebApp;
tg.expand();

// Инициализация Mapbox
mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN'; // Получите токен на mapbox.com

// Текущие координаты
let currentLocation = {
    lat: null,
    lng: null
};

// Инициализация карты
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    center: [37.6156, 55.7522], // Москва по умолчанию
    zoom: 12
});

// Мини-карта
const miniMap = new mapboxgl.Map({
    container: 'mini-map',
    style: 'mapbox://styles/mapbox/dark-v10',
    center: [37.6156, 55.7522],
    zoom: 12,
    interactive: false
});

// Маркер машины
let carMarker = null;

// Добавляем переменные для отслеживания времени
let parkingStartTime = null;
let parkingInterval = null;

// Функция загрузки изображения
function uploadCarImage() {
    // Создаем невидимый input для файла
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                // Обновляем изображение
                document.getElementById('carImage').src = event.target.result;
                
                // Сохраняем изображение в localStorage
                localStorage.setItem('carImage', event.target.result);
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
}

// Функция обновления времени парковки
function updateParkingTime() {
    if (parkingStartTime) {
        const now = new Date();
        const diffInMinutes = Math.floor((now - parkingStartTime) / (1000 * 60));
        
        const parkingTimeElement = document.getElementById('parkingTime');
        const totalParkingTimeElement = document.getElementById('totalParkingTime');
        
        parkingTimeElement.textContent = diffInMinutes;
        totalParkingTimeElement.textContent = diffInMinutes;
        
        // Добавляем анимацию при обновлении
        parkingTimeElement.classList.add('time-update');
        totalParkingTimeElement.classList.add('time-update');
        
        setTimeout(() => {
            parkingTimeElement.classList.remove('time-update');
            totalParkingTimeElement.classList.remove('time-update');
        }, 300);
    }
}

// Получение текущей геолокации
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            currentLocation.lat = position.coords.latitude;
            currentLocation.lng = position.coords.longitude;
            
            // Обновляем карты
            map.setCenter([currentLocation.lng, currentLocation.lat]);
            miniMap.setCenter([currentLocation.lng, currentLocation.lat]);
            
            // Добавляем маркер
            if (carMarker) carMarker.remove();
            carMarker = new mapboxgl.Marker()
                .setLngLat([currentLocation.lng, currentLocation.lat])
                .addTo(map);
            
            new mapboxgl.Marker()
                .setLngLat([currentLocation.lng, currentLocation.lat])
                .addTo(miniMap);
        });
    }
}

// Сохранение локации машины с временем начала парковки
function saveCarLocation() {
    if (currentLocation.lat && currentLocation.lng) {
        parkingStartTime = new Date();
        
        const data = {
            type: 'car_location',
            location: currentLocation,
            parkingStartTime: parkingStartTime.toISOString()
        };
        
        // Запускаем таймер обновления времени
        if (parkingInterval) clearInterval(parkingInterval);
        parkingInterval = setInterval(updateParkingTime, 60000); // Обновляем каждую минуту
        
        updateParkingTime(); // Обновляем сразу
        tg.sendData(JSON.stringify(data));
        tg.showAlert('Локация машины сохранена!');
    }
}

// Анимация для элементов
function animateElements() {
    const elements = document.querySelectorAll('.car-card, .stats-card, .user-card');
    elements.forEach((el, index) => {
        el.style.animationDelay = `${index * 0.1}s`;
    });
}

// Переключение между видами
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        if (btn.dataset.tab === 'dashboard') {
            document.getElementById('dashboard').style.display = 'block';
            document.getElementById('map').style.display = 'none';
        } else if (btn.dataset.tab === 'map') {
            document.getElementById('dashboard').style.display = 'none';
            document.getElementById('map').style.display = 'block';
            map.resize();
        }
    });
});

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем сохраненное изображение
    const savedImage = localStorage.getItem('carImage');
    if (savedImage) {
        document.getElementById('carImage').src = savedImage;
    }
    
    getCurrentLocation();
    animateElements();
    
    tg.MainButton.setText('Запомнить где припаркована');
    tg.MainButton.onClick(saveCarLocation);
    tg.MainButton.show();
});

// Обновление темы
function updateTheme() {
    document.documentElement.style.setProperty('--tg-theme-bg-color', tg.backgroundColor);
    document.documentElement.style.setProperty('--tg-theme-text-color', tg.textColor);
    document.documentElement.style.setProperty('--tg-theme-button-color', tg.buttonColor);
    document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.buttonTextColor);
}

updateTheme(); 