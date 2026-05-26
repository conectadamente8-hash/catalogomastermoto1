// --- ADMIN DASHBOARD LOGIC ---

// Auth Guard
if (sessionStorage.getItem('tesla_admin_auth') !== 'true') {
    window.location.href = 'login.html';
}

// State
let products = [];
let uploadedImages = []; // List of URLs or Base64 strings for the product currently in the form
let editingProductId = null;
let currentTheme = 'dark';

// DOM Elements
const adminProductRows = document.getElementById('admin-product-rows');
const productFormSection = document.getElementById('product-form-section');
const productForm = document.getElementById('product-form');
const formTitle = document.getElementById('form-title');
const saveBtn = document.getElementById('save-btn');
const imagePreviewsGrid = document.getElementById('image-previews-grid');
const prodFileInput = document.getElementById('prod-file-input');
const prodUrlInput = document.getElementById('prod-url-input');

// Inputs
const inputId = document.getElementById('prod-id');
const inputName = document.getElementById('prod-name');
const inputCategory = document.getElementById('prod-category');
const inputPrice = document.getElementById('prod-price');
const inputStock = document.getElementById('prod-stock');
const inputDesc = document.getElementById('prod-desc');

// Metrics
const statTotalProducts = document.getElementById('stat-total-products');
const statOutOfStock = document.getElementById('stat-out-of-stock');
const statCategories = document.getElementById('stat-categories');

// Theme Toggles
const themeToggleBtn = document.getElementById('theme-toggle');

// --- INIT DASHBOARD ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadProducts();
    updateMetrics();
    renderAdminTable();
    
    // Register events
    if (productForm) {
        productForm.addEventListener('submit', handleFormSubmit);
    }
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
});

// Theme Setup
function initTheme() {
    const savedTheme = localStorage.getItem('tesla_catalog_theme');
    if (savedTheme) {
        currentTheme = savedTheme;
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

// Load from Storage
function loadProducts() {
    const stored = localStorage.getItem('tesla_catalog_products');
    if (stored) {
        products = JSON.parse(stored);
    } else {
        products = window.DEFAULT_PRODUCTS || [];
        localStorage.setItem('tesla_catalog_products', JSON.stringify(products));
    }
}

// Update Metrics
function updateMetrics() {
    if (statTotalProducts) statTotalProducts.textContent = products.length;
    
    const outOfStock = products.filter(p => p.stock <= 0).length;
    if (statOutOfStock) statOutOfStock.textContent = outOfStock;
    
    const categoriesCount = new Set(products.map(p => p.category)).size;
    if (statCategories) statCategories.textContent = categoriesCount;
}

// Render Table List
function renderAdminTable() {
    if (!adminProductRows) return;
    adminProductRows.innerHTML = '';
    
    if (products.length === 0) {
        adminProductRows.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 3rem;">
                    <i class="fas fa-box-open" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
                    No hay productos registrados en el catálogo.
                </td>
            </tr>
        `;
        return;
    }
    
    products.forEach(p => {
        const row = document.createElement('tr');
        const mainImage = p.images && p.images.length > 0 ? p.images[0] : 'https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&w=800&q=80';
        const hasStock = p.stock > 0;
        
        row.innerHTML = `
            <td>
                <img src="${mainImage}" class="admin-prod-thumb" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&w=800&q=80'">
            </td>
            <td style="font-weight: 600;">${p.name}</td>
            <td>${p.category}</td>
            <td style="font-weight: 700;">$${p.price.toLocaleString('es-EC')}</td>
            <td>${p.stock}</td>
            <td>
                <span class="admin-badge ${hasStock ? 'admin-badge-success' : 'admin-badge-danger'}">
                    ${hasStock ? 'En Stock' : 'Agotado'}
                </span>
            </td>
            <td>
                <div class="admin-actions-cell">
                    <button class="admin-action-btn" title="Editar" onclick="editProduct('${p.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="admin-action-btn btn-delete" title="Eliminar" onclick="deleteProduct('${p.id}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        `;
        adminProductRows.appendChild(row);
    });
}

// --- CRUD ACTIONS ---

window.openNewProductForm = function() {
    editingProductId = null;
    uploadedImages = [];
    
    if (productForm) productForm.reset();
    if (inputId) inputId.value = '';
    
    if (formTitle) formTitle.innerHTML = `<i class="fas fa-plus-circle" style="color: var(--accent-turquoise); margin-right: 0.5rem;"></i> Agregar Nuevo Producto`;
    if (saveBtn) saveBtn.innerHTML = `<i class="fas fa-plus"></i> Crear Producto`;
    
    renderImagePreviews();
    
    if (productFormSection) {
        productFormSection.style.display = 'block';
        productFormSection.scrollIntoView({ behavior: 'smooth' });
    }
};

window.editProduct = function(productId) {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;
    
    editingProductId = p.id;
    uploadedImages = [...p.images];
    
    if (inputId) inputId.value = p.id;
    if (inputName) inputName.value = p.name;
    if (inputCategory) inputCategory.value = p.category;
    if (inputPrice) inputPrice.value = p.price;
    if (inputStock) inputStock.value = p.stock;
    if (inputDesc) inputDesc.value = p.description;
    
    if (formTitle) formTitle.innerHTML = `<i class="fas fa-edit" style="color: var(--accent-turquoise); margin-right: 0.5rem;"></i> Editar Producto`;
    if (saveBtn) saveBtn.innerHTML = `<i class="fas fa-save"></i> Guardar Cambios`;
    
    renderImagePreviews();
    
    if (productFormSection) {
        productFormSection.style.display = 'block';
        productFormSection.scrollIntoView({ behavior: 'smooth' });
    }
};

window.deleteProduct = function(productId) {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;
    
    if (confirm(`¿Estás seguro de que deseas eliminar "${p.name}" del catálogo?`)) {
        products = products.filter(prod => prod.id !== productId);
        localStorage.setItem('tesla_catalog_products', JSON.stringify(products));
        
        // Hide form if we deleted the product currently editing
        if (editingProductId === productId) {
            closeForm();
        }
        
        updateMetrics();
        renderAdminTable();
    }
};

window.closeForm = function() {
    editingProductId = null;
    uploadedImages = [];
    if (productFormSection) {
        productFormSection.style.display = 'none';
    }
};

// --- FORM SUBMISSION ---
function handleFormSubmit(e) {
    e.preventDefault();
    
    const name = inputName.value.trim();
    const category = inputCategory.value.trim();
    const price = parseFloat(inputPrice.value);
    const stock = parseInt(inputStock.value);
    const description = inputDesc.value.trim();
    
    if (uploadedImages.length === 0) {
        alert('Por favor, agrega al menos una imagen del producto (sube un archivo o ingresa una URL).');
        return;
    }
    
    const productData = {
        id: editingProductId || `prod-${Date.now()}`,
        name,
        category,
        price,
        stock,
        description,
        images: [...uploadedImages]
    };
    
    if (editingProductId) {
        // Edit existing
        const idx = products.findIndex(p => p.id === editingProductId);
        if (idx > -1) {
            products[idx] = productData;
        }
    } else {
        // Create new
        products.push(productData);
    }
    
    localStorage.setItem('tesla_catalog_products', JSON.stringify(products));
    
    closeForm();
    updateMetrics();
    renderAdminTable();
}

// --- FILE UPLOAD AND IMAGES MANAGEMENT ---

window.triggerFileInput = function() {
    if (prodFileInput) {
        prodFileInput.click();
    }
};

window.handleFileSelect = function(e) {
    const files = Array.from(e.target.files);
    
    if (uploadedImages.length + files.length > 4) {
        alert('Puedes subir un máximo de 4 imágenes por producto.');
        return;
    }
    
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(evt) {
            uploadedImages.push(evt.target.result); // Base64 data string
            renderImagePreviews();
        };
        reader.readAsDataURL(file);
    });
    
    // Clear input value to allow uploading same files again
    e.target.value = '';
};

window.addUrlImage = function() {
    if (!prodUrlInput) return;
    const url = prodUrlInput.value.trim();
    
    if (url === '') {
        alert('Por favor, ingresa una URL de imagen válida.');
        return;
    }
    
    if (uploadedImages.length >= 4) {
        alert('Puedes agregar un máximo de 4 imágenes por producto.');
        return;
    }
    
    uploadedImages.push(url);
    prodUrlInput.value = '';
    renderImagePreviews();
};

window.removeUploadedImage = function(index) {
    uploadedImages.splice(index, 1);
    renderImagePreviews();
};

function renderImagePreviews() {
    if (!imagePreviewsGrid) return;
    imagePreviewsGrid.innerHTML = '';
    
    uploadedImages.forEach((img, idx) => {
        const previewBox = document.createElement('div');
        previewBox.className = 'preview-box';
        
        previewBox.innerHTML = `
            <img src="${img}" alt="Preview ${idx + 1}" onerror="this.src='https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&w=800&q=80'">
            <button type="button" class="preview-remove" onclick="removeUploadedImage(${idx})" title="Eliminar">&times;</button>
            ${idx === 0 ? '<div class="preview-main-badge">Principal</div>' : ''}
        `;
        imagePreviewsGrid.appendChild(previewBox);
    });
}

// --- LOGOUT ACTION ---
window.logoutAdmin = function() {
    sessionStorage.removeItem('tesla_admin_auth');
    window.location.href = 'login.html';
};
