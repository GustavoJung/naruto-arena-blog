'use client';

import { useMemo } from 'react';
import { Character } from '@/lib/types';
import { findSkillByName } from '@/lib/data';
import SkillTooltip from './SkillTooltip';

interface FormattedStrategyProps {
    text: string;
    characters?: Character[];
}

/**
 * Renders strategy text with interactive skill tooltips.
 * Skill names wrapped in [brackets] become hoverable tooltips.
 */
export default function FormattedStrategy({ text, characters }: FormattedStrategyProps) {
    const parts = useMemo(() => {
        if (!text) return [text];

        const regex = /\[([^\]]+)\]/g;
        const result: (string | { key: string; name: string; skillMatch: ReturnType<typeof findSkillByName> })[] = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(text)) !== null) {
            // Push text before the match
            if (match.index > lastIndex) {
                result.push(text.substring(lastIndex, match.index));
            }

            const skillName = match[1];
            const skillMatch = findSkillByName(skillName, characters);

            result.push({
                key: `${match.index}-${skillName}`,
                name: skillName,
                skillMatch,
            });

            lastIndex = regex.lastIndex;
        }

        // Push remaining text
        if (lastIndex < text.length) {
            result.push(text.substring(lastIndex));
        }

        return result;
    }, [text, characters]);

    return (
        <>
            {parts.map((part, i) => {
                if (typeof part === 'string') {
                    return <span key={i}>{part}</span>;
                }

                if (part.skillMatch) {
                    return (
                        <SkillTooltip
                            key={part.key}
                            skillName={part.name}
                            skill={part.skillMatch}
                        />
                    );
                }

                // Skill not found — render the bracket notation unchanged
                return (
                    <span key={part.key} style={{ opacity: 0.6 }}>
                        [{part.name}]
                    </span>
                );
            })}
        </>
    );
}
