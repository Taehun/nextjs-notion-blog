import { ExtendedRecordMap, SearchParams, SearchResults } from 'notion-types'
import { mergeRecordMaps } from 'notion-utils'
import pMap from 'p-map'
import pMemoize from 'p-memoize'

import {
  isPreviewImageSupportEnabled,
  navigationLinks,
  navigationStyle
} from './config'
import { notion } from './notion-api'
import { getPreviewImageMap } from './preview-images'

const getNavigationLinkPages = pMemoize(
  async (): Promise<ExtendedRecordMap[]> => {
    const navigationLinkPageIds = (navigationLinks || [])
      .map((link) => link.pageId)
      .filter(Boolean)

    if (navigationStyle !== 'default' && navigationLinkPageIds.length) {
      return pMap(
        navigationLinkPageIds,
        async (navigationLinkPageId) =>
          notion.getPage(navigationLinkPageId, {
            chunkLimit: 1,
            fetchMissingBlocks: false,
            fetchCollections: false,
            signFileUrls: false
          }),
        {
          concurrency: 4
        }
      )
    }

    return []
  }
)

// 텍스트 블록 타입 정의
const textTypes = new Set([
  'text',
  'header',
  'sub_header',
  'sub_sub_header',
  'bulleted_list',
  'numbered_list',
  'to_do',
  'toggle',
  'quote'
])

// `recordMap`에서 텍스트 블록을 추출하는 함수
function extractTextFromRecordMap(recordMap: any): string {
  let contents = ''

  // `block` 속성에서 모든 블록을 가져옵니다
  const blocks = Object.values(recordMap.block).map(
    (blockObj: any) => blockObj.value
  )

  blocks.forEach((block: any) => {
    const blockType = block.type

    if (textTypes.has(blockType)) {
      const baseContent = block.properties?.title?.join('') + '\n'
      let content = ''

      if (blockType.startsWith('header')) {
        // 제목 블록은 한 줄 공백을 추가
        content = contents.length > 0 ? '\n' + baseContent : baseContent
      } else if (blockType === 'code') {
        // 코드 블록은 앞뒤로 ``` 문자를 추가
        const lang = block[blockType]?.language || ''
        content = `\`\`\`${lang}\n${baseContent}\`\`\`\n`
      } else if (blockType.endsWith('list')) {
        // List item 블록은 앞에 '- ' 문자 추가
        content = '- ' + baseContent
      } else {
        content = baseContent
      }
      contents += content
    }
  })
  return contents
}

export async function getPage(pageId: string): Promise<ExtendedRecordMap> {
  let recordMap = await notion.getPage(pageId)

  if (navigationStyle !== 'default') {
    // ensure that any pages linked to in the custom navigation header have
    // their block info fully resolved in the page record map so we know
    // the page title, slug, etc.
    const navigationLinkRecordMaps = await getNavigationLinkPages()

    if (navigationLinkRecordMaps?.length) {
      recordMap = navigationLinkRecordMaps.reduce(
        (map, navigationLinkRecordMap) =>
          mergeRecordMaps(map, navigationLinkRecordMap),
        recordMap
      )
    }
  }

  if (isPreviewImageSupportEnabled) {
    const previewImageMap = await getPreviewImageMap(recordMap)
    ;(recordMap as any).preview_images = previewImageMap
  }
  const textContent = extractTextFromRecordMap(recordMap)
  console.log(textContent)

  return recordMap
}

export async function search(params: SearchParams): Promise<SearchResults> {
  return notion.search(params)
}
