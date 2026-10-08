import { useNavigate, useParams } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { blogsApi } from '../../services/api'
import { useApi } from '../../hooks/useApi'
import { useSEO } from '../../hooks/useSEO'
import { toast, withLoading } from '../../utils/alerts'
import BlogForm from '../../components/admin/BlogForm'
import { LoadingBlock, PageHeader } from '../../components/admin/ui'
import { ErrorState } from '../../components/common/StatusMessage'

export default function EditBlog() {
  useSEO({ title: 'Edit Article', description: 'Edit a blog article' })
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading, error, reload } = useApi(() => blogsApi.getById(id).then((r) => r.data), [id])

  const save = async (payload) => {
    try {
      await withLoading(() => blogsApi.update(id, payload), { title: 'Saving changes…' })
      toast.success('Article updated')
      navigate('/admin/blogs')
    } catch (err) {
      toast.error(err.message)
      throw err
    }
  }

  if (loading) return <LoadingBlock label="Loading article" />
  if (error) return <ErrorState message={error.message} onRetry={error.status === 404 ? undefined : reload} />

  return (
    <>
      <PageHeader
        title="Edit Article"
        description={data.title}
        actions={
          data.published && (
            <a
              href={`/blog/${data.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-5 py-3 text-[14px] font-semibold leading-none transition hover:bg-muted"
            >
              View live <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          )
        }
      />
      <BlogForm
        key={data._id}
        isEdit
        initial={{
          title: data.title,
          slug: data.slug,
          category: data.category || '',
          excerpt: data.excerpt || '',
          content: data.content,
          author: data.author || '',
          published: data.published,
          featuredImage: data.featuredImage || '',
        }}
        onSubmit={save}
        submitLabel="Save Changes"
      />
    </>
  )
}
