import type { UserId } from '../models/user.ts'

/**
 * Reverse the ULID string
 *
 * General reversing of strings is usually not a good idea (for example, it can break Unicode characters),
 * but we know the ULID is a fixed-length string with a limited character set.
 *
 * We are reversing the ULID to get a more interestingly bucketed key in the KV store. Assuming the random
 * part of the ULID is well-distributed, reversing the ULID will distribute the keys in the KV store in a
 * relatively random way, whereas the original ULID would have the keys in a more sequential cluster due to
 * the time component.
 * @param ulid ULID
 * @returns Reversed ULID
 */
export function reverseUlid(ulid: UserId) {
  return [...ulid].reverse().join('')
}
