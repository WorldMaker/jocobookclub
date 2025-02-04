import { getBallotEligibleBooks } from './clients/static-api.ts'
import {
  Bucket,
  getBucketForUser,
  tallyBucket,
  tallyFinalRanking,
} from './models/tally.ts'
import {
  QueueMessages,
  queueRecountBucketRequested,
  queueTallied,
} from './models/voting.ts'

async function anyRecountBucketsRemaining(kv: Deno.Kv) {
  for await (const bucket of kv.list({ prefix: ['recount-bucket'] })) {
    if (bucket.value) {
      return true
    }
  }
  return false
}

export async function listenQueue(kv: Deno.Kv, msg: unknown) {
  const qmessage = QueueMessages.safeParse(msg)
  if (!qmessage.success) {
    return
  }

  switch (qmessage.data.type) {
    case 'bucket-tallied':
      {
        const books = await getBallotEligibleBooks()
        const time = await kv.get<Date>(['final-tally-time'])
        if (time.value && time.value >= qmessage.data.at) {
          return
        }
        const finalTally = await tallyFinalRanking(kv, books)
        await kv.atomic()
          .check(time)
          .set(['final-tally-time'], qmessage.data.at)
          .set(['final-tally'], finalTally)
          .commit()
      }
      break
    case 'recount-bucket-requested':
      {
        const books = await getBallotEligibleBooks()
        const time = await kv.get<Date>(['tally-time', qmessage.data.bucket])
        const recount = await kv.get<Date>([
          'recount-bucket',
          qmessage.data.bucket,
        ])
        if (recount.value && recount.value > qmessage.data.at) {
          return
        }
        if (time.value && time.value >= qmessage.data.at) {
          const result = await kv.atomic()
            .check(recount)
            .delete(['recount-bucket', qmessage.data.bucket])
            .commit()
          // Fan back in once all recount-bucket times are gone
          if (result.ok && !await anyRecountBucketsRemaining(kv)) {
            await queueTallied(kv, qmessage.data.bucket)
          }
          return
        }
        const tally = await tallyBucket(kv, qmessage.data.bucket, books)
        const result = tally.count > 0
          ? await kv.atomic()
            .check(time)
            .check(recount)
            .delete(['recount-bucket', qmessage.data.bucket])
            .set(['tally-time', qmessage.data.bucket], qmessage.data.at)
            .set(['tally', qmessage.data.bucket], tally)
            .commit()
          : await kv.atomic()
            .check(recount)
            .delete(['recount-bucket', qmessage.data.bucket])
            .delete(['tally-time', qmessage.data.bucket])
            .delete(['tally', qmessage.data.bucket])
            .commit()

        if (!result.ok) {
          return
        }

        // Fan back in once all recount-bucket times are gone
        if (!await anyRecountBucketsRemaining(kv)) {
          await queueTallied(kv, qmessage.data.bucket)
        }
      }
      break
    case 'recount-requested':
      {
        const time = await kv.get<Date>(['final-tally-time'])
        if (time.value && time.value >= qmessage.data.at) {
          return
        }
        // Fan out to recount all buckets
        for (const bucket of Bucket.options) {
          await queueRecountBucketRequested(kv, bucket)
        }
      }
      break
    case 'user-voted':
      {
        const books = await getBallotEligibleBooks()
        const bucket = getBucketForUser(qmessage.data.userId)
        if (!bucket) {
          return
        }
        const time = await kv.get<Date>(['tally-time', bucket])
        if (time.value && time.value >= qmessage.data.at) {
          return
        }
        const tally = await tallyBucket(kv, bucket, books)
        await kv.atomic()
          .check(time)
          .set(['tally-time', bucket], qmessage.data.at)
          .set(['tally', bucket], tally)
          .commit()
        await queueTallied(kv, bucket)
      }
      break
  }
}
