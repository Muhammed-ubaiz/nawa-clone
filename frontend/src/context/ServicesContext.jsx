import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { servicesApi } from '../services/api'
import { fallbackServices } from '../data/services'

const ServicesContext = createContext({ services: fallbackServices, loading: false, fromApi: false, refresh: () => {} })

/**
 * Published services power the navigation, footer, home page and booking form.
 * They come from the API; the bundled list is used only if the API is unreachable,
 * so the navigation never renders empty.
 */
export function ServicesProvider({ children }) {
  const [services, setServices] = useState(fallbackServices)
  const [loading, setLoading] = useState(true)
  const [fromApi, setFromApi] = useState(false)

  const refresh = useCallback(() => {
    setLoading(true)
    return servicesApi
      .list()
      .then(({ data }) => {
        setServices(data)
        setFromApi(true)
      })
      .catch(() => setFromApi(false))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = useMemo(() => ({ services, loading, fromApi, refresh }), [services, loading, fromApi, refresh])
  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useServices = () => useContext(ServicesContext)
