import React, { useState, useEffect } from 'react';

interface ResultViewProps {
  result: string | null;
  onCopy: () => void;
}

interface ExtractedSection {
  title: string;
  content: string;
}

const ResultView: React.FC<ResultViewProps> = ({ result, onCopy }) => {
  const [sections, setSections] = useState<ExtractedSection[]>([]);

  useEffect(() => {
    if (!result) {
      setSections([]);
      return;
    }

    // 見出しを抽出（正規表現で検出）
    const headingPattern = /^###?\s+(.+)$/gm;
    const matches: { title: string; index: number }[] = [];
    let match;

    while ((match = headingPattern.exec(result)) !== null) {
      matches.push({
        title: match[1],
        index: match.index,
      });
    }

    // セクションを分割
    const extracted: ExtractedSection[] = [];
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index;
      const end = i < matches.length - 1 ? matches[i + 1].index : result.length;
      const content = result.substring(start, end).replace(/^###?\s+.+$/m, '').trim();
      
      extracted.push({
        title: matches[i].title,
        content,
      });
    }

    setSections(extracted);
  }, [result]);

  if (!result) {
    return null;
  }

  return (
    <div className="result-view">
      <div className="result-header">
        <h2>解析結果</h2>
        <button onClick={onCopy} className="copy-btn">
          指示文をコピー
        </button>
      </div>

      {sections.length > 0 ? (
        <div className="result-sections">
          {sections.map((section, index) => (
            <div key={index} className="result-section">
              <h3>{section.title}</h3>
              <pre>{section.content}</pre>
            </div>
          ))}
        </div>
      ) : (
        <div className="result-full">
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
};

export default ResultView;


