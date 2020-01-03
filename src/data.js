/* --- Пример БД --- */
const data = {
    authors: [
        {
            id: 1,
            name: 'Айзек',
            surname: 'Азимов',
            about: 'Американский писатель-фантаст, популяризатор науки, биохимик.',
            email: 'azimov@site.ru',
            site: 'azimov.site.ru'
        },
        {
            id: 2,
            name: 'Клиффорд',
            surname: 'Саймак',
            about: 'Американский писатель, автор научной фантастики и фэнтези, считается одним из основателей современной американской фантастики.',
            email: 'simak@site.ru',
            site: 'simak.site.ru'
        },
        {
            id: 3,
            name: 'Артур Конан',
            surname: 'Дойл',
            about: 'Английский писатель, работающий в приключенческом, детективном, научно-фантастическом и юмористическом стилях.',
            email: 'doyle@site.ru',
            site: 'doyle.site.ru'
        }
    ],
    publishers: [
        {
            id: 1,
            name: 'Издательство АСТ',
            address: null,
            telephone: '+7(123)456-7890',
            email: 'ast@site.ru',
            site: 'ast.site.ru'
        },
        {
            id: 2,
            name: 'Издательство Эксмо',
            address: null,
            telephone: '+7(123)456-7890',
            email: 'eksmo@site.ru',
            site: 'eksmo.site.ru'
        },
        {
            id: 3,
            name: 'Издательство Азбука',
            address: null,
            telephone: '+7(123)456-7890',
            email: 'azbuka@site.ru',
            site: 'azbuka.site.ru'
        }
    ],
    books: [
        {
            id: 1,
            name: 'Заповедник гоблинов',
            authors: [2],
            publisher: 2,
            genre: ['fantasy'],
            year: 1968,
            pages: 200,
            inStock: true,
            price: 289.00
        },
        {
            id: 2,
            name: 'Звездное наследие',
            authors: [2],
            publisher: 1,
            genre: ['fantasy'],
            year: 1977,
            pages: 190,
            inStock: true,
            price: 129.00
        },
        {
            id: 3,
            name: 'Я, робот',
            authors: [1],
            publisher: 2,
            genre: ['fantasy'],
            year: 1950,
            pages: 250,
            inStock: true,
            price: 239.90
        },
        {
            id: 4,
            name: 'Собака Баскервилей',
            authors: [3],
            publisher: 3,
            genre: ['crime'],
            year: 1901,
            pages: 200,
            inStock: true,
            price: 199.00
        },
        {
            id: 5,
            name: 'Рассказы о Шерлоке Холмсе (сборник)',
            authors: [3],
            publisher: 2,
            genre: ['crime'],
            year: null,
            pages: 280,
            inStock: false,
            price: 119.90
        },
    ],
    comments: [
        {id: 1, bookId: 3, author: 'Ivan', text: 'Замечательная книга.', publishedAt: 1578137367},
        {id: 2, bookId: 4, author: 'Elena', text: 'Очень интересно, рекомендую.', publishedAt: 1578025705}
    ],
};

/* --- Покупательская корзина --- */
const order = {
    books: {},  // { id1: count1, id2: count2, ... }
    discountPercentForUser: 0,
    priceAll: 0
};

/* --- Добавить один экземпляр книги в корзину --- */
const addBookToOrder = (id) => {
    const book = data.books.find(item => item.id === id);
    if (id && book) {
        const listId = Object.keys(order.books);
        if (listId.includes(id.toString())) {
            order.books[id] += 1;
        } else {
            order.books[id] = 1;
        }
        calcPriceAll();
        calcDiscountPercentForUser();
        return true;
    }
    return false;
};

/* --- Удалить из корзины один или все экземпляры книги --- */
const removeBookFromOrder = (id, all) => {
    const listId = Object.keys(order.books);
    if (listId.includes(id.toString())) {
        if (all) {
            delete order.books[id.toString()];
        } else {
            const newCount = order.books[id.toString()] - 1;
            if (newCount <= 0) delete order.books[id.toString()];
            else order.books[id.toString()] = newCount;
        }
        calcPriceAll();
        calcDiscountPercentForUser();
        return true;
    }
    return false;
};

/* --- Очистить корзину --- */
const clearOrder = () => {
    order.books = {};
    order.discountPercentForUser = 0;
    order.priceAll = 0;
    return true;
};

/* --- Подсчет суммарной стоимости всех выбранных книг --- */
const calcPriceAll = () => {
    let sum = 0;
    Object.keys(order.books).forEach(id => {
        const book = data.books.find(item => item.id === parseInt(id));
        const price = book.price || 0;
        sum += price * order.books[id];
    });
    if (sum > 0) {
        sum = Math.round(sum * 100) / 100;
    }
    order.priceAll = sum;
};

/* --- Скидка при покупке на сумму более 1000 --- */
const calcDiscountPercentForUser = () => {
    order.discountPercentForUser = order.priceAll > 1000 ? 0.05 : 0;
};

module.exports = { data, order, addBookToOrder, removeBookFromOrder, clearOrder };
