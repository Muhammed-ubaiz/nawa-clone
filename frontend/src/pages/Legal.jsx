import { site } from '../data/site'
import { useSEO } from '../hooks/useSEO'
import PageHero from '../components/common/PageHero'

export default function Legal() {
  useSEO({ title: 'Privacy Policy', description: `How ${site.legalName} collects, uses and protects your information.` })
  return (
    <>
      <PageHero title="Privacy Policy" crumbs={[{ label: 'Privacy Policy' }]} />
      <section className="section-y">
        <div className="container-x prose-nawa max-w-3xl text-[16px]">
          <p>
            {site.legalName} respects your privacy. This page explains what information we collect when you use this website
            and how we use it.
          </p>
          <h2>Information we collect</h2>
          <p>When you submit an appointment request, contact form or newsletter sign-up, we receive the details you provide, such as your name, phone number, email address and message.</p>
          <h2>How we use it</h2>
          <ul>
            <li>To respond to your enquiry and confirm appointments</li>
            <li>To send wellness updates if you have subscribed</li>
            <li>To improve our services and website</li>
          </ul>
          <h2>Your choices</h2>
          <p>
            You may ask us to update or delete your information at any time by emailing{' '}
            <a href={`mailto:${site.email}`} className="text-primary underline">{site.email}</a>.
          </p>
        </div>
      </section>
    </>
  )
}
