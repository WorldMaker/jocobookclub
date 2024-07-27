interface BookInfo {
    title: string
    author: string
    scheduledDate?: Date
    ltid: string
}

interface BooksByLtid {
    [key: string]: BookInfo
}

function byLtId(books: BookInfo[]): BooksByLtid {
    return books.reduce((acc, book) => ({ ...acc, [book.ltid]: book }), {} as BooksByLtid)
}

export default function *staticApi({ search }: Lume.Data) {
    const previousBooks = search.pages('previous')
        .map(page => ({ title: page.title!, author: page.author, scheduledDate: page.date, ltid: page.ltid }))
    const previousBooksByLtid = byLtId(previousBooks)
    yield {
        url: '/static-api/previous.json',
        contentType: "application/json",
        content: JSON.stringify(previousBooksByLtid)
    }
    const upcomingBooks = search.pages('upcoming')
        .map(page => ({ title: page.title!, author: page.author, scheduledDate: page.scheduled ? page.date : undefined, ltid: page.ltid }))
    const upcomingBooksByLtid = byLtId(upcomingBooks)
    yield {
        url: '/static-api/upcoming.json',
        contentType: "application/json",
        content: JSON.stringify(upcomingBooksByLtid)
    }
}
