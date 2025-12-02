// Cart management functions
function getCart() {
    const cartJson = localStorage.getItem('cart');
    return cartJson ? JSON.parse(cartJson) : [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Product map with all product information
const productMap = {
    'prod_THxuZf4QLqQZjx': { name: 'Time For Everything', price: '70.00', description: 'Time For Everything A4' },
    'prod_THxtUYehCZREGs': { name: 'The Entity', price: '70.00', description: 'The Entity A4' },
    'prod_THxt1F5RED4cA0': { name: 'The Beginning of the End', price: '70.00', description: 'The Beginning of the End A4' },
    'prod_THxs9v5Opt7nLE': { name: 'Sunrise', price: '30.00', description: 'This is my amateur attempt of Cubism I made with scraps of paper & paint.Reflections of trees on water in the pinkish orange glow of the first light surrounded by the retreating blue and purple tones of the previous night.Theres something about those magical moments of \'Sunrise that can only be experienced in person but This piece reminds us of that feeling.' },
    'prod_THxsLAj73IHzkE': { name: 'Stop Act Natural', price: '70.00', description: 'Stop Act Natural A4' },
    'prod_THxrYIKdiioCj0': { name: 'Reflections Of Another Time', price: '70.00', description: 'Reflections Of Another Time A4' },
    'prod_THxro1C7XRM9az': { name: 'Pearse Station', price: '70.00', description: 'Pearse Station A4' },
    'prod_THxqRtGSS6Vmpe': { name: 'Past The Fairy Tree', price: '70.00', description: 'Past The Fairy Tree A4' },
    'prod_THxqmYzRyyk3nj': { name: 'Infinite Possibilities', price: '70.00', description: 'We\'re all on spaceship Earth with everything we need to grow and live in harmony, yet we don\'t. We could live in tandem with nature, but the status quo resists change. Those hit hardest are in the global south, far from societies that profit from engineered scarcity. We celebrate short-term gain while ignoring long-term harm. We have infinite possibilities ahead of us, yet we\'re drowning in the waste of our own greed.' },
    'prod_THxpTmKXkUy4hv': { name: 'Dream Junction', price: '70.00', description: 'Dream Junction' },
    'prod_THxmI6LnBR3JaD': { name: 'Away with the Faries', price: '70.00', description: 'Away with the Faries' },
    'prod_THxmm6GeFBK9cj': { name: 'A Place To Escape To', price: '70.00', description: 'A Place To Escape To A4' },
    'prod_THiit7KwAsGYoi': { name: 'Big Rock Candy Mountain', price: '70.00', description: 'Inspired by Vinicunca Mountain in Peru & an exaggerated take on Irish country vistas and architecture Big Rock Candy Mountain is a painting & collage that started with the playful water sky.It\'s an eye-catching and cheerful colourful piece that comes with the song playing in your head.Fine Art Print,Including Shipping A4' },
    'prod_THihQygkuRpT4G': { name: 'Garden of Kevinity', price: '90.00', description: 'I wanted to gift my dear little brother Kevin with a picture with everything in it.For Kevin to enjoy finding new things the longer he looked.This came from the bottom of my heart and was the very first piece I made, the piece that gave me the itch to continue and fall into this wonderful new addiction.Love you Kev. XFine Art Print,Including Shipping A3 ' },
    'prod_THigAUxOVR7lIH': { name: 'If Only I Was a Giant Dinosaur', price: '70.00', description: 'This playful piece just vibes with old monster movies using the New Yorks skyline circa 1940\'s. It truly begs the question \'If Only I was a Giant Dinosaur ?Id crunch them all I tell\'s ya, AYEE IM Walking Here.Fine Art Print,Including Shipping A4 ' },
    'prod_THieNC4E5rjJ2I': { name: 'Club Mc Meowly\'s', price: '90.00', description: 'Think George Micheal singing \'Club Mc Meowly\'s drinks are free-ee…This shows just how cool cats hang out and party like it twas 19 dickity 80\'s.There\'s lots of characterful cats to discover, my favourite is the pretty \'cat secrets cat in the top right and then maybe the Kung-Fu fighting cats in the Cateroke bar.Those cats were fast as lightning.Fine Art Print,Including Shipping A3 ' },
    'prod_THhx0dGKpMBzjA': { name: 'Mc Meowly\'s Lounge', price: '90.00', description: 'The rustic and majestic lounge for Irish cats to lounge around singing and meowing together.I tried to capture the old Irish pub/shop/town living room that rural and townsfolk would have been all too familiar with.There\'s 31, no wait 36 cats in this piece, maybe….I think.You\'ll have to count them yourself.Fine Art Print,Including Shipping A3' },
    'prod_THhw4MKoZ3jkk9': { name: 'Oh Dorothy', price: '1.00', description: 'Oh Dorothy was especially made for my brave and true Mammy. She complained I hadn\'t given her enough art so during hard times I tried my best to makesomething pretty for her.In Dorothys basket we can see Mam\'s puppy Frida on their way to the Emerald city (seen in the distance).Dorothy is struggling to follow a monk like woman  through the colourful landscape.Lots of sweet things to pick out here.[Gold Frame not included]Fine Art Print,Including Shipping A4' },
    'prod_THDi4qLDA9Ty2E': { name: 'Big Rock Candy Mountain A4', price: '70.00', description: 'Big Rock Candy MountainPO 04 Collage 2 2 ' }
};

// Helper function to truncate description to 200 characters
function truncateDescription(desc) {
    if (!desc) return '';
    return desc.length > 200 ? desc.substring(0, 197) + '...' : desc;
}

// Truncate all descriptions in productMap
Object.keys(productMap).forEach(key => {
    productMap[key].description = truncateDescription(productMap[key].description);
});

// Add item to cart function
function addItemToCart(productId, buttonElement) {
    const product = productMap[productId] || { name: 'Print', price: '30.00', description: '' };
    const cart = getCart();
    cart.push({ 
        id: productId, 
        name: product.name, 
        price: product.price,
        description: product.description || ''
    });
    saveCart(cart);
    
    // Show feedback on the button
    // Get button from parameter or from global event object (available in inline onclick handlers)
    const btn = buttonElement || (typeof event !== 'undefined' ? event.target : null);
    if (btn) {
        const originalText = btn.textContent;
        btn.textContent = 'Added!';
        btn.disabled = true;
        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
        }, 1000);
    }
    
    // If we're on the cart page, refresh the cart display
    if (typeof displayCart === 'function') {
        displayCart();
    }
}

// Make functions available globally
window.getCart = getCart;
window.saveCart = saveCart;
window.addItemToCart = addItemToCart;

