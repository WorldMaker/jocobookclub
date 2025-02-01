# Voting Queues

Votes are counted in at least three main steps. These steps happen via
simple queue messages. (This implements the Schulze method as a simple
divide-and-conquer map/reduce via queues.)

## User Vote is Saved

A JoCoNaut saves their updated ballot. Ballots are stored as simple
records from `ltid` to the 1-5 ranks.

This queues a `user-voted` message.

## Vote is Tallied into a Tally Bucket

When a `user-voted` message arrives, the active ballot is pulled from
the Static API (in the main `site`). Based on this active ballot the
records of 1-5 ranks are converted into an adjacency matrix of the
direct wins. A 1 is marked for each edge (pairwise comparison) where
book A beats (strictly, ties are not counted) book B. This matrix form
is referred to here in this app as "a Tally".

Each ballot is assigned to a "tally bucket" (simple hash, based on
reversed User ID, which is the random part of a ULID).

The Tallies (adjacency matrixes) of all the ballots in the bucket are
summed together. (This is a basic, easy matrix sum.) This bucketed Tally
represents the number of voters that prefer each pairwise edge.

This queues a `bucket-tallied` message.

## Tally Buckets are combined into a Final Tally

When a `bucket-tallied` message arrives, the active ballot is pulled
from the Static API. Then every bucket Tally is pulled. These buckets
are reduced to a single Tally using the same simple matrix sum.

This every bucket Tally is then used to produce the Final Tally via the
Floyd-Warshall algorithm that backs the most common Schulze method. This
produces a final "preference matrix" that represents the widest paths of
every pairwise comparison.

A final ranking is produced from this "preference matrix" and ordered by
a simple count of wins (strict wins, ties do not count).

## Other Queue Messages

A `recalculate` message is available to recalculate all buckets and the
final tally.
