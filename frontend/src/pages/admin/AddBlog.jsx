import { useNavigate } from 'react-router-dom'
import { blogsApi } from '../../services/api'
import { useSEO } from '../../hooks/useSEO'
import { toast, withLoading } from '../../utils/alerts'
import BlogForm from '../../components/admin/BlogForm'
import { PageHeader } from '../../components/admin/ui'

export default function AddBlog() {
  useSEO({ title: 'New Article', description: 'Create a blog article' })
  const navigate = useNavigate()

  const create = async (payload) => {
    try {
      await withLoading(() => blogsApi.create(payload), { title: payload.published ? 'Publishing article…' : 'Saving draft…' })
      toast.success(payload.published ? 'Article published' : 'Draft saved')
      navigate('/admin/blogs')
    } catch (err) {
      toast.error(err.message)
      throw err
    }
  }

  return (
    <>
      <PageHeader title="New Article" description="Write and publish a new article for the Wellness Wisdom blog." />
      <BlogForm onSubmit={create} submitLabel="Create Article" />
    </>
  )
}
