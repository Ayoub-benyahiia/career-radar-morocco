import React from 'react';
import { BookOpen, Code, ExternalLink, Globe, Play } from 'lucide-react';
import { getSkillLearningResources } from '../data/learningResources';

interface LearningResourceBlockProps {
  skillName: string;
  skillId?: number;
  domaine?: string;
  compact?: boolean;
}

export const LearningResourceBlock: React.FC<LearningResourceBlockProps> = ({
  skillName,
  skillId,
  domaine,
  compact = false,
}) => {
  const resource = getSkillLearningResources(skillName, skillId, domaine);

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
        {/* YouTube 1-Tap */}
        <a
          href={resource.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 rounded-lg bg-[#FFF2EE] border border-[#FCD9D0] px-2 py-0.5 text-[10px] font-bold text-[#D9381E] hover:bg-[#FFE3DC] active:scale-95 transition-all cursor-pointer shadow-2xs"
          title={`Rechercher sur YouTube : ${resource.youtubeQuery}`}
        >
          <Play className="h-2.5 w-2.5 fill-current" />
          <span>YouTube</span>
        </a>

        {/* W3Schools 1-Tap */}
        {resource.w3schoolsUrl && (
          <a
            href={resource.w3schoolsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 rounded-lg bg-[#EDF8F1] border border-[#D3ECDA] px-2 py-0.5 text-[10px] font-bold text-[#1F6E4A] hover:bg-[#E1F5E8] active:scale-95 transition-all cursor-pointer shadow-2xs"
            title={`Tutoriel W3Schools pour ${resource.skillName}`}
          >
            <BookOpen className="h-2.5 w-2.5" />
            <span>W3Schools</span>
          </a>
        )}

        {/* GeeksforGeeks 1-Tap */}
        {resource.geeksForGeeksUrl && (
          <a
            href={resource.geeksForGeeksUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 rounded-lg bg-[#EFF6FE] border border-[#DBEAFE] px-2 py-0.5 text-[10px] font-bold text-[#1E40AF] hover:bg-[#DBEAFE] active:scale-95 transition-all cursor-pointer shadow-2xs"
            title={`Guide GeeksforGeeks pour ${resource.skillName}`}
          >
            <Code className="h-2.5 w-2.5" />
            <span>GeeksforGeeks</span>
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#FAF7F2] border border-[#E8E0D2] p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-[#1D2A22] flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#D97E3E]" />
          Ressources pour {resource.skillName}
        </span>
        <span className="text-[10px] text-[#5E6B62] font-mono">1-tap</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* YouTube Quick Search */}
        <a
          href={resource.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#FFF2EE] border border-[#FCD9D0] px-2.5 py-1.5 text-xs font-bold text-[#D9381E] hover:bg-[#FFE3DC] active:scale-95 transition-all cursor-pointer shadow-xs"
          title={`Rechercher : "${resource.youtubeQuery}"`}
        >
          <Play className="h-3 w-3 fill-current" />
          <span>YouTube</span>
        </a>

        {/* W3Schools Quick Link */}
        {resource.w3schoolsUrl && (
          <a
            href={resource.w3schoolsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#EDF8F1] border border-[#D3ECDA] px-2.5 py-1.5 text-xs font-bold text-[#1F6E4A] hover:bg-[#E1F5E8] active:scale-95 transition-all cursor-pointer shadow-xs"
            title="Cours W3Schools étape par étape"
          >
            <BookOpen className="h-3 w-3" />
            <span>W3Schools</span>
          </a>
        )}

        {/* GeeksforGeeks Quick Link */}
        {resource.geeksForGeeksUrl && (
          <a
            href={resource.geeksForGeeksUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#EFF6FE] border border-[#DBEAFE] px-2.5 py-1.5 text-xs font-bold text-[#1E40AF] hover:bg-[#DBEAFE] active:scale-95 transition-all cursor-pointer shadow-xs"
            title="Articles et exemples de code GeeksforGeeks"
          >
            <Code className="h-3 w-3" />
            <span>GeeksforGeeks</span>
          </a>
        )}

        {/* Official Documentation Link */}
        {resource.officialDocsUrl && (
          <a
            href={resource.officialDocsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-[#E8E0D2] px-2.5 py-1.5 text-xs font-semibold text-[#1D2A22] hover:bg-[#F2ECE1] active:scale-95 transition-all cursor-pointer shadow-xs"
            title="Documentation technique officielle"
          >
            <Globe className="h-3 w-3 text-[#5E6B62]" />
            <span>Doc Officielle</span>
            <ExternalLink className="h-2.5 w-2.5 text-[#5E6B62]" />
          </a>
        )}
      </div>
    </div>
  );
};
