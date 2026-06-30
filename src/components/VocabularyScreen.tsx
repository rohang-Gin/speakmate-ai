'use client'
import { useEffect, useState } from 'react'
import { ArrowLeft, BookOpen, Search, Trash2 } from 'lucide-react'
import { loadProgress, saveProgress } from '@/lib/storage'
import { VocabEntry } from '@/types'

interface Props { onBack: () => void }

export default function VocabularyScreen({ onBack }: Props) {
  const [vocab, setVocab] = useState<VocabEntry[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => { setVocab(loadProgress().vocabularyNotebook) }, [])

  const filtered = vocab.filter(v =>
    v.word.toLowerCase().includes(search.toLowerCase()) ||
    v.meaning.toLowerCase().includes(search.toLowerCase())
  )

  const removeWord = (word: string) => {
    const p = loadProgress()
    p.vocabularyNotebook = p.vocabularyNotebook.filter(v => v.word !== word)
    saveProgress(p)
    setVocab(p.vocabularyNotebook)
  }

  return (
    <div className="min-h-screen bg-[#06080f] pb-8">
      <div className="sticky top-0 z-10 px-4 py-4 flex items-center gap-3"
        style={{ background: 'rgba(6,8,15,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={onBack} className="p-2 rounded-xl glass-light text-slate-400 hover:text-slate-200 transition-all">
          <ArrowLeft size={19} />
        </button>
        <h1 className="text-white font-black text-lg flex-1">Vocabulary Notebook</h1>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-xl"
          style={{ background: 'rgba(26,92,58,0.15)', color: '#a5b4fc', border: '1px solid rgba(26,92,58,0.3)' }}>
          {vocab.length} words
        </span>
      </div>

      <div className="px-4 py-5 space-y-4">
        <div className="relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search words..."
            className="w-full text-white placeholder-slate-600 rounded-2xl pl-10 pr-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a]/50"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }} />
        </div>

        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((entry, i) => (
              <div key={i} className="rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-bold text-base" style={{ color: '#a5b4fc' }}>{entry.word}</p>
                    <p className="text-slate-300 text-sm mt-1 leading-relaxed">{entry.meaning}</p>
                    {entry.example && (
                      <p className="text-slate-500 text-xs mt-2 italic leading-relaxed">"{entry.example}"</p>
                    )}
                    <p className="text-slate-700 text-xs mt-2">
                      {new Date(entry.learnedOn).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <button onClick={() => removeWord(entry.word)}
                    className="p-2 rounded-xl text-slate-700 hover:text-red-400 hover:bg-red-400/10 transition-all flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl p-12 text-center"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <BookOpen size={40} className="text-slate-700 mx-auto mb-4" />
            {vocab.length === 0 ? (
              <>
                <p className="text-white font-bold text-lg">Empty notebook</p>
                <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                  New vocabulary is automatically saved during your conversations
                </p>
              </>
            ) : (
              <p className="text-slate-500">No words match your search</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
