const { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLEnumType, GraphQLFloat,
    GraphQLBoolean, GraphQLList, GraphQLNonNull, GraphQLInputObjectType } = require('graphql');
const { GraphQLEmail, GraphQLURL, GraphQLDateTime } = require('graphql-custom-types');

const { data, order, addBookToOrder, removeBookFromOrder, clearOrder } = require('./data');

const AuthorType = new GraphQLObjectType({
    name: 'Author',
    description: 'Автор книги',
    fields: () => ({
        id: { type: GraphQLNonNull(GraphQLInt) },
        name: { type: GraphQLNonNull(GraphQLString) },
        surname: { type: GraphQLNonNull(GraphQLString) },
        about: { type: GraphQLString },
        email: { type: GraphQLEmail },
        site: { type: GraphQLURL }
    }),
});

const PublisherType = new GraphQLObjectType({
    name: 'Publisher',
    description: 'Издательство',
    fields: () => ({
        id: { type: GraphQLNonNull(GraphQLInt) },
        name: { type: GraphQLNonNull(GraphQLString) },
        address: { type: GraphQLString },
        telephone: { type: GraphQLString },
        email: { type: GraphQLEmail },
        site: { type: GraphQLURL }
    }),
});

const CommentType = new GraphQLObjectType({
    name: 'Comment',
    description: 'Комментарий к книге',
    fields: () => ({
        id: { type: GraphQLNonNull(GraphQLInt) },
        author: { type: GraphQLString },
        text: { type: GraphQLString },
        publishedAt: { type: GraphQLNonNull(GraphQLDateTime) }
    }),
});

const GenreEnum = new GraphQLEnumType({
    name: 'Genre',
    description: 'Жанры',
    values: {
        BIOGRAPHY: { value: 'biography' },
        CLASSIC: { value: 'classic' },
        CRIME: { value: 'crime' },
        FANTASY: { value: 'fantasy' },
        HUMOR: { value: 'humor' },
        ROMANTIC: { value: 'romantic' },
        OTHER: { value: 'other' }
    }
});

const SortEnum = new GraphQLEnumType({
    name: 'Sort',
    description: 'Порядок сортировки списка книг (по названию книг)',
    values: {
        ASC: { value: 'ASC' },
        DESC: { value: 'DESC' }
    }
});

const CountBookOnPageType = new GraphQLEnumType({
    name: 'CountBookOnPage',
    description: 'Количество книг, показываемых на одной странице',
    values: {
        LITTLE: { value: 1 },   //test=1, prod=30
        MEDIUM: { value: 2 },   //test=2, prod=60
        MANY: { value: 3 }      //test=3, prod=120
    }
});

const ParametresBooksType = new GraphQLInputObjectType({
    name: 'ParametresBooks',
    description: 'Параметры запроса списка книг',
    fields: () => ({
        idAuthor: { type: GraphQLInt },
        idPublisher: { type: GraphQLInt },
        genre: { type: GenreEnum },
        inStock: { type: GraphQLBoolean },
        page: {
            type: GraphQLInt,
            defaultValue: 1
        },
        count: {
            type: CountBookOnPageType,
            defaultValue: 5    //test=5, prod=30
        },
        sort: {
            type: SortEnum,
            defaultValue: 'ASC'
        }
    }),
});

const BookType = new GraphQLObjectType({
    name: 'Book',
    description: 'Книга',
    fields: () => ({
        id: { type: GraphQLNonNull(GraphQLInt) },
        name: { type: GraphQLNonNull(GraphQLString) },
        authors: {
            type: GraphQLList(GraphQLNonNull(AuthorType)),
            resolve: (source) => {
                return data.authors.filter(item => source.authors.includes(item.id));
            }
        },
        publisher: {
            type: PublisherType,
            resolve: (source) => {
                return data.publishers.find(item => item.id === source.publisher) || null;
            }
        },
        genre: {
            type: GraphQLList(GraphQLNonNull(GenreEnum))
        },
        year: { type: GraphQLInt },
        pages: { type: GraphQLInt },
        inStock: { type: GraphQLNonNull(GraphQLBoolean) },
        price: { type: GraphQLNonNull(GraphQLFloat) },
        comments: {
            type: GraphQLList(GraphQLNonNull(CommentType)),
            resolve: (source, { limit }) => {
                if (limit < 0) throw new Error('`limit` argument MUST be a positive Integer.');
                return source.comments.map(item => item.bookId === source.id).slice(0, limit);
            }
        }
    }),
});

const BookInOrderType = new GraphQLObjectType({
    name: 'BookInOrder',
    description: 'Книга в корзине',
    fields: () => ({
        book: { type: GraphQLNonNull(BookType) },
        count: { type: GraphQLNonNull(GraphQLInt) }
    }),
});

const OrderType = new GraphQLObjectType({
    name: 'Order',
    description: 'Покупательская корзина',
    fields: () => ({
        books: { type: GraphQLList(GraphQLNonNull(BookInOrderType)) },
        discountPercentForUser: { type: GraphQLNonNull(GraphQLFloat) },
        priceAll: { type: GraphQLNonNull(GraphQLFloat) }
    }),
});

const QueryType = new GraphQLObjectType({
    name: 'Query',
    fields: {
        author: {
            args: {
                id: { type: GraphQLInt }
            },
            type: AuthorType,
            resolve: (source, { id }) => {
                return data.authors.find(item => item.id === id) || null;
            }
        },
        book: {
            args: {
                id: { type: GraphQLInt }
            },
            type: BookType,
            resolve: (source, { id }) => {
                return data.books.find(item => item.id === id) || null;
            }
        },
        books: {
            args: {
                parametres: { type: ParametresBooksType }
            },
            type: GraphQLList(BookType),
            resolve: (source, args) => {
                const { idAuthor, idPublisher, genre, inStock, page, count, sort } = { ...args.parametres };
                return  data.books.filter(item => {
                    return ( !idAuthor || (item.authors.includes(idAuthor)) ) &&
                        ( !idPublisher || (item.publisher === idPublisher) ) &&
                        ( !genre || (item.genre.includes(genre)) ) &&
                        ( inStock === undefined || inStock === null || item.inStock === inStock );
                }).sort((book1, book2) => {
                    return sort === 'ASC' ? book1.name.localeCompare(book2.name) : book2.name.localeCompare(book1.name)
                }).slice(count * (page - 1), count * page);
            }
        },
        order: {
            type: OrderType,
            resolve: () => {
                const listId = Object.keys(order.books);
                const booksInOrder = data.books.filter(item => listId.includes(item.id.toString())).map(item => {
                        return { book: item, count: order.books[item.id.toString()]}
                    });
                return {
                    books: booksInOrder,
                    discountPercentForUser: order.discountPercentForUser,
                    priceAll: order.priceAll
                };
            }
        }
    },
});

const MutationType = new GraphQLObjectType({
    name: "Mutation",
    fields: {
        addBookToOrder: {
            type: GraphQLBoolean,
            args: {
                id: { type: GraphQLNonNull(GraphQLInt) },
            },
            resolve: (source, { id }) => addBookToOrder(id)
        },
        removeBookFromOrder: {
            type: GraphQLBoolean,
            args: {
                id: { type: GraphQLNonNull(GraphQLInt) },
                all: { type: GraphQLBoolean }
            },
            resolve: (source, { id, all }) => removeBookFromOrder(id, all)
        },
        clearOrder: {
            type: GraphQLBoolean,
            resolve: () => clearOrder()
        }
    }
});

const schema = new GraphQLSchema({
    query: QueryType,
    mutation: MutationType
});


module.exports = schema;
