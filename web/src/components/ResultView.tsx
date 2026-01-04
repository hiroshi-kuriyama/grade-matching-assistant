import React from 'react';
import ReactMarkdown from 'react-markdown';
import { extractSections } from '../lib/format';

interface ResultViewProps {
  result: string | null;
  onCopy: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ result, onCopy }) => {
  if (!result) {
    return null;
  }

  const sections = extractSections(result);

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
              <div className="result-content">
                <ReactMarkdown>{section.content}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="result-full">
          <div className="result-content">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultView;
