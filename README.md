# JoCo Book Club

The JoCo Book Club is a book club for current, former, and new JoCoNauts!

This is a site to help us pick and track which books we want to read next. We
meet regularly on Zoom together to discuss what we've read. We hang out in the
`#book-club` channel of the [JoCo Cruise][jococruise] community Discord and the
[JoCo Book Club specific Facebook Group][fbgroup].

[jococruise]: https://jococruise.com
[fbgroup]: https://www.facebook.com/groups/joconautbookclub

## Getting Started

This site is broken into three main pieces, all of which are built with [Deno].
You will want to install Deno.

CI builds test `deno lint` and `deno fmt`, so you want to be familiar with those
tools.

This repo is a Deno workspace (monorepo) comprising all three main pieces.

[Deno]: https://deno.com

## `src/api`

This is the backend API project, intended for deployment to
[Deno Deploy][deploy]. The API itself is a simple REST app built with [Hono],
using [zod] for model schemas and validation, for easy use of
[Hono's Typescript "RPC" client][trpc].

Data is stored in [Deno KV][denokv].

[Deno Queue][denoq] messages are used for vote calculation. Voting is done via
the [Schulze Method][Schulze] also known as the "beatpath" method.
[Details on the vote queues and calculation method][voting].

[deploy]: https://deno.com/deploy
[denokv]: https://docs.deno.com/deploy/kv/manual/
[denoq]: https://docs.deno.com/deploy/kv/manual/queue_overview/
[Hono]: https://hono.dev
[Schulze]: https://en.wikipedia.org/wiki/Schulze_method
[trpc]: https://hono.dev/docs/guides/rpc
[voting]: ./docs/voting.md
[zod]: https://zod.dev

## `src/bf`

This is the "best friend" library of [Butterfloat] web components that
progressively enhance the site with features to register new accounts, and for
logged in JoCoNauts to vote, manage their accounts, and see live results.

To build it:

```sh
$ deno task build
```

Building the `bf` library drops web component code into the JS assets folder
`src/site/bf` and HTML [Stamps] into the template files folder
`src/site/_includes/bf`.

[Butterfloat]: https://worldmaker.net/butterfloat/
[Stamps]: https://worldmaker.net/butterfloat/#/stamps

## `src/site`

This is the static site and "static book database API" that provides the main
front-end and primary way of describing the books that are on the ballot for
voting. It is powered by [Lume].

To get started, you should build the "best friend" library first. Then you can
build the site, or serve it for continual updates.

Example:

```sh
$ cd src/bf
$ deno task build
$ cd ../site
$ deno task serve # or build
```

Books are described with Markdown files with Front Matter. Required Front Matter
fields are `title`, `author`, and `ltid`. `ltid` is a string containing the Work
ID from [LibraryThing]. This `ltid` is used for linking to LT's very useful
Works pages, and also as a simple ID shared between the frontend site, bf
library, and API backend.

Other fields are set by the folder (collection) the Book file is in:

- `ballot`: These book are active for voting in the current round
- `held`: These books are held for future rounds or other revisiting
- `previous`: These books should have a date in their file name, and are the
  books that have been discussed in previous club meetings
- `upcoming`: These books have been chosen in previous rounds and meetings will
  be scheduled. Scheduled books can add `scheduled: true` to Front Matter and
  add a date to their file name

The Markdown parts of the files define the "Club Thoughts" pages, which we like
to fill with blurbs from JoCoNauts about why the club should read it, and any
Content Warnings/Content Notes that may be useful to set expectations.

[Lume]: https://lume.land
[LibraryThing]: https://www.librarything.com
