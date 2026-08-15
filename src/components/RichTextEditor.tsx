import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TipTapLink from '@tiptap/extension-link'
import TipTapImage from '@tiptap/extension-image'
import CharacterCount from '@tiptap/extension-character-count'

export type RichTextEditorProps = {
 content?: string
 onChange?: (html: string) => void
 placeholder?: string
 className?: string
}

export function RichTextEditor({ content = '', onChange, placeholder = 'Start writing…', className = '' }: RichTextEditorProps) {
 const editor = useEditor({
 extensions: [
 StarterKit,
 Placeholder.configure({ placeholder }),
 TipTapLink.configure({ openOnClick: false }),
 TipTapImage,
 CharacterCount,
 ],
 content,
 onUpdate({ editor }) {
 onChange?.(editor.getHTML())
 },
 })

 const charCount = editor?.storage?.characterCount?.characters?.() ?? 0
 const wordCount = editor?.storage?.characterCount?.words?.() ?? 0

 if (!editor) return null

 return (
 <div className={`flex flex-col ${className}`}>
 <EditorToolbar editor={editor} />
 <div className="border border-t-0 border-border rounded-b-lg bg-background min-h-[320px] overflow-auto">
 <EditorContent
 editor={editor}
 className="tiptap-editor prose prose-invert prose-sm max-w-none px-4 py-3 min-h-[320px] focus-within:ring-1 focus-within:ring-focus-ring rounded-b-lg text-foreground"
 />
 </div>
 <div className="flex justify-end gap-4 mt-1 text-xs text-primary">
 <span>{wordCount} word{wordCount !== 1 ? 's' : ''}</span>
 <span>{charCount} character{charCount !== 1 ? 's' : ''}</span>
 </div>
 </div>
 )
}

type EditorToolbarProps = {
 editor: ReturnType<typeof useEditor>
}

function EditorToolbar({ editor }: EditorToolbarProps) {
 if (!editor) return null

 const btn = (active: boolean, onClick: () => void, label: string, title: string) => (
 <button
 key={label}
 type="button"
 title={title}
 onClick={onClick}
 className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
 active
 ? 'bg-background text-foreground'
 : 'text-muted-foreground hover:bg-background hover:text-foreground'
 }`}
 >
 {label}
 </button>
 )

 const divider = <div className="w-px h-5 bg-background mx-1 self-center" />

 return (
 <div className="flex flex-wrap items-center gap-1 px-3 py-2 bg-secondary border border-border rounded-t-lg">
 {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'B', 'Bold')}
 {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'I', 'Italic')}
 {btn(editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run(), 'S̶', 'Strikethrough')}
 {btn(editor.isActive('code'), () => editor.chain().focus().toggleCode().run(), '<>', 'Inline Code')}
 {divider}
 {btn(editor.isActive('heading', { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), 'H1', 'Heading 1')}
 {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2', 'Heading 2')}
 {btn(editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'H3', 'Heading 3')}
 {divider}
 {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), '• List', 'Bullet List')}
 {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), '1. List', 'Ordered List')}
 {btn(editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), '❝', 'Blockquote')}
 {btn(editor.isActive('codeBlock'), () => editor.chain().focus().toggleCodeBlock().run(), '{ }', 'Code Block')}
 {divider}
 {btn(false, () => editor.chain().focus().setHorizontalRule().run(), '—', 'Horizontal Rule')}
 {btn(false, () => editor.chain().focus().undo().run(), '↩', 'Undo')}
 {btn(false, () => editor.chain().focus().redo().run(), '↪', 'Redo')}
 </div>
 )
}
