class ShoppingCart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('cart')) || [];
        this.total = 0;
        this.updateCartUI();
        this.calculateTotal();
    }

    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1
            });
        }
        
        this.saveCart();
        this.calculateTotal();
        this.updateCartUI();
        this.showCartNotification();
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveCart();
        this.calculateTotal();
        this.updateCartUI();
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            item.quantity = parseInt(quantity);
            if (item.quantity <= 0) {
                this.removeItem(productId);
            }
        }
        this.saveCart();
        this.calculateTotal();
        this.updateCartUI();
    }

    calculateTotal() {
        this.total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.items));
    }

    clearCart() {
        this.items = [];
        this.saveCart();
        this.calculateTotal();
        this.updateCartUI();
    }

    showCartNotification() {
        const notification = document.getElementById('cart-notification');
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
    }

    updateCartUI() {
        const cartCount = document.getElementById('cart-count');
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        const cartContainer = document.getElementById('cart-container');

        // Update cart count
        const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;

        // Update cart items list
        if (cartItems) {
            cartItems.innerHTML = '';
            
            if (this.items.length === 0) {
                cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
                return;
            }

            this.items.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'cart-item';
                itemElement.innerHTML = `
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h3>${item.name}</h3>
                        <p class="cart-item-price">€${item.price.toFixed(2)}</p>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn minus" data-id="${item.id}">-</button>
                            <input type="number" value="${item.quantity}" min="1" data-id="${item.id}" class="quantity-input">
                            <button class="quantity-btn plus" data-id="${item.id}">+</button>
                        </div>
                    </div>
                    <button class="remove-item" data-id="${item.id}">×</button>
                `;
                cartItems.appendChild(itemElement);
            });

            // Add event listeners for quantity buttons
            cartItems.querySelectorAll('.quantity-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.dataset.id;
                    const item = this.items.find(item => item.id === id);
                    if (item) {
                        if (e.target.classList.contains('plus')) {
                            this.updateQuantity(id, item.quantity + 1);
                        } else {
                            this.updateQuantity(id, item.quantity - 1);
                        }
                    }
                });
            });

            // Add event listeners for quantity input
            cartItems.querySelectorAll('.quantity-input').forEach(input => {
                input.addEventListener('change', (e) => {
                    const id = e.target.dataset.id;
                    this.updateQuantity(id, e.target.value);
                });
            });

            // Add event listeners for remove buttons
            cartItems.querySelectorAll('.remove-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.dataset.id;
                    this.removeItem(id);
                });
            });
        }

        // Update cart total
        if (cartTotal) {
            cartTotal.textContent = `€${this.total.toFixed(2)}`;
        }

        // Update cart visibility
        if (cartContainer) {
            cartContainer.classList.toggle('empty', this.items.length === 0);
        }
    }
}

// Initialize cart
const cart = new ShoppingCart();

// Export cart instance
window.cart = cart; 