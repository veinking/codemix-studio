export type ScratchLanguage = 'python' | 'r' | 'javascript' | 'sql';

export type LanguageDrafts = Record<ScratchLanguage, string>;

export interface LanguageDraftTransition {
  drafts: LanguageDrafts;
  code: string;
}

/**
 * Save the editor's synchronous model value before loading another language.
 * React state may still contain the previous debounced value when a toolbar
 * click immediately follows typing or pasting, so the editor value is the
 * authoritative source for the language being left.
 */
export function createLanguageDraftTransition(
  drafts: LanguageDrafts,
  currentLanguage: ScratchLanguage,
  currentEditorValue: string,
  nextLanguage: ScratchLanguage,
): LanguageDraftTransition {
  const nextDrafts = {
    ...drafts,
    [currentLanguage]: currentEditorValue,
  };

  return {
    drafts: nextDrafts,
    code: nextDrafts[nextLanguage] || '',
  };
}
