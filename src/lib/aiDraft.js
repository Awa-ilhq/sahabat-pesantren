const CATEGORY_PATTERNS = [
  {
    value: 'masalah_pengurus',
    pattern: /(pengurus|ustaz|ustadz|pembina|pengasuh)/i,
  },
  {
    value: 'kekerasan_fisik',
    pattern: /(pukul|tendang|dorong|sentuh|fisik|memukul|menendang)/i,
  },
  {
    value: 'perundungan',
    pattern: /(ejek|hina|kucil|bully|perundungan|ganggu|tertawa)/i,
  },
  {
    value: 'kekerasan_verbal',
    pattern: /(bentak|ancam|makian|maki|teriak|kata kasar)/i,
  },
  {
    value: 'masalah_pribadi',
    pattern: /(sedih|cemas|takut|kesepian|rindu|tidur|stres|stress|beban)/i,
  },
]

export const categoryForStory = (text) => {
  const value = String(text ?? '')
  return (
    CATEGORY_PATTERNS.find((item) => item.pattern.test(value))?.value ??
    'lainnya'
  )
}

export const draftFromAiMessages = (messages = []) => {
  const stories = messages
    .filter((item) => item.role === 'user' && item.body?.trim())
    .map((item) => item.body.trim())
  const isi = stories.length
    ? `Aku ingin melaporkan hal ini.\n\n${stories.join('\n\n')}`
    : ''
  return {
    kategori: categoryForStory(stories.join(' ')),
    isi,
    tampilkanIdentitas: false,
  }
}
