let tg = window.Telegram.WebApp;
tg.expand();

// Текущие координаты
let currentLocation = {
    lat: null,
    lng: null
};

// Объекты карт
let map = null;
let miniMap = null;
let carMarker = null;

// Инициализация карт
function initMaps() {
    // Основная карта
    map = new ymaps.Map('map', {
        center: [55.7522, 37.6156], // Москва
        zoom: 12,
        controls: ['zoomControl']
    });

    // Мини-карта
    miniMap = new ymaps.Map('mini-map', {
        center: [55.7522, 37.6156],
        zoom: 12,
        controls: []
    });

    // Отключаем зум на мини-карте
    miniMap.behaviors.disable(['scrollZoom', 'drag']);
}

// Добавляем маркер на карты
function addMarker(coords) {
    // Удаляем старый маркер если есть
    if (carMarker) {
        map.geoObjects.remove(carMarker);
        miniMap.geoObjects.remove(carMarker);
    }

    // Создаем новый маркер
    carMarker = new ymaps.Placemark(coords, {
        balloonContent: 'Ваша машина здесь'
    }, {
        preset: 'islands#redAutoIcon'
    });

    // Добавляем на обе карты
    map.geoObjects.add(carMarker);
    miniMap.geoObjects.add(carMarker.clone());
}

// Получение геолокации
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            currentLocation.lat = position.coords.latitude;
            currentLocation.lng = position.coords.longitude;
            
            const coords = [currentLocation.lat, currentLocation.lng];
            
            // Центрируем карты
            map.setCenter(coords);
            miniMap.setCenter(coords);
            
            // Добавляем маркер
            addMarker(coords);
        });
    }
}

// Переменные для отслеживания времени
let parkingStartTime = null;
let parkingInterval = null;

// Функция сохранения данных в localStorage с проверкой
function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (e) {
        console.error('Ошибка сохранения в localStorage:', e);
        tg.showAlert('Ошибка сохранения данных. Возможно, недостаточно места.');
        return false;
    }
}

// Функция загрузки данных из localStorage
function loadFromLocalStorage(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.error('Ошибка загрузки из localStorage:', e);
        return null;
    }
}

// Обновленная функция загрузки изображения
function uploadCarImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                tg.showAlert('Файл слишком большой. Максимальный размер: 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const imageData = event.target.result;
                
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    let width = img.width;
                    let height = img.height;
                    
                    // Уменьшаем размеры для оптимизации хранения
                    const MAX_SIZE = 800;
                    if (width > height && width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    } else if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Сохраняем с меньшим качеством для уменьшения размера
                    const optimizedImage = canvas.toDataURL('image/jpeg', 0.7);
                    
                    document.getElementById('carImage').src = optimizedImage;
                    if (saveToLocalStorage('carImage', optimizedImage)) {
                        const carCard = document.querySelector('.car-card');
                        carCard.classList.add('animate__animated', 'animate__pulse');
                        setTimeout(() => {
                            carCard.classList.remove('animate__animated', 'animate__pulse');
                        }, 1000);
                        tg.showAlert('Фото машины сохранено!');
                    }
                };
                img.src = imageData;
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
}

// Обновленная функция сохранения имени машины
function saveCarName(name) {
    if (saveToLocalStorage('carName', name)) {
        tg.showAlert('Название машины сохранено!');
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем сохраненное изображение
    const savedImage = loadFromLocalStorage('carImage');
    if (savedImage) {
        const carImage = document.getElementById('carImage');
        carImage.src = savedImage;
        console.log('Изображение загружено из localStorage');
    }
    
    // Загружаем сохраненное имя машины
    const savedCarName = loadFromLocalStorage('carName');
    if (savedCarName) {
        const carNameInput = document.getElementById('carName');
        carNameInput.value = savedCarName;
        console.log('Имя машины загружено из localStorage');
    }
    
    // Добавляем обработчик изменения имени машины
    const carNameInput = document.getElementById('carName');
    carNameInput.addEventListener('change', (e) => {
        saveCarName(e.target.value);
    });
    
    // Добавляем обработчик потери фокуса для сохранения имени
    carNameInput.addEventListener('blur', (e) => {
        saveCarName(e.target.value);
    });
});

// Обновление времени парковки
function updateParkingTime() {
    if (parkingStartTime) {
        const now = new Date();
        const diffInMinutes = Math.floor((now - parkingStartTime) / (1000 * 60));
        
        const parkingTimeElement = document.getElementById('parkingTime');
        const totalParkingTimeElement = document.getElementById('totalParkingTime');
        
        parkingTimeElement.textContent = diffInMinutes;
        totalParkingTimeElement.textContent = diffInMinutes;
        
        parkingTimeElement.classList.add('time-update');
        totalParkingTimeElement.classList.add('time-update');
        
        setTimeout(() => {
            parkingTimeElement.classList.remove('time-update');
            totalParkingTimeElement.classList.remove('time-update');
        }, 300);
    }
}

// Сохранение локации
function saveCarLocation() {
    if (currentLocation.lat && currentLocation.lng) {
        parkingStartTime = new Date();
        
        const carDetails = JSON.parse(loadFromLocalStorage('carDetails') || '{}');
        
        const data = {
            type: 'car_location',
            location: currentLocation,
            parkingStartTime: parkingStartTime.toISOString(),
            carDetails: carDetails
        };
        
        if (parkingInterval) clearInterval(parkingInterval);
        parkingInterval = setInterval(updateParkingTime, 60000);
        
        updateParkingTime();
        tg.sendData(JSON.stringify(data));
        tg.showAlert('Локация машины сохранена!');
    }
}

// UI взаимодействия
document.getElementById('menuBtn').onclick = () => {
    document.getElementById('menuPanel').classList.toggle('active');
};

document.getElementById('searchBtn').onclick = () => {
    document.getElementById('searchPanel').classList.toggle('active');
};

document.getElementById('backToMain').onclick = () => {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById('dashboard').classList.add('active');
};

// Навигация
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const tab = btn.dataset.tab;
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        
        if (tab === 'map') {
            document.getElementById('mapPage').classList.add('active');
            map.container.fitToViewport();
        } else if (tab === 'dashboard') {
            document.getElementById('dashboard').classList.add('active');
        }
    });
});

// Инициализация
ymaps.ready(() => {
    initMaps();
    getCurrentLocation();
    loadSavedCarImage(); // Загружаем сохраненное изображение
    
    // Загружаем сохраненное имя машины
    const savedCarName = localStorage.getItem('carName');
    if (savedCarName) {
        document.getElementById('carName').value = savedCarName;
    }
    
    tg.MainButton.setText('Запомнить где припаркована');
    tg.MainButton.onClick(saveCarLocation);
    tg.MainButton.show();
});

// Обновляем текст в заголовке
document.querySelector('h1').textContent = 'CarKeeper';
document.title = 'CarKeeper';

// Обновление темы
function updateTheme() {
    document.documentElement.style.setProperty('--tg-theme-bg-color', tg.backgroundColor);
    document.documentElement.style.setProperty('--tg-theme-text-color', tg.textColor);
    document.documentElement.style.setProperty('--tg-theme-button-color', tg.buttonColor);
    document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.buttonTextColor);
}

updateTheme();

// Добавляем функции для работы с данными автомобиля
function saveCarDetails() {
    const carBrand = document.getElementById('carBrand').value;
    const carModel = document.getElementById('carModel').value;
    const carPlate = document.getElementById('carPlate').value;
    
    // Проверка формата номера
    const plateRegex = /[АВЕКМНОРСТУХ]\d{3}[АВЕКМНОРСТУХ]{2}\d{2,3}/;
    if (carPlate && !plateRegex.test(carPlate.toUpperCase())) {
        tg.showAlert('Неверный формат номера. Пример: А123БВ777');
        return;
    }
    
    const carDetails = {
        brand: carBrand,
        model: carModel,
        plate: carPlate.toUpperCase()
    };
    
    saveToLocalStorage('carDetails', JSON.stringify(carDetails));
    tg.showAlert('Данные автомобиля сохранены!');
}

// Функция загрузки аватара пользователя
function uploadUserAvatar() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                tg.showAlert('Файл слишком большой. Максимальный размер: 2MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Создаем квадратное изображение
                    const size = Math.min(img.width, img.height);
                    canvas.width = 200;
                    canvas.height = 200;
                    
                    // Вырезаем квадрат из центра и масштабируем
                    ctx.drawImage(
                        img,
                        (img.width - size) / 2,
                        (img.height - size) / 2,
                        size,
                        size,
                        0,
                        0,
                        200,
                        200
                    );
                    
                    const optimizedAvatar = canvas.toDataURL('image/jpeg', 0.8);
                    document.getElementById('userAvatar').src = optimizedAvatar;
                    saveToLocalStorage('userAvatar', optimizedAvatar);
                    
                    const avatarEl = document.getElementById('userAvatar');
                    avatarEl.classList.add('animate__animated', 'animate__pulse');
                    setTimeout(() => {
                        avatarEl.classList.remove('animate__animated', 'animate__pulse');
                    }, 1000);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
}

// Добавляем обработчики событий для сохранения данных
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем сохраненные данные автомобиля
    const savedCarDetails = loadFromLocalStorage('carDetails');
    if (savedCarDetails) {
        const carDetails = JSON.parse(savedCarDetails);
        document.getElementById('carBrand').value = carDetails.brand || '';
        document.getElementById('carModel').value = carDetails.model || '';
        document.getElementById('carPlate').value = carDetails.plate || '';
    }
    
    // Загружаем сохраненный аватар
    const savedAvatar = loadFromLocalStorage('userAvatar');
    if (savedAvatar) {
        document.getElementById('userAvatar').src = savedAvatar;
    }
    
    // Добавляем обработчики изменений
    ['carBrand', 'carModel', 'carPlate'].forEach(id => {
        const element = document.getElementById(id);
        element.addEventListener('change', saveCarDetails);
        element.addEventListener('blur', saveCarDetails);
    });
    
    // Автоматическое форматирование номера
    const plateInput = document.getElementById('carPlate');
    plateInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });
});

// Обновляем функцию сохранения локации
function saveCarLocation() {
    if (currentLocation.lat && currentLocation.lng) {
        parkingStartTime = new Date();
        
        const carDetails = JSON.parse(loadFromLocalStorage('carDetails') || '{}');
        
        const data = {
            type: 'car_location',
            location: currentLocation,
            parkingStartTime: parkingStartTime.toISOString(),
            carDetails: carDetails
        };
        
        if (parkingInterval) clearInterval(parkingInterval);
        parkingInterval = setInterval(updateParkingTime, 60000);
        
        updateParkingTime();
        tg.sendData(JSON.stringify(data));
        tg.showAlert('Локация машины сохранена!');
    }
}

// Добавляем моковые данные
const mockData = {
    stats: {
        distance: 57,
        driveTime: 43,
        parkingTime: 324
    },
    history: [
        {
            date: '2024-03-15 14:30',
            location: 'ТЦ Мега',
            duration: '2ч 15мин',
            coordinates: [55.7522, 37.6156]
        },
        {
            date: '2024-03-14 19:45',
            location: 'Парк Горького',
            duration: '1ч 30мин',
            coordinates: [55.7322, 37.6156]
        },
        // Добавьте больше записей истории
    ],
    cars: [
        {
            id: 1,
            brand: 'Toyota',
            model: 'Fortuner GR',
            plate: 'А123БВ777',
            image: 'default-car.png'
        },
        // Добавьте больше машин
    ]
};

// Функция обновления статистики
function updateStats() {
    document.getElementById('distanceValue').textContent = `${mockData.stats.distance}km`;
    document.getElementById('driveTime').textContent = `${mockData.stats.driveTime}min`;
    document.getElementById('totalParkingTime').textContent = `${mockData.stats.parkingTime}min`;
}

// Функция отображения истории
function renderHistory() {
    const historyList = document.querySelector('.history-list');
    historyList.innerHTML = '';

    mockData.history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item animate__animated animate__fadeIn';
        historyItem.innerHTML = `
            <div class="date">${item.date}</div>
            <div class="location">${item.location}</div>
            <div class="duration">⏱ ${item.duration}</div>
        `;
        historyList.appendChild(historyItem);
    });
}

// Функция отображения списка машин
function renderCarList() {
    const carList = document.getElementById('carList');
    carList.innerHTML = '';

    mockData.cars.forEach(car => {
        const carItem = document.createElement('div');
        carItem.className = 'car-list-item animate__animated animate__fadeIn';
        carItem.innerHTML = `
            <img src="${car.image}" alt="${car.brand} ${car.model}">
            <div class="car-list-item-info">
                <h4>${car.brand} ${car.model}</h4>
                <p>${car.plate}</p>
            </div>
        `;
        carList.appendChild(carItem);
    });
}

// Функция переключения на дашборд
function showDashboard() {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById('dashboard').classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if(btn.dataset.tab === 'dashboard') btn.classList.add('active');
    });
}

// Обновляем обработчики навигации
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const tab = btn.dataset.tab;
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        
        switch(tab) {
            case 'map':
                document.getElementById('mapPage').classList.add('active');
                map.container.fitToViewport();
                break;
            case 'history':
                document.getElementById('historyPage').classList.add('active');
                renderHistory();
                break;
            case 'profile':
                document.getElementById('profilePage').classList.add('active');
                renderCarList();
                break;
            default:
                document.getElementById('dashboard').classList.add('active');
        }
    });
});

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    updateStats();
    // ... остальной код инициализации
}); 