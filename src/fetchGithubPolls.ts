import axios, { AxiosResponse } from 'axios'
import { ParsedSpockPoll, PollWithRawMetadata } from './polls'

export default async function fetchGithubPolls(
  parsedSpockPolls: ParsedSpockPoll[]
): Promise<PollWithRawMetadata[]> {
  const spockPollsInChunks = []
  const chunkSize = 20
  const pollsRes = []

  for (let i = 0; i < parsedSpockPolls.length; i += chunkSize) {
    spockPollsInChunks.push(parsedSpockPolls.slice(i, i + chunkSize))
  }

  for (let j = 0; j < spockPollsInChunks.length; j++) {
    const settledPolls = await Promise.allSettled(
      spockPollsInChunks[j].map(async (poll) => {
        const res: AxiosResponse<string> = await axios.get(poll.url)
        return {
          ...poll,
          rawMetadata: res.data,
        }
      })
    )

    pollsRes.push(...settledPolls)
  }

  const polls = pollsRes
    .map((promise) => (promise.status === 'fulfilled' ? promise.value : null))
    .filter((poll) => !!poll) as PollWithRawMetadata[]

  return polls
}
