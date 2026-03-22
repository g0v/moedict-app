import { DictionaryPage } from './DictionaryPage';

interface DictionaryProps {
  word?: string;
}

export function DictionaryA({ word }: DictionaryProps) {
  return <DictionaryPage word={word} lang="a" />;
}
