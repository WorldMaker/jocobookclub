import { jsx } from '@worldmaker/butterfloat'
import { BookInfo, Ranking } from './vm.ts'

interface RowProps {
  idx: number
  ltid: string
  books: Record<string, BookInfo>
}

function Row({ idx, ltid, books }: RowProps) {
  const book = books[ltid]
  if (!book) {
    return (
      <tr>
        <th>{idx}</th>
        <td colSpan={2}>Missing information</td>
      </tr>
    )
  }
  return (
    <tr>
      <th>{idx}</th>
      <td>
        <a href={book.url}>{book.title}</a>{' '}
        [<a href={`https://www.librarything.com/work/${ltid}`}>LT</a>]
      </td>
      <td>{book.author}</td>
    </tr>
  )
}

interface TableProps {
  ranking: Ranking
}

export function Table({ ranking }: TableProps) {
  const { finalTally, books } = ranking
  return (
    <table class='table'>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Title</th>
          <th>Author</th>
        </tr>
      </thead>
      {/* The list is reversed because sorted in ascending order */}
      <tbody>
        {finalTally.ranking.toReversed().map((ltid, idx) => (
          <Row idx={idx + 1} ltid={ltid} books={books} />
        ))}
      </tbody>
    </table>
  )
}
