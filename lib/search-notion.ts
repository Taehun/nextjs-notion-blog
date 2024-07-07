// import ky from 'ky'
import nlp from 'compromise'
import ExpiryMap from 'expiry-map'
import fetch from 'isomorphic-unfetch'
import pMemoize from 'p-memoize'

import { api } from './config'
import * as types from './types'

export const searchNotion = pMemoize(searchNotionImpl, {
  cacheKey: (args) => args[0]?.query,
  cache: new ExpiryMap(10000)
})

// 입력한 쿼리가 단어인지 문장인지에 따라 다른 검색 방법 적용 (텍스트 검색/시맨틱 검색)
function isSentence(input) {
  const doc = nlp(input)
  return doc.sentences().length > 0
}

async function searchNotionImpl(
  params: types.SearchParams
): Promise<types.SearchResults> {
  const isSentenceQuery = isSentence(params.query)
  console.log(isSentenceQuery)
  return fetch(api.searchNotion, {
    method: 'POST',
    body: JSON.stringify(params),
    headers: {
      'content-type': 'application/json'
    }
  })
    .then((res) => {
      if (res.ok) {
        return res
      }

      // convert non-2xx HTTP responses into errors
      const error: any = new Error(res.statusText)
      error.response = res
      return Promise.reject(error)
    })
    .then((res) => res.json())

  // return ky
  //   .post(api.searchNotion, {
  //     json: params
  //   })
  //   .json()
}
