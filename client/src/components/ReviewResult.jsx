import React from 'react';
import ScoreCard from './ScoreCard.jsx';
import IssueList from './IssueList.jsx';
import CleanCodeViewer from './CleanCodeViewer.jsx';

export default function ReviewResult({ result, language }) {
  if (!result) return null;

  const { summary, bugs, security, performance, refactor, scores, cleanCode } = result;

  return (
    <div className="space-y-8">
      {summary && (
        <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 p-6 text-sm leading-relaxed text-slate-200">
          {summary}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <ScoreCard label="Readability" score={scores?.readability} />
        <ScoreCard label="Security" score={scores?.security} />
        <ScoreCard label="Overall" score={scores?.overall} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <IssueList title="Bugs" items={bugs} emptyText="No bugs found." />
        <IssueList
          title="Security Vulnerabilities"
          items={security}
          emptyText="No security vulnerabilities found."
          type="security"
        />
        <IssueList
          title="Performance Issues"
          items={performance}
          emptyText="No performance issues found."
        />
        <IssueList
          title="Refactor Suggestions"
          items={refactor}
          emptyText="No refactor suggestions."
          type="refactor"
        />
      </div>

      <CleanCodeViewer code={cleanCode} language={language} />
    </div>
  );
}
