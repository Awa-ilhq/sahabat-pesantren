export const aiKeys = {
  all: () => ['ai'],
  conversation: (id) => ['ai', 'conversation', id == null ? id : String(id)],
}
