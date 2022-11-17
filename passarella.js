const bar = document.getElementById('bar');
const closed = document.getElementById('closed');
const nav = document.getElementById('navi');

if (bar) {
    bar.addEventListener('click', () => {
        nav.classList.add('active');
    })
}

if (closed) {
    closed.addEventListener('click', () => {
        nav.classList.remove('active');
    })
}
