let tg = window.Telegram.WebApp;
tg.expand();

// Данные о товарах
const products = [
    {
        id: 1,
        title: "Товар 1",
        price: 1000,
        image: "https://via.placeholder.com/150"
    },
    {
        id: 2,
        title: "Товар 2",
        price: 2000,
        image: "https://via.placeholder.com/150"
    },
    {
        id: 3,
        title: "Товар 3",
        price: 3000,
        image: "https://via.placeholder.com/150"
    }
];

// Корзина
let cart = [];

// Отображение товаров
function renderProducts() {
    const container = document.getElementById('productsContainer');
    container.innerHTML = '';

    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-card';
        productElement.innerHTML = `
            <img src="${product.image}" alt="${product.title}" class="product-image">
            <div class="product-title">${product.title}</div>
            <div class="product-price">${product.price} ₽</div>
            <button onclick="addToCart(${product.id})" class="add-to-cart">В корзину</button>
        `;
        container.appendChild(productElement);
    });
}

// Добавление в корзину
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        cart.push(product);
        updateCartInfo();
        tg.MainButton.setText(`Оформить заказ (${calculateTotal()} ₽)`);
        tg.MainButton.show();
    }
}

// Обновление информации о корзине
function updateCartInfo() {
    document.getElementById('cartCount').textContent = cart.length;
    document.getElementById('totalPrice').textContent = calculateTotal();
}

// Подсчет общей суммы
function calculateTotal() {
    return cart.reduce((sum, product) => sum + product.price, 0);
}

// Отправка данных в бот
tg.MainButton.onClick(() => {
    const data = {
        products: cart,
        totalPrice: calculateTotal()
    };
    tg.sendData(JSON.stringify(data));
});

// Инициализация
renderProducts();

// Устанавливаем тему
document.documentElement.style.setProperty('--tg-theme-bg-color', tg.backgroundColor);
document.documentElement.style.setProperty('--tg-theme-text-color', tg.textColor);
document.documentElement.style.setProperty('--tg-theme-button-color', tg.buttonColor);
document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.buttonTextColor); 