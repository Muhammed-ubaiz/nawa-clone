export const site = {
  name: 'Nawa Ayurveda',
  /** The single official logo asset used everywhere (full lockup, never cropped or recoloured). */
  logo: {
    src: '/assets/nawa-ayurveda-logo.webp',
    alt: 'Nawa Ayurvedic Medical Centre',
    width: 640,
    height: 366,
  },
  legalName: 'Nawa Ayurvedic Medical Center',
  phone: '+971 54 498 1000',
  phoneHref: 'tel:+971544981000',
  // WhatsApp on the clinic's mobile number (opens the WhatsApp app / web directly)
  whatsappHref: 'https://wa.me/971544981000',
  // Placeholder like the other social links below — replace with the clinic's real profile
  linkedinHref: 'https://www.linkedin.com/',
  reception: '+971 2 622 0756',
  receptionHref: 'tel:+97126220756',
  email: 'info@nawaayurveda.ae',
  hours: 'Mon–Sun: 08:00 AM – 10:00 PM',
  hoursShort: '08:00 AM – 10:00 PM',
  addressLines: [
    'First Floor, Room 103, Dhabi Tower',
    'Opp. Al Mariya Mall, Hamdan Bin Mohammed St',
    'Al Danah Zone 1, Abu Dhabi',
  ],
  mapEmbed:
    'https://www.google.com/maps?q=Dhabi+Tower+Hamdan+Bin+Mohammed+St+Abu+Dhabi&output=embed',
  mapLink: 'https://www.google.com/maps/search/?api=1&query=Dhabi+Tower+Hamdan+Bin+Mohammed+St+Abu+Dhabi',
  social: [
    { name: 'Instagram', href: 'https://www.instagram.com/' },
    { name: 'Facebook', href: 'https://www.facebook.com/' },
    { name: 'YouTube', href: 'https://www.youtube.com/' },
  ],
}

export const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Services', to: '/services', dropdown: true },
  { label: 'Programs', to: '/programs' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contact us', to: '/contact' },
]
