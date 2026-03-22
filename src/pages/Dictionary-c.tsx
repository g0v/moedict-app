import { DictionaryPage } from './DictionaryPage';

interface DictionaryProps {
  word?: string;
}

export function DictionaryC({ word }: DictionaryProps) {
  return <DictionaryPage word={word} lang="c" />;
}
