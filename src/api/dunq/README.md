# Dumb, ugly, neglected queue (dunq)

The new Deno Deploy does not (yet?) support Deno KV Queues like Deno Deploy
"Classic". Dunq is a very simple, barebones replacement for Deno KV Queues that
still relies on Deno KV for storage.

Dunq just relies on a simple KV list operation for its queue, using the natural
sort order of the ULID as the queue order. Instead of running a queue consumer
at all times it relies on a "push" mechanism (distinct from simpler "enqueue")
that will also kick off a simple Worker thread for the consumer. "Top-level"
queue operations can "push" and lower-level ones need only to "enqueue".

Dunq for now, as the nature of being "dumb", won't fan out parallel work to
multiple workers based on queue size or anything like that. Parallel processing
will be up to coincidences in multi-user operations as it currently stands. Dunq
will also not try to retry errored messages and has no dead letter queue or
anything of the sort. Most of the observability of dunq is just console logs. It
is truly a bare bones queue implementation, mostly just enough to be sufficient
for voting operations of this hobby project.

- [`model.ts`](./model.ts) has our enqueue, atomic enqueue, and push operations
- [`../dunq-worker.ts`](../dunq-worker.ts) is run as a background queue consumer
  by push operations
- The worker just wraps the previous Deno KV Queue listener function with the
  `consume` function from [`consumer.ts`](./consumer.ts)
