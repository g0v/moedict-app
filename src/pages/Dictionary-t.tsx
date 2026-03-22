import { DictionaryPage } from './DictionaryPage';

interface DictionaryProps {
  word?: string;
}

export function DictionaryT({ word }: DictionaryProps) {
  return <DictionaryPage word={word} lang="t" />;
}
