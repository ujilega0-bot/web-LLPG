let cart = [];
let cartCount = 0;
let orderCounter = parseInt(localStorage.getItem('lumpiaOrderCounter') || '0', 10);
let selectedPayment = 'cod';

const cartModal = document.getElementById('cartModal');
const cartCountElements = document.querySelectorAll('.cart-count');
const cartItemsEl = document.getElementById('cartItems');
const totalPriceEl = document.getElementById('totalPrice');
const closeCart = document.querySelector('.close-cart');
const confirmCheckout = document.getElementById('confirmCheckout');

window.addEventListener('scroll', () => {
    document.querySelector('.navbar').classList.toggle('scrolled', window.scrollY > 50);
});

function openCart() {
    cartModal.classList.add('is-open');
    cartModal.setAttribute('aria-hidden', 'false');
    updateCartDisplay();
}

function closeCartModal() {
    cartModal.classList.remove('is-open');
    cartModal.setAttribute('aria-hidden', 'true');
}

document.addEventListener('click', event => {
    if (event.target.closest('.cart-trigger')) {
        event.preventDefault();
        openCart();
        return;
    }

    if (event.target.closest('.add-to-cart')) {
        const button = event.target.closest('.add-to-cart');
        const productCard = button.closest('.product-card');
        const name = productCard.dataset.name;
        const price = parseInt(productCard.dataset.price, 10);

        const existingItem = cart.find(item => item.name === name);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ name, price, quantity: 1 });
        }

        updateCart();
        updateCartDisplay();
        showNotification(`${name} ditambahkan!`);
    }
});

closeCart.onclick = () => {
    closeCartModal();
};

cartModal.onclick = event => {
    if (event.target === cartModal) {
        closeCartModal();
    }
};

document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && cartModal.classList.contains('is-open')) {
        closeCartModal();
    }
});

function bindCartControls() {
    document.querySelectorAll('.qty-plus').forEach(button => {
        button.onclick = () => {
            const index = parseInt(button.dataset.index, 10);
            cart[index].quantity += 1;
            updateCart();
            updateCartDisplay();
            showNotification('Item +1');
        };
    });

    document.querySelectorAll('.qty-minus').forEach(button => {
        button.onclick = () => {
            const index = parseInt(button.dataset.index, 10);
            if (cart[index].quantity > 1) {
                cart[index].quantity -= 1;
                updateCart();
                updateCartDisplay();
                showNotification('Item -1');
            }
        };
    });

    document.querySelectorAll('.remove-item').forEach(button => {
        button.onclick = () => {
            const index = parseInt(button.dataset.index, 10);
            cart.splice(index, 1);
            updateCart();
            updateCartDisplay();
            showNotification('Item dihapus');
        };
    });
}

function updateCartDisplay() {
    if (!cart.length) {
        cartItemsEl.innerHTML = '<p class="empty-cart">Keranjang kosong</p>';
        totalPriceEl.textContent = 'Rp 0';
        return;
    }

    cartItemsEl.innerHTML = cart.map((item, index) => `
        <div class="cart-item-row">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <div class="price-small">Rp ${formatPrice(item.price)}</div>
            </div>
            <div class="cart-controls">
                <button class="qty-btn remove-item" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
                <div class="qty-wrapper">
                    <button class="qty-btn qty-minus" data-index="${index}">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="qty">${item.quantity}</span>
                    <button class="qty-btn qty-plus" data-index="${index}">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
            <div class="item-total">Rp ${formatPrice(item.price * item.quantity)}</div>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalPriceEl.textContent = `Rp ${formatPrice(total)}`;

    bindCartControls();
}

function updateCart() {
    cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElements.forEach(element => {
        element.textContent = cartCount;
    });
    localStorage.setItem('lumpiaCart', JSON.stringify(cart));
}

function formatPrice(price) {
    return new Intl.NumberFormat('id-ID').format(price);
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    document.body.appendChild(notification);
    requestAnimationFrame(() => {
        notification.classList.add('is-visible');
    });

    setTimeout(() => {
        notification.classList.remove('is-visible');
        setTimeout(() => notification.remove(), 300);
    }, 2400);
}

document.querySelectorAll('.payment-option').forEach(option => {
    option.onclick = () => {
        document.querySelector('.payment-option.active')?.classList.remove('active');
        option.classList.add('active');
        selectedPayment = option.dataset.method;
    };
});

confirmCheckout.onclick = () => {
    if (!cart.length) {
        showNotification('Keranjang kosong!');
        return;
    }

    const name = document.getElementById('customerName').value.trim();
    const address = document.getElementById('customerAddress').value.trim();
    let phone = document.getElementById('customerPhone').value.trim().replace(/[\s-]/g, '');

    phone = phone.replace(/^\+?62/, '62').replace(/^0/, '62');

    if (!name || !address || !/^62[1-9][0-9]{8,12}$/.test(phone)) {
        showNotification('Isi nama, alamat, dan nomor WA dengan format 08xxxxxxxxxx');
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const payment = selectedPayment === 'qris' ? 'QRIS (Bayar ke kurir saat barang sampai)' : 'COD';
    const orderNumber = `WK-${String(orderCounter + 1).padStart(4, '0')}`;
    const items = cart
        .map(item => `- ${item.name} x${item.quantity} = Rp${formatPrice(item.price * item.quantity)}`)
        .join('\n');
    const date = new Date().toLocaleString('id-ID');

    let message = `PESANAN LUMPIA CRISPY\n\nNo: ${orderNumber}\nWaktu: ${date}\nBayar: ${payment}\n\nNama: ${name}\nWA: ${phone}\nAlamat: ${address}\n\n${items}\n\nTOTAL: Rp${formatPrice(total)}\n\nTERIMA KASIH!`;

    if (encodeURIComponent(message).length > 1000) {
        message = `${message.substring(0, 900)}\n... (pesanan lengkap)`;
    }

    const waUrl = `https://wa.me/6288294519516?text=${encodeURIComponent(message)}`;
    location.href = waUrl;

    cart = [];
    orderCounter += 1;
    localStorage.setItem('lumpiaOrderCounter', orderCounter);
    updateCart();
    updateCartDisplay();
    closeCartModal();
    document.querySelectorAll('.customer-info input, .customer-info textarea').forEach(input => {
        input.value = '';
    });

    showNotification(`Pesanan #${orderNumber} dikirim! (${payment})`);
};

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.onclick = event => {
        event.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    };
});

function loadCart() {
    try {
        const saved = localStorage.getItem('lumpiaCart');
        if (saved) {
            cart = JSON.parse(saved);
        }
        updateCart();
        updateCartDisplay();
    } catch (error) {
        cart = [];
        updateCart();
        updateCartDisplay();
    }
}

document.addEventListener('DOMContentLoaded', loadCart);
