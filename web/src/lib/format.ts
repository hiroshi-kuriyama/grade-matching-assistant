/**
 * 出力テキストの見出し抽出
 * 「全体方針」「推奨ノード構成」「各ノードの具体指示」を抽出
 */

export interface ExtractedSection {
  title: string;
  content: string;
}

/**
 * テキストから見出しセクションを抽出
 */
export function extractSections(text: string): ExtractedSection[] {
  // 見出しパターン（### または ##）
  const headingPattern = /^(###?\s+)(.+)$/gm;
  const matches: { title: string; index: number }[] = [];
  let match;

  while ((match = headingPattern.exec(text)) !== null) {
    matches.push({
      title: match[2].trim(),
      index: match.index,
    });
  }

  if (matches.length === 0) {
    return [];
  }

  // セクションを分割
  const sections: ExtractedSection[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i < matches.length - 1 ? matches[i + 1].index : text.length;
    let content = text.substring(start, end);
    
    // 見出し行を削除
    content = content.replace(/^###?\s+.+$/m, '').trim();
    
    sections.push({
      title: matches[i].title,
      content,
    });
  }

  return sections;
}

