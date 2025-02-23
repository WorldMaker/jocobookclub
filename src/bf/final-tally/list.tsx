// deno-lint-ignore-file jsx-curly-braces
import { jsx } from '@worldmaker/butterfloat'
import { BookInfo, Ranking } from './vm.ts'

interface RowProps {
  ltid: string
  books: Record<string, BookInfo>
}

function Row({ ltid, books }: RowProps) {
  const book = books[ltid]
  if (!book) {
    return <li>Missing information</li>
  }
  return (
    <li>
      <span>
        <a href={book.url}>{book.title}</a>{' '}
        [<a href={`https://www.librarything.com/work/${ltid}`}>LT</a>]
      </span>
      <span>{' by '}</span>
      <span>{book.author}</span>
    </li>
  )
}

interface ListProps {
  ranking: Ranking
}

export function Top5List({ ranking }: ListProps) {
  const { finalTally, books } = ranking
  return (
    <ol type='1'>
      {finalTally.ranking.toReversed().toSpliced(5).map((ltid) => (
        <Row ltid={ltid} books={books} />
      ))}
    </ol>
  )
}
