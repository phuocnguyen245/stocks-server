const filterBoardStocks = (
  arr: any[],
  pagination: { page: number; size: number; search: string }
) => {
  const { search, page, size } = pagination
  const filteredArr = arr.filter((stock) => stock?.liveboard?.Symbol.includes(search.toUpperCase()))
  const data = filteredArr.slice(page * size, (page + 1) * size)
  return {
    data,
    page,
    size,
    totalItems: filteredArr.length
  }
}
export { filterBoardStocks }
