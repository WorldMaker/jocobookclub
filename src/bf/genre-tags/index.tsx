import { jsx } from '@worldmaker/butterfloat'
import rawTags from '../../site/_data/genre/tags.json' with { type: 'json' }

const baseUrl = 'https://worldmaker.net/jocobookclub'

interface TagInfo {
  iconClass: string
  icon: string
  title: string
  name?: string
  tagClass: string
  tagIconClass: string
}

const genreTags = rawTags as Record<string, TagInfo>

interface GenreTagProps {
  tag: string
  info: TagInfo
}

export function GenreTag({ tag, info }: GenreTagProps) {
  return (
    <a class={`tag ${info.tagClass}`} href={`${baseUrl}/tag/${tag}`}>
      <span class={`icon ${info.tagIconClass}`}>
        <i class={`fa-duotone fa-solid ${info.icon}`}></i>
      </span>
      {info.name ?? info.title}
    </a>
  )
}

export function GenreTags({ tags }: { tags: string[] }) {
  return (
    <div class='tags'>
      {tags
        .filter((tag) => Boolean(genreTags[tag]))
        .map((tag) => <GenreTag tag={tag} info={genreTags[tag]} />)}
    </div>
  )
}
