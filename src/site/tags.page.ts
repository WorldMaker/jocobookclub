import genreTags from './_data/genre/tags.json' with { type: 'json' }

interface TagInfo {
  iconClass: string
  icon: string
  title: string
  tag: string
}

export default function* tagsPages({}: Lume.Data) {
  for (const [tag, info] of Object.entries(genreTags)) {
    yield {
      ...info as TagInfo,
      tag,
      layout: 'tag.vto',
      url: `/tags/${tag}/`,
    }
  }
}
