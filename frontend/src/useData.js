import useSWR from 'swr'

export default function useData() {
  const fetcher = (...args) => fetch(...args).then((res) => res.json())

  const { data, error } = useSWR('/data-index.json', fetcher)
  return {
    data,
    isLoading: !error && !data,
    isError: error,
  }
}
