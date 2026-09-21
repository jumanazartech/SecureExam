import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const FormulaRenderer = ({ content, className = "" }) => {
    if (!content) return null;

    return (
        <div className={`formula-container ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    p: ({ node, ...props }) => <p className="mb-0 inline" {...props} />,
                    span: ({ node, ...props }) => <span className="inline" {...props} />
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default FormulaRenderer;
