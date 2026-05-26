// --- CLIENT CATALOG LOGIC ---

// State
let products = [];
let selectedProducts = [];
let activeSliders = {}; // { productId: currentImageIndex }
let currentTheme = 'dark'; // Tesla style defaults to dark!

// DOM Elements
const productGrid = document.getElementById('product-grid');
const searchInput = document.getElementById('search-input');
const filterCategory = document.getElementById('filter-category');
const filterSort = document.getElementById('filter-sort');
const clearSearchBtn = document.getElementById('clear-search');
const cartDrawer = document.getElementById('cart-drawer');
const cartCount = document.getElementById('cart-count');
const cartItemsContainer = document.getElementById('cart-items');
const cartEmptyState = document.getElementById('cart-empty');
const cartTotalVal = document.getElementById('cart-total-val');
const whatsappPhoneInput = document.getElementById('whatsapp-phone');
const phoneErrorMsg = document.getElementById('phone-error-msg');
const themeToggleBtn = document.getElementById('theme-toggle');
const navbar = document.getElementById('navbar');

// Detail Modal Elements
const detailModal = document.getElementById('detail-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalCategory = document.getElementById('modal-category');
const modalTitle = document.getElementById('modal-title');
const modalPrice = document.getElementById('modal-price');
const modalDesc = document.getElementById('modal-desc');
const modalStatStock = document.getElementById('modal-stat-stock');
const modalStatImages = document.getElementById('modal-stat-images');
const modalActiveImg = document.getElementById('modal-active-img');
const modalThumbsContainer = document.getElementById('modal-thumbs');
const modalWhatsappBtn = document.getElementById('modal-whatsapp-btn');

// --- INIT APP ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadProducts();
    initEventListeners();
    renderCatalog();
    updateCartUI();
});

// Theme Setup
function initTheme() {
    const savedTheme = localStorage.getItem('tesla_catalog_theme');
    if (savedTheme) {
        currentTheme = savedTheme;
    } else {
        currentTheme = 'dark'; // default
    }
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon();
}

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('tesla_catalog_theme', currentTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    if (themeToggleBtn) {
        themeToggleBtn.innerHTML = currentTheme === 'dark' 
            ? '<i class="fas fa-sun"></i>' 
            : '<i class="fas fa-moon"></i>';
    }
}

// Load Products from storage or mock
function loadProducts() {
    const stored = localStorage.getItem('tesla_catalog_products');
    if (stored) {
        products = JSON.parse(stored);
    } else {
        products = window.DEFAULT_PRODUCTS || [];
        localStorage.setItem('tesla_catalog_products', JSON.stringify(products));
    }
    
    // Fill categories dropdown dynamically
    if (filterCategory) {
        const categories = [...new Set(products.map(p => p.category))];
        filterCategory.innerHTML = '<option value="">Todas las Categorías</option>';
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            filterCategory.appendChild(opt);
        });
    }

    // Load saved phone number if exists
    const savedPhone = localStorage.getItem('tesla_catalog_phone');
    if (savedPhone && whatsappPhoneInput) {
        whatsappPhoneInput.value = savedPhone;
    }
}

// Event Listeners
function initEventListeners() {
    // Scroll Effect Navbar
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Theme Toggle
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Search and Filters
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            if (searchInput.value.trim() !== '') {
                clearSearchBtn.style.display = 'block';
            } else {
                clearSearchBtn.style.display = 'none';
            }
            renderCatalog();
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearSearchBtn.style.display = 'none';
            renderCatalog();
        });
    }

    if (filterCategory) {
        filterCategory.addEventListener('change', renderCatalog);
    }

    if (filterSort) {
        filterSort.addEventListener('change', renderCatalog);
    }

    // Modal Close
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeProductModal);
    }
    
    if (detailModal) {
        detailModal.addEventListener('click', (e) => {
            if (e.target === detailModal) closeProductModal();
        });
    }

    // Save phone number typing
    if (whatsappPhoneInput) {
        whatsappPhoneInput.addEventListener('input', () => {
            const rawPhone = whatsappPhoneInput.value.replace(/\s+/g, '');
            localStorage.setItem('tesla_catalog_phone', rawPhone);
            validateEcuadorPhone(rawPhone);
        });
    }
}

// --- RENDER CATALOG ---
function renderCatalog() {
    if (!productGrid) return;
    
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedCat = filterCategory ? filterCategory.value : '';
    const sortVal = filterSort ? filterSort.value : '';

    // Filter
    let filtered = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(query) || 
                              p.description.toLowerCase().includes(query) ||
                              p.category.toLowerCase().includes(query);
        const matchesCategory = selectedCat === '' || p.category === selectedCat;
        return matchesSearch && matchesCategory;
    });

    // Sort
    if (sortVal === 'price-asc') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sortVal === 'price-desc') {
        filtered.sort((a, b) => b.price - a.price);
    }

    // Render cards
    if (filtered.length === 0) {
        productGrid.innerHTML = `
            <div class="cart-empty" style="grid-column: 1 / -1; padding: 5rem 0;">
                <i class="fas fa-search"></i>
                <p>No encontramos productos que coincidan con tu búsqueda.</p>
            </div>
        `;
        return;
    }

    productGrid.innerHTML = '';
    
    filtered.forEach(p => {
        // Initialize slider state for this product if not set
        if (activeSliders[p.id] === undefined) {
            activeSliders[p.id] = 0;
        }

        const isSelected = selectedProducts.includes(p.id);
        const cardClass = isSelected ? 'product-card selected' : 'product-card';
        const hasStock = p.stock > 0;
        const mainImage = p.images && p.images.length > 0 ? p.images[0] : 'https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&w=800&q=80';

        // Render card markup
        const card = document.createElement('div');
        card.className = cardClass;
        card.id = `card-${p.id}`;

        // Generate dots HTML
        let dotsHtml = '';
        if (p.images && p.images.length > 1) {
            p.images.forEach((img, idx) => {
                dotsHtml += `<div class="slider-dot ${idx === activeSliders[p.id] ? 'active' : ''}" onclick="setSlide('${p.id}', ${idx}, event)"></div>`;
            });
        }

        // Generate slides images HTML
        let slidesHtml = '';
        if (p.images && p.images.length > 0) {
            p.images.forEach(img => {
                slidesHtml += `<img src="${img}" class="slider-slide" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&w=800&q=80'">`;
            });
        } else {
            slidesHtml = `<img src="${mainImage}" class="slider-slide" alt="${p.name}">`;
        }

        card.innerHTML = `
            <div class="card-select-wrapper" onclick="toggleProductSelect('${p.id}', event)">
                <div class="checkbox-custom">
                    <i class="fas fa-check"></i>
                </div>
            </div>
            
            <div class="card-badge ${hasStock ? '' : 'out-of-stock'}">
                ${hasStock ? `${p.stock} Disponibles` : 'Agotado'}
            </div>

            <div class="card-media">
                <div class="slider-container" id="slider-${p.id}" style="transform: translateX(-${activeSliders[p.id] * 100}%)">
                    ${slidesHtml}
                </div>
                ${p.images && p.images.length > 1 ? `
                    <button class="slider-btn slider-btn-prev" onclick="prevSlide('${p.id}', event)">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="slider-btn slider-btn-next" onclick="nextSlide('${p.id}', event)">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                    <div class="slider-dots">
                        ${dotsHtml}
                    </div>
                ` : ''}
            </div>

            <div class="card-content">
                <span class="card-category">${p.category}</span>
                <h3 class="card-title" onclick="openProductModal('${p.id}')">${p.name}</h3>
                <div class="card-price">$${p.price.toLocaleString('es-EC')}</div>
                <p class="card-desc">${p.description}</p>
                <div class="card-actions">
                    <button class="btn btn-secondary btn-icon" title="Ver Detalles" onclick="openProductModal('${p.id}')">
                        <i class="fas fa-expand"></i>
                    </button>
                    <button class="btn btn-primary" style="flex-grow: 1;" onclick="shareSingleWhatsApp('${p.id}')">
                        <i class="fab fa-whatsapp"></i> Compartir
                    </button>
                </div>
            </div>
        `;

        productGrid.appendChild(card);
    });
}

// --- SLIDER CONTROLS ---
window.prevSlide = function(productId, event) {
    if (event) event.stopPropagation();
    const p = products.find(prod => prod.id === productId);
    if (!p || !p.images) return;
    
    let current = activeSliders[productId] || 0;
    current = (current - 1 + p.images.length) % p.images.length;
    activeSliders[productId] = current;
    
    updateSliderUI(productId);
};

window.nextSlide = function(productId, event) {
    if (event) event.stopPropagation();
    const p = products.find(prod => prod.id === productId);
    if (!p || !p.images) return;
    
    let current = activeSliders[productId] || 0;
    current = (current + 1) % p.images.length;
    activeSliders[productId] = current;
    
    updateSliderUI(productId);
};

window.setSlide = function(productId, index, event) {
    if (event) event.stopPropagation();
    activeSliders[productId] = index;
    updateSliderUI(productId);
};

function updateSliderUI(productId) {
    const sliderContainer = document.getElementById(`slider-${productId}`);
    if (sliderContainer) {
        const offset = activeSliders[productId] * 100;
        sliderContainer.style.transform = `translateX(-${offset}%)`;
    }
    
    // Update dots
    const dots = document.querySelectorAll(`#card-${productId} .slider-dot`);
    dots.forEach((dot, idx) => {
        if (idx === activeSliders[productId]) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// --- SELECTION & CART LOGIC ---
window.toggleProductSelect = function(productId, event) {
    if (event) event.stopPropagation();
    const idx = selectedProducts.indexOf(productId);
    const card = document.getElementById(`card-${productId}`);
    
    if (idx > -1) {
        selectedProducts.splice(idx, 1);
        if (card) card.classList.remove('selected');
    } else {
        selectedProducts.push(productId);
        if (card) card.classList.add('selected');
    }
    
    updateCartUI();
};

window.removeProductFromCart = function(productId) {
    const idx = selectedProducts.indexOf(productId);
    if (idx > -1) {
        selectedProducts.splice(idx, 1);
    }
    
    const card = document.getElementById(`card-${productId}`);
    if (card) card.classList.remove('selected');
    
    updateCartUI();
};

function updateCartUI() {
    if (cartCount) {
        cartCount.textContent = selectedProducts.length;
        cartCount.style.display = selectedProducts.length > 0 ? 'flex' : 'none';
    }

    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = '';

    if (selectedProducts.length === 0) {
        cartEmptyState.style.display = 'block';
        cartTotalVal.textContent = '$0';
        return;
    }

    cartEmptyState.style.display = 'none';
    let total = 0;

    selectedProducts.forEach(id => {
        const p = products.find(prod => prod.id === id);
        if (!p) return;

        total += p.price;
        const mainImage = p.images && p.images.length > 0 ? p.images[0] : 'https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&w=800&q=80';

        const item = document.createElement('div');
        item.className = 'selected-item';
        item.innerHTML = `
            <img src="${mainImage}" class="selected-item-img" alt="${p.name}">
            <div class="selected-item-info">
                <div class="selected-item-name">${p.name}</div>
                <div class="selected-item-price">$${p.price.toLocaleString('es-EC')}</div>
            </div>
            <button class="selected-item-remove" onclick="removeProductFromCart('${p.id}')">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;
        cartItemsContainer.appendChild(item);
    });

    cartTotalVal.textContent = `$${total.toLocaleString('es-EC')}`;
}

window.toggleCartDrawer = function() {
    if (cartDrawer) {
        cartDrawer.classList.toggle('open');
    }
};

window.closeCartDrawer = function() {
    if (cartDrawer) {
        cartDrawer.classList.remove('open');
    }
};

// --- VALIDATION AND PHONE UTILS ---
function validateEcuadorPhone(phone) {
    if (!phone) {
        if (phoneErrorMsg) phoneErrorMsg.style.display = 'none';
        return false;
    }
    
    // Clean spaces and special characters
    const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');
    
    // Regular expressions for Ecuador numbers:
    // Case 1: 09XXXXXXXX (10 digits starting with 09)
    // Case 2: 5939XXXXXXXX (11 digits starting with 5939)
    const isLocalFormat = /^09\d{8}$/.test(cleanPhone);
    const isIntlFormat = /^5939\d{8}$/.test(cleanPhone);

    if (isLocalFormat || isIntlFormat) {
        if (phoneErrorMsg) phoneErrorMsg.style.display = 'none';
        return true;
    } else {
        if (phoneErrorMsg) {
            phoneErrorMsg.textContent = 'Ingresa un número celular ecuatoriano válido (Ej: 09XXXXXXXX o +5939XXXXXXXX)';
            phoneErrorMsg.style.display = 'block';
        }
        return false;
    }
}

function getFormattedPhone() {
    if (!whatsappPhoneInput) return '';
    let raw = whatsappPhoneInput.value.replace(/[\s\-\+\(\)]/g, '');
    
    if (raw === '') return '';
    
    // Format to 5939XXXXXXXX for WhatsApp Web link
    if (raw.startsWith('09')) {
        raw = '593' + raw.substring(1);
    }
    return raw;
}

// Helper to convert Image URLs or Base64 to a File object for Web Share API
async function urlToFile(url, filename) {
    try {
        if (url.startsWith('data:')) {
            const arr = url.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new File([u8arr], filename, { type: mime });
        } else {
            const response = await fetch(url);
            const blob = await response.blob();
            return new File([blob], filename, { type: blob.type || 'image/jpeg' });
        }
    } catch (err) {
        console.error('Error converting URL to file:', err);
        throw err;
    }
}

// --- WHATSAPP MESSAGE SHARING FLOWS ---

// 1. Share Single Product
window.shareSingleWhatsApp = async function(productId) {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;

    let targetPhone = getFormattedPhone();
    const mainImage = p.images && p.images.length > 0 ? p.images[0] : '';
    
    const message = `⚡ *INTERÉS EN PRODUCTO - QUANTUM* ⚡\n\n` +
                    `Hola, me interesa el siguiente producto de su catálogo:\n\n` +
                    `*🏷️ Producto:* ${p.name}\n` +
                    `*💰 Precio:* $${p.price.toLocaleString('es-EC')} USD\n` +
                    `*📂 Categoría:* ${p.category}\n` +
                    `*⚡ Disponibilidad:* ${p.stock > 0 ? 'En Stock' : 'Bajo pedido'}\n\n` +
                    `*📝 Descripción:* ${p.description}\n\n` +
                    `¡Hola! Por favor confírmeme disponibilidad para proceder.`;

    // Try Web Share API (native share on mobile/supported browsers) to share actual image file
    if (mainImage && navigator.share && navigator.canShare) {
        try {
            const file = await urlToFile(mainImage, `${p.name.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`);
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: p.name,
                    text: message
                });
                return; // successfully shared with image!
            }
        } catch (err) {
            console.warn('Web Share API failed, falling back to standard link:', err);
        }
    }

    // Ask for phone fallback if not provided and valid
    if (targetPhone === '' || !validateEcuadorPhone(whatsappPhoneInput.value)) {
        toggleCartDrawer();
        if (whatsappPhoneInput) whatsappPhoneInput.focus();
        alert('Tu dispositivo no admite compartir imágenes directamente. Se usará el enlace. Por favor, ingresa un número de WhatsApp celular ecuatoriano válido primero en el panel de envío.');
        return;
    }

    const fallbackMessage = message + `\n\n*🖼️ Imagen:* ${mainImage}`;
    const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(fallbackMessage)}`;
    window.open(waUrl, '_blank');
};

// 2. Share Multiple Selected Products
window.shareSelectedWhatsApp = async function() {
    if (selectedProducts.length === 0) {
        alert('Por favor, selecciona al menos un producto utilizando la casilla de verificación.');
        return;
    }

    let targetPhone = getFormattedPhone();
    
    let itemsText = '';
    let total = 0;
    
    selectedProducts.forEach((id, idx) => {
        const p = products.find(prod => prod.id === id);
        if (!p) return;
        
        total += p.price;
        itemsText += `${idx + 1}. *${p.name}* - $${p.price.toLocaleString('es-EC')} (Cat: ${p.category})\n` +
                     `   🔗 Enlace imagen: ${p.images[0] || ''}\n\n`;
    });

    const message = `⚡ *NUEVA SOLICITUD DE PEDIDO - QUANTUM* ⚡\n\n` +
                    `Hola, me interesa cotizar los siguientes productos seleccionados:\n\n` +
                    `${itemsText}` +
                    `*💵 Valor Total Estimado:* $${total.toLocaleString('es-EC')} USD\n\n` +
                    `Por favor contáctame para coordinar detalles de facturación y entrega.`;

    // Try Web Share API (share first selected product image as file)
    const firstSelectedId = selectedProducts[0];
    const firstProduct = products.find(prod => prod.id === firstSelectedId);
    const coverImage = firstProduct && firstProduct.images ? firstProduct.images[0] : '';
    
    if (coverImage && navigator.share && navigator.canShare) {
        try {
            const file = await urlToFile(coverImage, 'pedido_cover.jpg');
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Productos Seleccionados',
                    text: message
                });
                return;
            }
        } catch (err) {
            console.warn('Web Share API failed for multi-product, falling back to link:', err);
        }
    }

    if (targetPhone === '' || !validateEcuadorPhone(whatsappPhoneInput.value)) {
        if (whatsappPhoneInput) whatsappPhoneInput.focus();
        alert('Tu dispositivo no admite compartir imágenes directamente. Se usará el enlace. Por favor, ingresa un número de WhatsApp celular ecuatoriano válido primero.');
        return;
    }

    const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
};

// 3. Share Entire Catalog
window.shareCatalogWhatsApp = async function() {
    if (products.length === 0) {
        alert('No hay productos disponibles en el catálogo en este momento.');
        return;
    }

    let targetPhone = getFormattedPhone();
    
    let catalogText = '';
    products.forEach((p, idx) => {
        catalogText += `🔹 *${p.name}*\n` +
                       `   Precio: $${p.price.toLocaleString('es-EC')} USD | Stock: ${p.stock}\n` +
                       `   Enlace: ${p.images[0] || ''}\n\n`;
    });

    const message = `🌐 *CATÁLOGO COMPLETO - QUANTUM* 🌐\n\n` +
                    `Hola, comparto el enlace de los productos disponibles en nuestro catálogo virtual:\n\n` +
                    `${catalogText}` +
                    `Visítanos para ver más novedades y detalles en tiempo real.`;

    // Try Web Share API (first product image as cover)
    const coverImage = products[0] && products[0].images ? products[0].images[0] : '';
    if (coverImage && navigator.share && navigator.canShare) {
        try {
            const file = await urlToFile(coverImage, 'catalogo_cover.jpg');
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Catálogo de Productos',
                    text: message
                });
                return;
            }
        } catch (err) {
            console.warn('Web Share API failed for catalog, falling back to link:', err);
        }
    }

    // For entire catalog, if phone is not provided, we can ask for it via prompt
    if (targetPhone === '' || !validateEcuadorPhone(whatsappPhoneInput.value)) {
        const promptPhone = prompt("Ingresa el número celular de WhatsApp para enviar el Catálogo Completo (Ej: 09XXXXXXXX):", whatsappPhoneInput.value || "");
        if (promptPhone) {
            if (validateEcuadorPhone(promptPhone)) {
                whatsappPhoneInput.value = promptPhone;
                localStorage.setItem('tesla_catalog_phone', promptPhone.replace(/[\s\-\+\(\)]/g, ''));
                targetPhone = getFormattedPhone();
            } else {
                alert("Número inválido. Proceso cancelado.");
                return;
            }
        } else {
            return;
        }
    }

    const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
};

// --- MODAL DETAILED PRODUCT VIEW ---
window.openProductModal = function(productId) {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;

    if (modalCategory) modalCategory.textContent = p.category;
    if (modalTitle) modalTitle.textContent = p.name;
    if (modalPrice) modalPrice.textContent = `$${p.price.toLocaleString('es-EC')} USD`;
    if (modalDesc) modalDesc.textContent = p.description;
    
    if (modalStatStock) {
        modalStatStock.textContent = p.stock > 0 ? `${p.stock} unidades` : 'Agotado';
        modalStatStock.style.color = p.stock > 0 ? 'var(--accent-turquoise)' : '#E63946';
    }
    
    if (modalStatImages) {
        modalStatImages.textContent = p.images ? `${p.images.length} fotos` : '1 foto';
    }

    // Load active image
    const mainImg = p.images && p.images.length > 0 ? p.images[0] : 'https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&w=800&q=80';
    if (modalActiveImg) {
        modalActiveImg.src = mainImg;
        modalActiveImg.onerror = function() {
            this.src = 'https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&w=800&q=80';
        };
    }

    // Thumbs
    if (modalThumbsContainer) {
        modalThumbsContainer.innerHTML = '';
        if (p.images && p.images.length > 1) {
            p.images.forEach((img, idx) => {
                const thumb = document.createElement('img');
                thumb.src = img;
                thumb.className = `modal-thumb ${idx === 0 ? 'active' : ''}`;
                thumb.alt = `${p.name} - foto ${idx+1}`;
                thumb.onerror = function() {
                    this.src = 'https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&w=800&q=80';
                };
                thumb.addEventListener('click', () => {
                    document.querySelectorAll('.modal-thumb').forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                    if (modalActiveImg) modalActiveImg.src = img;
                });
                modalThumbsContainer.appendChild(thumb);
            });
        }
    }

    // Modal Whatsapp action
    if (modalWhatsappBtn) {
        modalWhatsappBtn.onclick = () => {
            closeProductModal();
            shareSingleWhatsApp(p.id);
        };
    }

    // Show modal
    if (detailModal) {
        detailModal.classList.add('open');
        document.body.style.overflow = 'hidden'; // block page scroll
    }
};

function closeProductModal() {
    if (detailModal) {
        detailModal.classList.remove('open');
        document.body.style.overflow = ''; // restore page scroll
    }
}
