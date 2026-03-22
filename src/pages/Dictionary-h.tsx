import { DictionaryPage } from './DictionaryPage';

interface DictionaryProps {
  word?: string;
}

export function DictionaryH({ word }: DictionaryProps) {
  return <DictionaryPage word={word} lang="h" />;
}
