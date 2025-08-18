interface TagInfo {
  iconClass: string
  icon: string
  title: string
  tag: string
}

export const genreTags: TagInfo[] = [
  {
    iconClass: 'has-text-info',
    icon: 'fa-ship-large',
    title: 'Authors of the Cruise',
    tag: 'boat',
  },
  {
    iconClass: 'has-text-danger',
    icon: 'fa-rocket-launch',
    title: 'Science Fiction',
    tag: 'scifi',
  },
  {
    iconClass: 'has-text-primary',
    icon: 'fa-dragon',
    title: 'Fantasy',
    tag: 'fantasy',
  },
  {
    iconClass: 'has-text-link',
    icon: 'fa-user-hat-tie-magnifying-glass',
    title: 'Mystery',
    tag: 'mystery',
  },
  {
    iconClass: '',
    icon: 'fa-skull',
    title: 'Horror',
    tag: 'horror',
  },
  {
    iconClass: 'has-text-danger',
    icon: 'fa-hearts',
    title: 'Romance',
    tag: 'romance',
  },
  {
    iconClass: 'has-text-info',
    icon: 'fa-globe-stand',
    title: 'Non-Fiction',
    tag: 'non-fiction',
  },
]

export default function* tagsPages({}: Lume.Data) {
  for (const tag of genreTags) {
    yield {
      ...tag,
      layout: 'tag.vto',
      url: `/tags/${tag.tag}/`,
    }
  }
}
