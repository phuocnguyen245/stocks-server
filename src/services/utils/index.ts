const filterBoardStocks = (
  arr: any[],
  pagination: { page: number; size: number; search: string }
) => {
  const { search, page, size } = pagination
  const filteredArr = (arr || []).filter((stock) => stock?.symbol.includes(search.toUpperCase()))
  const data = filteredArr.slice(page * size, (page + 1) * size)
  return {
    data,
    page,
    size,
    totalItems: filteredArr.length
  }
}

function findDuplicateStocks(arr1: any, arr2: string[]): string[] {
  const duplicateNames: any[] = []
  let i = 0
  let j = 0
  while (i < arr1.length && j < arr2.length) {
    const name1 = arr1[i].symbol
    const name2 = arr2[j]

    if (name1 === name2) {
      duplicateNames.push(arr1[i])
      i++
      j++
    } else if (name1 < name2) {
      i++
    } else {
      j++
    }
  }

  return duplicateNames
}

export { filterBoardStocks, findDuplicateStocks }
