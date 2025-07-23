// Global variables
let galleryData = null;
let currentProduct = null;
let stripe = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeStripe();
    loadGalleryData();
    setupEventListeners();
});

// Initialize Stripe
function initializeStripe() {
    // Replace with your actual Stripe publishable key
    stripe = Stripe('pk_test_your_stripe_publishable_key_here');
}

// Load gallery data from JSON file
async function loadGalleryData() {
    try {
        const response = await fetch('data.json');
        galleryData = await response.json();
        renderGallery();
        setupCategoryFilters();
    } catch (error) {
        console.error('Error loading gallery data:', error);
        document.getElementById('gallery').innerHTML = '<div class="loading">Error loading gallery. Please refresh the page.</div>';
    }
}

// Render the gallery
function renderGallery(filter = 'all') {
    const gallery = document.getElementById('gallery');
    const products = galleryData.products;
    
    let filteredProducts = products;
    if (filter !== 'all') {
        filteredProducts = products.filter(product => product.category === filter);
    }
    
    if (filteredProducts.length === 0) {
        gallery.innerHTML = '<div class="loading">No artwork found in this category.</div>';
        return;
    }
    
    const galleryHTML = filteredProducts.map(product => `
        <div class="gallery-item" data-product-id="${product.id}">
            <img src="${product.image}" alt="${product.title}" loading="lazy">
            <div class="item-info">
                <h3 class="item-title">${product.title}</h3>
                <p class="item-description">${product.description}</p>
                <div class="item-price">$${product.price}</div>
            </div>
        </div>
    `).join('');
    
    gallery.innerHTML = galleryHTML;
    
    // Add click listeners to gallery items
    document.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => {
            const productId = item.dataset.productId;
            openProductModal(productId);
        });
    });
}

// Setup category filters
function setupCategoryFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            const category = button.dataset.category;
            renderGallery(category);
        });
    });
}

// Open product modal
function openProductModal(productId) {
    const product = galleryData.products.find(p => p.id === productId);
    if (!product) return;
    
    currentProduct = product;
    
    // Populate modal content
    document.getElementById('modalImage').src = product.image;
    document.getElementById('modalImage').alt = product.title;
    document.getElementById('modalTitle').textContent = product.title;
    document.getElementById('modalDescription').textContent = product.description;
    document.getElementById('modalPrice').textContent = `$${product.price}`;
    
    // Populate size selector
    const sizeSelect = document.getElementById('sizeSelect');
    sizeSelect.innerHTML = product.sizes.map(size => 
        `<option value="${size}">${size}</option>`
    ).join('');
    
    // Show modal
    document.getElementById('productModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close product modal
function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    currentProduct = null;
}

// Setup event listeners
function setupEventListeners() {
    // Modal close button
    document.querySelector('.close').addEventListener('click', closeProductModal);
    
    // Close modal when clicking outside
    document.getElementById('productModal').addEventListener('click', (e) => {
        if (e.target.id === 'productModal') {
            closeProductModal();
        }
    });
    
    // Buy button
    document.getElementById('buyButton').addEventListener('click', handlePurchase);
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeProductModal();
        }
    });
}

// Handle purchase
async function handlePurchase() {
    if (!currentProduct) return;
    
    const sizeSelect = document.getElementById('sizeSelect');
    const selectedSize = sizeSelect.value;
    
    try {
        // Create checkout session
        const response = await createCheckoutSession(currentProduct, selectedSize);
        
        if (response.sessionId) {
            // Redirect to Stripe Checkout
            const result = await stripe.redirectToCheckout({
                sessionId: response.sessionId
            });
            
            if (result.error) {
                alert('Error: ' + result.error.message);
            }
        } else {
            alert('Error creating checkout session. Please try again.');
        }
    } catch (error) {
        console.error('Purchase error:', error);
        alert('Error processing purchase. Please try again.');
    }
}

// Create checkout session (this would typically be handled by your backend)
async function createCheckoutSession(product, size) {
    // This is a placeholder - you'll need to implement this with your backend
    // For now, we'll simulate the process
    
    const sessionData = {
        product_id: product.id,
        title: product.title,
        price: product.price,
        size: size,
        image: product.image
    };
    
    // In a real implementation, you would send this to your backend
    // which would create a Stripe checkout session
    console.log('Creating checkout session for:', sessionData);
    
    // For demo purposes, we'll return a mock session ID
    // In production, this would be a real Stripe session ID from your backend
    return {
        sessionId: 'mock_session_id_' + Date.now()
    };
}

// Handle successful payment (this would be called by your webhook)
function handleSuccessfulPayment(session) {
    console.log('Payment successful:', session);
    // You could redirect to a success page or show a success message
    alert('Thank you for your purchase! You will receive an email confirmation shortly.');
}

// Utility function to format price
function formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(price);
}

// Add loading state
function showLoading() {
    document.getElementById('gallery').innerHTML = '<div class="loading">Loading artwork...</div>';
}

// Error handling
function showError(message) {
    document.getElementById('gallery').innerHTML = `<div class="loading">${message}</div>`;
}

// Lazy loading for images
function setupLazyLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
}

// Initialize lazy loading after gallery is rendered
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(setupLazyLoading, 100);
});
