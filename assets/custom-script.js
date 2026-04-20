const productCard = document.querySelectorAll('.card-wrapper.product-card-wrapper')

productCard.forEach((card) => {
    const badge = card.querySelector('.product_badge');
    const target = card.querySelector('.card__media');
    if (target) {
        target.appendChild(badge);
    }
})