import { useNoIndex, useSEO } from '../hooks/useSEO'
import Button from '../components/common/Button'

export default function NotFound() {
  useSEO({ title: 'Page not found', description: 'The page you are looking for could not be found.' })
  useNoIndex()
  return (
    <section className="grid min-h-[75vh] place-items-center bg-muted px-4 pb-16 pt-32 text-center">
      <div className="animate-fade-up">
        <p className="font-serif text-[104px] leading-none text-primary md:text-[151px]">404</p>
        <h1 className="mt-4 font-serif text-[35px] md:text-[48px]">This page has drifted away</h1>
        <p className="mx-auto mt-4 max-w-md text-text-soft">The page you are looking for may have moved. Let us guide you back.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button to="/">Back to Home</Button>
          <Button to="/services" variant="outline">Our Services</Button>
        </div>
      </div>
    </section>
  )
}
