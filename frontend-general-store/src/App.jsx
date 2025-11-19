import { useEffect, useMemo, useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const SESSION_TOKEN_KEY = 'general-store-session'
const SUPPORTED_CURRENCIES = ['USD', 'MXN', 'EUR', 'COP']
const COMPANY_NAME = 'Pixel Nostalgia'
const COMPANY_LOGO_PATH = '/branding/logo.png'
const ADMIN_LOGO_PATH = '/branding/admin-logo.png'

const BRAND_OPTIONS = [
  'Canon',
  'Nikon',
  'Sony',
  'Fujifilm',
  'Panasonic',
  'Olympus',
  'Pentax',
  'Kodak',
  'Samsung',
  'Casio',
  'Polaroid',
  'Vivitar',
]

const defaultOfferForm = {
  camera_title: '',
  brand: '',
  condition: 'Excelente',
  asking_price: '',
  preferred_currency: 'GTQ',
  notes: '',
  image_gallery: [],
}

const defaultCameraForm = {
  title: '',
  brand: '',
  description: '',
  condition: 'Excelente',
  price: '',
  currency: 'GTQ',
  image_path: '',
  image_gallery: [],
}

const conditionOptions = ['Nueva', 'Excelente', 'Buen estado', 'Uso rudo']

const guessCurrency = () => {
  if (typeof window === 'undefined') return 'USD'
  const language = navigator.language || 'es-MX'
  if (language.includes('MX')) return 'MXN'
  if (language.includes('ES')) return 'EUR'
  if (language.includes('CO')) return 'COP'
  return 'USD'
}

const formatMoney = (value, currency) => {
  try {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value)
  } catch (_error) {
    return `${Number(value).toFixed(2)} ${currency}`
  }
}

const apiFetch = async (path, { method = 'GET', body, token } = {}) => {
  const headers = {
    Accept: 'application/json',
  }
  let requestBody

  if (body instanceof FormData) {
    requestBody = body
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    requestBody = JSON.stringify(body)
  }

  if (token) {
    headers['X-Session-Token'] = token
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: requestBody,
  })

  const contentType = response.headers.get('content-type')
  const isJson = contentType && contentType.includes('application/json')
  const payload = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    let detail = 'Error inesperado'
    if (typeof payload === 'string') {
      detail = payload
    } else if (payload?.detail) {
      detail =
        typeof payload.detail === 'string'
          ? payload.detail
          : Array.isArray(payload.detail)
            ? payload.detail.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join(' | ')
            : JSON.stringify(payload.detail)
    }
    throw new Error(detail)
  }

  return payload
}

function App() {
  const [cameras, setCameras] = useState([])
  const [loadingCameras, setLoadingCameras] = useState(true)
  const [rates, setRates] = useState({})
  const [activeCurrency, setActiveCurrency] = useState(guessCurrency())
  const [sessionToken, setSessionToken] = useState(localStorage.getItem(SESSION_TOKEN_KEY) ?? '')
  const [currentUser, setCurrentUser] = useState(null)
  const [cartItems, setCartItems] = useState([])
  const [myOffers, setMyOffers] = useState([])
  const [adminOffers, setAdminOffers] = useState([])
  const [activeCamera, setActiveCamera] = useState(null)
  const [galleryIndex, setGalleryIndex] = useState({})
  const [offerFiles, setOfferFiles] = useState([])
  const [offerBrandSelect, setOfferBrandSelect] = useState('')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [offerForm, setOfferForm] = useState(defaultOfferForm)
  const [cameraForm, setCameraForm] = useState(defaultCameraForm)
  const [status, setStatus] = useState({ type: 'idle', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [logoReady, setLogoReady] = useState(true)
  const [activeView, setActiveView] = useState('home')
  const [brokenImages, setBrokenImages] = useState({})
  const [showCameraForm, setShowCameraForm] = useState(false)
  const [cameraFiles, setCameraFiles] = useState([])
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0)
  const [editingCameraId, setEditingCameraId] = useState(null)
  const [brandSelect, setBrandSelect] = useState('')

  const logoPlaceholderText = `${COMPANY_NAME}: coloca tu logo en frontend-general-store/public/branding/logo.png`

  const showStatus = (type, message) => {
    setStatus({ type, message })
    if (message) {
      setTimeout(() => {
        setStatus((prev) => (prev.message === message ? { type: 'idle', message: '' } : prev))
      }, 5000)
    }
  }

  const goHome = () => {
    const scrollTop = () => {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
    if (activeView !== 'home') {
      setActiveView('home')
      setTimeout(scrollTop, 60)
    } else {
      scrollTop()
    }
  }

  const goToLoginView = () => {
    setActiveView('login')
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goToRegisterView = () => {
    setActiveView('register')
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goToAdminView = () => {
    if (!currentUser?.is_admin) {
      showStatus('error', 'Solo los administradores pueden abrir este panel.')
      return
    }
    setActiveView('admin')
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const scrollToSection = (sectionId) => {
    const scroll = () => {
      if (!sectionId) return
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    if (activeView !== 'home') {
      setActiveView('home')
      setTimeout(scroll, 60)
    } else {
      scroll()
    }
  }

  const getImageUrl = (path) => {
    if (!path) return null
    if (/^https?:\/\//i.test(path)) return path
    if (path.startsWith('/media/') || path.startsWith('/uploads/')) {
      const base = API_BASE_URL.replace(/\/$/, '')
      return `${base}${path}`
    }
    return `/${encodeURI(path)}`
  }

  const handleImageError = (cameraId) => {
    setBrokenImages((prev) => ({ ...prev, [cameraId]: true }))
  }

  const ensureRates = async (baseCurrency) => {
    if (!baseCurrency) return
    const normalized = baseCurrency.toUpperCase()
    if (rates[normalized]) return

    try {
      const symbols = SUPPORTED_CURRENCIES.filter((code) => code !== normalized).join(',')
      const data = await apiFetch(`/currency/rates?base=${normalized}&symbols=${symbols}`)
      const nextMap = data.quotes.reduce(
        (acc, quote) => ({
          ...acc,
          [quote.quote_currency]: quote.rate,
        }),
        {},
      )
      nextMap[normalized] = 1
      setRates((prev) => ({ ...prev, [normalized]: nextMap }))
    } catch (error) {
      console.warn('No se pudo obtener el tipo de cambio', error)
    }
  }

  const convertPrice = (price, fromCurrency, toCurrency) => {
    if (!price || !fromCurrency || !toCurrency || fromCurrency === toCurrency) {
      return Number(price)
    }
    const baseRates = rates[fromCurrency]
    if (!baseRates || !baseRates[toCurrency]) {
      return null
    }
    return Number(price) * baseRates[toCurrency]
  }

  const getCameraImages = (camera) => {
    const gallery = Array.from(new Set([...(camera.image_gallery ?? []), camera.image_path].filter(Boolean)))
    return gallery
  }

  const changeGalleryIndex = (cameraId, total, delta) => {
    if (!total) return
    setGalleryIndex((prev) => {
      const current = prev[cameraId] ?? 0
      const next = ((current + delta) % total + total) % total
      return { ...prev, [cameraId]: next }
    })
  }

  const fetchCameras = async () => {
    setLoadingCameras(true)
    try {
      const data = await apiFetch('/cameras')
      setCameras(data.items ?? [])
      const uniqueCurrencies = [...new Set((data.items ?? []).map((item) => item.currency))]
      await Promise.all(uniqueCurrencies.map((currency) => ensureRates(currency)))
    } catch (error) {
      showStatus('error', error.message)
    } finally {
      setLoadingCameras(false)
    }
  }

  const refreshAuthState = async (token) => {
    if (!token) return
    try {
      const user = await apiFetch('/auth/me', { token })
      setCurrentUser(user)
      setActiveCurrency(user.preferred_currency || guessCurrency())
      await Promise.all([fetchCart(token), fetchMyOffers(token), user.is_admin ? fetchAdminOffers(token) : Promise.resolve([])])
      setActiveView(user.is_admin ? 'admin' : 'home')
      showStatus('success', `Hola ${user.name}, tu sesión se mantiene por 14 días.`)
    } catch (error) {
      console.error(error)
      setSessionToken('')
      setCurrentUser(null)
      showStatus('error', 'Tu sesión expiró, vuelve a iniciar sesión.')
    }
  }

  const fetchCart = async (token = sessionToken) => {
    if (!token) return
    try {
      const data = await apiFetch('/cart', { token })
      setCartItems(data)
    } catch (error) {
      showStatus('error', error.message)
    }
  }

  const fetchMyOffers = async (token = sessionToken) => {
    if (!token) return
    try {
      const data = await apiFetch('/offers/me', { token })
      setMyOffers(data.items ?? [])
    } catch (error) {
      showStatus('error', error.message)
    }
  }

  const fetchAdminOffers = async (token = sessionToken) => {
    if (!token) return
    try {
      const data = await apiFetch('/offers/admin', { token })
      setAdminOffers(data.items ?? [])
    } catch (error) {
      showStatus('error', error.message)
    }
  }

  useEffect(() => {
    fetchCameras()
  }, [])

  useEffect(() => {
    if (activeView !== 'admin') {
      setShowCameraForm(false)
      setCameraFiles([])
      setPrimaryImageIndex(0)
      setEditingCameraId(null)
    }
  }, [activeView])

  useEffect(() => {
    if (sessionToken) {
      localStorage.setItem(SESSION_TOKEN_KEY, sessionToken)
      refreshAuthState(sessionToken)
    } else {
      localStorage.removeItem(SESSION_TOKEN_KEY)
      setCurrentUser(null)
      setCartItems([])
      setMyOffers([])
      setAdminOffers([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken])

  const handleRegister = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await apiFetch('/auth/register', { method: 'POST', body: registerForm })
      // auto login
      const data = await apiFetch('/auth/login', { method: 'POST', body: { email: registerForm.email, password: registerForm.password } })
      setSessionToken(data.token)
      setCurrentUser(data.user)
      showStatus('success', 'Registro exitoso, iniciamos tu sesión.')
      setRegisterForm({ name: '', email: '', password: '' })
      setActiveView(data.user.is_admin ? 'admin' : 'home')
    } catch (error) {
      showStatus('error', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      const data = await apiFetch('/auth/login', { method: 'POST', body: loginForm })
      setSessionToken(data.token)
      setCurrentUser(data.user)
      showStatus('success', 'Sesión iniciada, tu carrito se guardará por 2 semanas.')
      setActiveView(data.user.is_admin ? 'admin' : 'home')
      setShowCameraForm(false)
    } catch (error) {
      showStatus('error', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    if (!sessionToken) return
    try {
      await apiFetch('/auth/logout', { method: 'POST', token: sessionToken })
    } catch (error) {
      console.warn(error)
    } finally {
      setSessionToken('')
      setCurrentUser(null)
      setActiveView('home')
      showStatus('info', 'Sesión cerrada')
    }
  }

  const handleOfferSubmit = async (event) => {
    event.preventDefault()
    if (!currentUser) {
      showStatus('error', 'Necesitas iniciar sesión para ofrecer tu cámara.')
      return
    }
    if ((offerFiles.length ?? 0) < 3) {
      showStatus('error', 'Debes subir al menos 3 fotos')
      return
    }
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      offerFiles.forEach((file) => formData.append('files', file))
      const upload = await apiFetch('/media/upload', { method: 'POST', body: formData, token: sessionToken })
      const gallery = (upload.files ?? []).map((f) => f.path || f.url).filter(Boolean)
      if (gallery.length < 3) {
        throw new Error('Debes subir al menos 3 fotos válidas')
      }

      const payload = {
        ...offerForm,
        asking_price: Number(offerForm.asking_price),
        preferred_currency: 'GTQ',
        image_gallery: gallery,
      }
      await apiFetch('/offers', { method: 'POST', body: payload, token: sessionToken })
      setOfferForm(defaultOfferForm)
      setOfferFiles([])
      setOfferBrandSelect('')
      fetchMyOffers()
      showStatus('success', 'Tu oferta fue enviada, la verás en la tabla de seguimiento.')
    } catch (error) {
      showStatus('error', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCameraSubmit = async (event) => {
    event.preventDefault()
    const priceValue = Number(cameraForm.price)
    if (!priceValue || Number.isNaN(priceValue) || priceValue <= 0) {
      showStatus('error', 'Ingresa un precio mayor a 0')
      return
    }
    setIsSubmitting(true)
    try {
      let imagePath = cameraForm.image_path || null
      let gallery = []

      if (cameraFiles.length > 0) {
        const formData = new FormData()
        cameraFiles.forEach((file) => {
          formData.append('files', file)
        })
        const uploadResult = await apiFetch('/media/upload', {
          method: 'POST',
          body: formData,
          token: sessionToken,
        })
        const files = uploadResult.files ?? []
        if (!files.length) {
          throw new Error('No se pudieron subir las imágenes')
        }
        gallery = files.map((f) => f.path || f.url).filter(Boolean)
        const primary = files[primaryImageIndex] ?? files[0]
        imagePath = primary?.path || primary?.url || imagePath
      }

      const payload = {
        ...cameraForm,
        price: priceValue,
        image_path: imagePath,
        image_gallery: gallery.length ? gallery : cameraForm.image_gallery,
        currency: 'GTQ',
      }
      if (editingCameraId) {
        await apiFetch(`/cameras/${editingCameraId}`, { method: 'PATCH', body: payload, token: sessionToken })
        showStatus('success', 'Cámara actualizada.')
      } else {
        await apiFetch('/cameras', { method: 'POST', body: payload, token: sessionToken })
        showStatus('success', 'Cámara publicada y visible para todos los usuarios.')
      }
      setCameraForm(defaultCameraForm)
      setBrandSelect('')
      setGalleryIndex({})
      setCameraFiles([])
      setPrimaryImageIndex(0)
      setEditingCameraId(null)
      setShowCameraForm(false)
      fetchCameras()
    } catch (error) {
      showStatus('error', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCameraDelete = async (cameraId) => {
    const confirmed = window.confirm('¿Eliminar esta cámara? Esta acción no se puede deshacer.')
    if (!confirmed) return
    try {
      await apiFetch(`/cameras/${cameraId}`, { method: 'DELETE', token: sessionToken })
      fetchCameras()
      showStatus('info', 'Cámara eliminada')
      if (editingCameraId === cameraId) {
        setEditingCameraId(null)
        setCameraForm(defaultCameraForm)
        setCameraFiles([])
        setPrimaryImageIndex(0)
      }
      if (activeCamera?.id === cameraId) {
        setActiveCamera(null)
      }
    } catch (error) {
      showStatus('error', error.message)
    }
  }

  const startEditingCamera = (camera) => {
    setEditingCameraId(camera.id)
    setCameraForm({
      title: camera.title,
      brand: camera.brand,
      description: camera.description,
      condition: camera.condition,
      price: camera.price,
      currency: camera.currency || 'GTQ',
      image_path: camera.image_path ?? '',
      image_gallery: camera.image_gallery ?? [],
    })
    setBrandSelect(BRAND_OPTIONS.includes(camera.brand) ? camera.brand : camera.brand ? 'custom' : '')
    setCameraFiles([])
    setPrimaryImageIndex(0)
    setShowCameraForm(true)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleCameraStatus = async (cameraId, updates) => {
    try {
      await apiFetch(`/cameras/${cameraId}`, { method: 'PATCH', body: updates, token: sessionToken })
      fetchCameras()
      showStatus('success', 'Actualizaste el estado de la cámara.')
    } catch (error) {
      showStatus('error', error.message)
    }
  }

  const handleOfferDecision = async (offerId, action, counter_amount) => {
    try {
      await apiFetch(`/offers/${offerId}/decision`, {
        method: 'POST',
        body: { action, counter_amount },
        token: sessionToken,
      })
      fetchAdminOffers()
      fetchMyOffers()
      showStatus('success', 'Oferta actualizada')
    } catch (error) {
      showStatus('error', error.message)
    }
  }

  const handleAddToCart = async (cameraId) => {
    if (!currentUser) {
      showStatus('error', 'Regístrate o inicia sesión para guardar en el carrito')
      return
    }
    try {
      await apiFetch('/cart', { method: 'POST', body: { camera_id: cameraId }, token: sessionToken })
      fetchCart()
      showStatus('success', 'Agregada a tu carrito personalizado')
    } catch (error) {
      showStatus('error', error.message)
    }
  }

  const handleRemoveFromCart = async (cameraId) => {
    try {
      await apiFetch(`/cart/${cameraId}`, { method: 'DELETE', token: sessionToken })
      fetchCart()
      showStatus('info', 'Cámara eliminada del carrito')
    } catch (error) {
      showStatus('error', error.message)
    }
  }

  const handleBuyNow = async (cameraId) => {
    try {
      if (!currentUser) {
        showStatus('error', 'Inicia sesión para comprar')
        return
      }
      await apiFetch('/cart', { method: 'POST', body: { camera_id: cameraId }, token: sessionToken })
      await handleCheckout()
      setActiveCamera(null)
    } catch (error) {
      showStatus('error', error.message)
    }
  }

  const handleCheckout = async () => {
    try {
      await apiFetch('/cart/checkout', { method: 'POST', token: sessionToken })
      await Promise.all([fetchCart(), fetchCameras()])
      showStatus('success', 'Compra registrada, las cámaras se marcaron como vendidas')
    } catch (error) {
      showStatus('error', error.message)
    }
  }

  const convertedTotals = useMemo(() => {
    return cartItems.reduce(
      (acc, item) => {
        const converted = convertPrice(item.camera.price, item.camera.currency, 'GTQ')
        return acc + (converted ?? 0)
      },
      0,
    )
  }, [cartItems, rates])

  const renderPrice = (camera) => {
    const converted = convertPrice(camera.price, camera.currency, activeCurrency)
    return (
      <div className="camera-card__price">
        <span className="camera-card__price-base">{formatMoney(camera.price, camera.currency)}</span>
        {converted !== null && camera.currency !== activeCurrency ? (
          <span className="camera-card__price-converted">
            {formatMoney(converted, activeCurrency)}
          </span>
        ) : null}
      </div>
    )
  }

  const sessionBanner = status.message ? (
    <div className={`status-banner status-${status.type}`}>{status.message}</div>
  ) : null

  return (
    <div className="app-shell">
      <nav className="top-nav">
        <button type="button" className="top-nav__brand" onClick={goHome}>
          {COMPANY_NAME}
        </button>
        <div className="top-nav__links">
          <button type="button" onClick={() => scrollToSection('drop')}>
            Tienda
          </button>
          <button type="button" onClick={() => scrollToSection('offer-section')}>
            Quiero vender
          </button>
          <button type="button" onClick={() => scrollToSection('contact')}>
            Sobre nosotros
          </button>
          <button type="button" onClick={() => scrollToSection('contact')}>
            Contacto
          </button>
        </div>
        <div className="top-nav__actions">
          {currentUser ? (
            <>
              <span className="top-nav__welcome">Hola, {currentUser.name}</span>
              {currentUser.is_admin && activeView !== 'admin' ? (
                <button type="button" className="btn ghost" onClick={() => setActiveView('admin')}>
                  Panel admin
                </button>
              ) : null}
              <button type="button" className="btn ghost" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn secondary" onClick={goToLoginView}>
                Login
              </button>
            </>
          )}
        </div>
      </nav>

      {sessionBanner}

      {activeView === 'home' ? (
        <>
          <header className="hero">
            <div className="hero__logo-slot">
              {logoReady ? (
                <img
                  src={COMPANY_LOGO_PATH}
                  alt={`${COMPANY_NAME} logo`}
                  className="hero__logo"
                  onError={() => setLogoReady(false)}
                />
              ) : (
                <span>{logoPlaceholderText}</span>
              )}
            </div>
            <div className="hero__copy">
              <p className="eyebrow">Colección</p>
              <h1>{COMPANY_NAME}</h1>
              <p>Explora las cámaras de Pixel Nostalgia. Cada pieza es única; agrégala a tu lista de favoritos.</p>
              <div className="hero__actions">
                <button className="btn primary" onClick={() => scrollToSection('drop')}>
                  Explorar cámaras
                </button>
                <button className="btn secondary" onClick={() => scrollToSection('offer-section')}>
                  Quiero vender
                </button>
              </div>
            </div>
          </header>

          <section className="section" id="drop">
            <header className="section__header">
              <div>
                <p className="eyebrow">Colección</p>
                <h2>Cámaras destacadas</h2>
              </div>
            </header>

            {loadingCameras ? (
              <p className="helper">Cargando cámaras...</p>
            ) : (
              <div className="camera-grid">
            {cameras.length === 0 ? (
              <p className="helper">Aún no has publicado cámaras. Desde el panel de administrador puedes subir la primera pieza.</p>
            ) : (
              cameras.map((camera) => {
                const images = getCameraImages(camera)
                const totalImages = images.length
                const idx = galleryIndex[camera.id] ?? 0
                const currentImagePath = totalImages ? images[((idx % totalImages) + totalImages) % totalImages] : camera.image_path
                const imageUrl = getImageUrl(currentImagePath)
                const showImage = imageUrl && !brokenImages[camera.id]
                return (
                  <article
                    key={camera.id}
                    className={`camera-card status-${camera.status}`}
                    onClick={() => setActiveCamera(camera)}
                  >
                    <div className={`camera-card__media ${showImage ? 'has-image' : ''}`} aria-label={`Imagen de ${camera.title}`}>
                      {showImage ? (
                        <img
                          src={imageUrl}
                          alt={`Foto de ${camera.title}`}
                          onError={() => handleImageError(camera.id)}
                        />
                      ) : (
                        <span>Imagen pendiente en Drop #1</span>
                      )}
                      {totalImages > 1 ? (
                        <div className="media-nav">
                          <button
                            type="button"
                            className="media-nav__btn"
                            onClick={(event) => {
                              event.stopPropagation()
                              changeGalleryIndex(camera.id, totalImages, -1)
                            }}
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            className="media-nav__btn"
                            onClick={(event) => {
                              event.stopPropagation()
                              changeGalleryIndex(camera.id, totalImages, 1)
                            }}
                          >
                            ›
                          </button>
                        </div>
                      ) : null}
                    </div>
                        <div className="camera-card__body">
                          <header>
                            <p className="camera-card__brand">{camera.brand}</p>
                            <h3>{camera.title}</h3>
                          </header>
                          {renderPrice(camera)}
                          {camera.status === 'sold' ? <small className="badge badge-sold">Vendida</small> : null}
                        </div>
                      </article>
                    )
                  })
                )}
              </div>
            )}
          </section>

          <section className="section" id="offer-section">
        <header className="section__header">
          <div>
            <p className="eyebrow">Ofrece tu cámara</p>
            <h2>Comparte tu inventario con nosotros</h2>
            <p>Manda tus datos y negocia desde el panel. Recibirás estatus y contrapropuestas en tiempo real.</p>
          </div>
        </header>
        <div className="offer-grid">
          <form className="card" onSubmit={handleOfferSubmit}>
            <div className="field-row">
              <label htmlFor="offer-title">Nombre de la cámara</label>
              <input
                id="offer-title"
                type="text"
                value={offerForm.camera_title}
                onChange={(event) => setOfferForm({ ...offerForm, camera_title: event.target.value })}
                required
              />
            </div>
                      <div className="field-row">
                        <label htmlFor="offer-brand">
                          Marca <span className="required-star">*</span>
                        </label>
                        <select
                          id="offer-brand"
                          className="brand-select"
                          value={offerBrandSelect}
                          onChange={(event) => {
                            const value = event.target.value
                            if (value === 'custom') {
                              setOfferBrandSelect('custom')
                              setOfferForm({ ...offerForm, brand: '' })
                            } else {
                              setOfferBrandSelect(value)
                              setOfferForm({ ...offerForm, brand: value })
                            }
                          }}
                          required
                        >
                          <option value="" disabled>
                            Selecciona marca
                          </option>
                          {BRAND_OPTIONS.map((brand) => (
                            <option key={brand} value={brand}>
                              {brand}
                            </option>
                          ))}
                          <option value="custom">Otra (especificar)</option>
                        </select>
                        {offerBrandSelect === 'custom' ? (
                          <input
                            type="text"
                            placeholder="Escribe la marca"
                            value={offerForm.brand}
                            onChange={(event) => setOfferForm({ ...offerForm, brand: event.target.value })}
                            required
                            style={{ marginTop: '0.5rem' }}
                          />
                        ) : null}
                      </div>
            <div className="field-row">
              <label htmlFor="offer-condition">Condición</label>
              <select
                id="offer-condition"
                value={offerForm.condition}
                onChange={(event) => setOfferForm({ ...offerForm, condition: event.target.value })}
              >
                {conditionOptions.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>
            </div>
                      <div className="field-row inline">
                        <div>
                          <label htmlFor="offer-price">
                            Precio deseado <span className="required-star">*</span>
                          </label>
                          <input
                            id="offer-price"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={offerForm.asking_price}
                            onChange={(event) => setOfferForm({ ...offerForm, asking_price: event.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label>Divisa</label>
                          <div className="pill">GTQ</div>
                        </div>
                      </div>
                      <div className="field-row">
                        <label htmlFor="offer-notes">
                          Notas <span className="required-star">*</span>
                        </label>
                        <textarea
                          id="offer-notes"
                          value={offerForm.notes}
                          onChange={(event) => setOfferForm({ ...offerForm, notes: event.target.value })}
                          rows={3}
                          required
                        ></textarea>
                      </div>
                      <div className="field-row">
                        <label htmlFor="offer-files">
                          Arrastra o sube al menos 3 fotos de la cámara <span className="required-star">*</span>
                        </label>
                        <label className="file-drop" htmlFor="offer-files">
                          <span>Arrastra aquí o haz clic para subir</span>
                          <small>Sube mínimo 3 fotos para evaluar el estado</small>
                        </label>
                        <input
                          className="visually-hidden"
                          id="offer-files"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(event) => {
                            const files = Array.from(event.target.files || [])
                            setOfferFiles(files)
                          }}
                        />
                        {offerFiles.length > 0 ? (
                          <p className="helper">{offerFiles.length} archivos listos</p>
                        ) : null}
                      </div>
            <button className="btn primary" type="submit" disabled={isSubmitting}>
              Enviar oferta
            </button>
            {!currentUser ? <p className="helper">Debes iniciar sesión para enviar la oferta.</p> : null}
          </form>

              <div className="card">
                <h3>Seguimiento de mis ofertas</h3>
                {myOffers.length === 0 ? (
                  <p className="helper">Aquí verás tus propuestas enviadas.</p>) : (
                  <ul className="offer-list">
                    {myOffers.map((offer) => (
                      <li key={offer.id} className="offer-card">
                        <div className="offer-card__meta">
                          <p className="eyebrow">Mi oferta</p>
                          <strong>{offer.camera_title}</strong>
                          <span className="offer-price">{formatMoney(offer.asking_price_cents / 100, 'GTQ')}</span>
                          {offer.counter_offer_cents ? (
                            <div className="counter-chip">
                              Contrapropuesta: {formatMoney(offer.counter_offer_cents / 100, 'GTQ')}
                            </div>
                          ) : null}
                        </div>
                    <div className="offer-card__actions">
                      <span className={`status-chip status-${offer.status}`}>
                        {offer.status === 'countered'
                          ? 'Contrapropuesta recibida'
                          : offer.status === 'accepted'
                            ? 'Aceptado'
                            : offer.status === 'declined'
                              ? 'Declinado'
                              : offer.status}
                      </span>
                          {offer.counter_offer_cents ? (
                            <div className="action-buttons">
                              <button className="btn primary" onClick={() => handleOfferDecision(offer.id, 'accepted')}>
                                Aceptar
                              </button>
                              <button
                                className="btn alt"
                                onClick={() => {
                                  const counter = window.prompt('Monto de contrapropuesta (GTQ)', '0')
                                  if (counter) {
                                    handleOfferDecision(offer.id, 'countered', Number(counter))
                                  }
                                }}
                              >
                                Contraoferta
                              </button>
                              <button className="btn danger" onClick={() => handleOfferDecision(offer.id, 'declined')}>
                                Denegar
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
        </div>
      </section>

      {currentUser ? (
        <section className="section" id="cart">
          <div className="container">
            <div className="card">
              <header className="section__header">
                <div>
                  <p className="eyebrow">Carrito personal</p>
                  <h2>Cámaras guardadas</h2>
                </div>
                <div className="cart-actions">
                  <p className="cart-total">
                    Total:{' '}
                    {formatMoney(convertedTotals || 0, 'GTQ')}
                  </p>
                  <button className="btn primary" onClick={handleCheckout} disabled={cartItems.length === 0}>
                    Comprar carrito
                  </button>
                </div>
              </header>
              {cartItems.length === 0 ? (
                <p className="helper">Agrega cámaras únicas desde la cuadrícula superior.</p>
              ) : (
                <ul className="cart-list">
                  {cartItems.map((item) => (
                    <li key={item.id}>
                      <div className="cart-item">
                        {(() => {
                          const images = getCameraImages(item.camera)
                          const first = images[0]
                          const thumb = getImageUrl(first)
                          return thumb ? <img className="cart-thumb" src={thumb} alt={item.camera.title} /> : null
                        })()}
                        <strong>{item.camera.title}</strong>
                        <span>{formatMoney(item.camera.price, item.camera.currency)}</span>
                      </div>
                      <button className="btn ghost" onClick={() => handleRemoveFromCart(item.camera.id)}>
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      ) : null}

          <section className="section" id="contact">
            <div className="container">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="card h-100">
                    <header className="section__header">
                      <div>
                        <p className="eyebrow">Sobre nosotros</p>
                        <h2>Pixel Nostalgia</h2>
                        <p>Somos un espacio para coleccionistas y creadores que quieren dar nueva vida a cámaras especiales.</p>
                      </div>
                    </header>
                    <p className="helper">
                      Curamos cada drop con cariño. Si tienes dudas o quieres colaborar, escríbenos en la sección de contacto.
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card h-100">
                    <header className="section__header">
                      <div>
                        <p className="eyebrow">Contacto</p>
                        <h2>Hablemos</h2>
                        <p>Puedes escribirnos para preguntas, colaboraciones o soporte.</p>
                      </div>
                    </header>
                    <div className="contact-grid">
                      <div>
                        <p>Email:</p>
                        <a href="mailto:pixelnostalgia28@gmail.com">pixelnostalgia28@gmail.com</a>
                      </div>
                      <div>
                        <p>Instagram:</p>
                        <a href="https://instagram.com/pixelnostalgia28" target="_blank" rel="noreferrer">@pixelnostalgia28</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </>
      ) : activeView === 'login' ? (
        <section className="auth-page auth-simple" id="login">
          <form className="card auth-card" onSubmit={handleLogin}>
            <h2>Inicia sesión</h2>
            <div className="field-row">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                value={loginForm.email}
                onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                required
              />
            </div>
            <div className="field-row">
              <label htmlFor="login-password">Contraseña</label>
              <input
                id="login-password"
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                required
              />
            </div>
            <button className="btn secondary" type="submit" disabled={isSubmitting}>
              Iniciar sesión
            </button>
            <p className="helper">
              ¿No tienes cuenta?
              {' '}
              <button className="inline-link" type="button" onClick={goToRegisterView}>
                Regístrate
              </button>
            </p>
          </form>
        </section>
      ) : activeView === 'register' ? (
        <section className="auth-page auth-simple" id="register">
          <form className="card auth-card" onSubmit={handleRegister}>
            <h2>Crear cuenta</h2>
            <div className="field-row">
              <label htmlFor="register-name">Nombre</label>
              <input
                id="register-name"
                type="text"
                value={registerForm.name}
                onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })}
                required
              />
            </div>
            <div className="field-row">
              <label htmlFor="register-email">Email</label>
              <input
                id="register-email"
                type="email"
                value={registerForm.email}
                onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                required
              />
            </div>
            <div className="field-row">
              <label htmlFor="register-password">Contraseña</label>
              <input
                id="register-password"
                type="password"
                value={registerForm.password}
                onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
                required
                minLength={8}
              />
            </div>
            <button className="btn primary" type="submit" disabled={isSubmitting}>
              Registrarme
            </button>
            <p className="helper">
              ¿Ya tienes cuenta?
              {' '}
              <button className="inline-link" type="button" onClick={goToLoginView}>
                Ir a login
              </button>
            </p>
          </form>
        </section>
      ) : (
        <section className="admin-page" id="admin">
          {currentUser?.is_admin ? (
            <div className="admin-layout">
              <header className="admin-header-bar">
                <div className="admin-brand">
                  <img
                    src={ADMIN_LOGO_PATH}
                    alt={`${COMPANY_NAME} admin logo`}
                    onError={(event) => {
                      event.currentTarget.src = COMPANY_LOGO_PATH
                    }}
                  />
                </div>
                <p className="eyebrow admin-tag">Administración</p>
              </header>

              <div className="admin-section">
                <div className="admin-section__heading">
                  <div>
                    <p className="eyebrow">Inventario</p>
                    <h3>Subir y editar cámaras</h3>
                  </div>
                  <button className="btn primary" type="button" onClick={() => setShowCameraForm((prev) => !prev)}>
                    {showCameraForm ? 'Cerrar formulario' : 'Subir nueva cámara'}
                  </button>
                </div>
                {showCameraForm ? (
                  <form className="admin-form" onSubmit={handleCameraSubmit}>
                    <p className="helper required-note">* Campos obligatorios</p>
                    <div className="field-row">
                      <label htmlFor="camera-title">
                        Título <span className="required-star">*</span>
                      </label>
                      <input
                        id="camera-title"
                        value={cameraForm.title}
                        onChange={(event) => setCameraForm({ ...cameraForm, title: event.target.value })}
                        required
                      />
                    </div>
                    <div className="field-row">
                      <label htmlFor="camera-brand">
                        Marca <span className="required-star">*</span>
                      </label>
                      <select
                        id="camera-brand"
                        className="brand-select"
                        value={brandSelect}
                        onChange={(event) => {
                          const value = event.target.value
                          if (value === 'custom') {
                            setCameraForm({ ...cameraForm, brand: '' })
                            setBrandSelect('custom')
                          } else {
                            setBrandSelect(value)
                            setCameraForm({ ...cameraForm, brand: value })
                          }
                        }}
                        required
                      >
                        <option value="" disabled>
                          Selecciona marca
                        </option>
                        {BRAND_OPTIONS.map((brand) => (
                          <option key={brand} value={brand}>
                            {brand}
                          </option>
                        ))}
                        <option value="custom">Otra (especificar)</option>
                      </select>
                      {brandSelect === 'custom' ? (
                        <input
                          type="text"
                          placeholder="Escribe la marca"
                          value={cameraForm.brand}
                          onChange={(event) => setCameraForm({ ...cameraForm, brand: event.target.value })}
                          required
                          style={{ marginTop: '0.5rem' }}
                        />
                      ) : null}
                    </div>
                    <div className="field-row">
                      <label htmlFor="camera-description">
                        Descripción <span className="required-star">*</span>
                      </label>
                      <textarea
                        id="camera-description"
                        rows={3}
                        value={cameraForm.description}
                        onChange={(event) => setCameraForm({ ...cameraForm, description: event.target.value })}
                        required
                      ></textarea>
                    </div>
                    <div className="field-row">
                      <label htmlFor="camera-condition">
                        Condición <span className="required-star">*</span>
                      </label>
                      <select
                        id="camera-condition"
                        value={cameraForm.condition}
                        onChange={(event) => setCameraForm({ ...cameraForm, condition: event.target.value })}
                      >
                        {conditionOptions.map((condition) => (
                          <option key={condition} value={condition}>
                            {condition}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field-row inline">
                      <div>
                        <label htmlFor="camera-price">
                          Precio <span className="required-star">*</span>
                        </label>
                        <input
                          id="camera-price"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={cameraForm.price}
                          onChange={(event) => setCameraForm({ ...cameraForm, price: event.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label>Divisa</label>
                        <div className="pill">GTQ</div>
                      </div>
                    </div>
                    <div className="field-row">
                      <label htmlFor="camera-files">
                        Arrastra o sube fotos de la cámara <span className="required-star">*</span>
                      </label>
                      <label className="file-drop" htmlFor="camera-files">
                        <span>Arrastra aquí o haz clic para subir</span>
                        <small>JPG/PNG/WebP · Puedes elegir cuál será la principal</small>
                      </label>
                      <input
                        className="visually-hidden"
                        id="camera-files"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(event) => {
                          const files = Array.from(event.target.files || [])
                          setCameraFiles(files)
                          setPrimaryImageIndex(0)
                        }}
                      />
                    </div>
                    {cameraFiles.length > 0 ? (
                      <div className="field-row">
                        <p className="helper">Elige la imagen principal para mostrar en la página pública:</p>
                        <div className="admin-image-options">
                          {cameraFiles.map((file, index) => (
                            <label key={`${file.name}-${index}`} className="admin-image-option">
                              <input
                                type="radio"
                                name="primary-image"
                                checked={primaryImageIndex === index}
                                onChange={() => setPrimaryImageIndex(index)}
                              />
                              <span>{file.name}</span>
                              {primaryImageIndex === index ? <span className="badge">Principal</span> : null}
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div className="admin-form__actions">
                      <button
                        className="btn ghost"
                        type="button"
                        onClick={() => {
                          setShowCameraForm(false)
                          setEditingCameraId(null)
                          setCameraForm(defaultCameraForm)
                          setBrandSelect('')
                          setCameraFiles([])
                          setPrimaryImageIndex(0)
                        }}
                      >
                        Cancelar
                      </button>
                      <button className="btn primary" type="submit" disabled={isSubmitting}>
                        {editingCameraId ? 'Guardar cambios' : 'Publicar cámara'}
                      </button>
                    </div>
                  </form>
                ) : null}

                <div className="admin-table-wrapper">
                  {cameras.length === 0 ? (
                    <p className="helper">Aún no hay cámaras publicadas.</p>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Foto</th>
                          <th>Nombre</th>
                          <th>Precio</th>
                          <th>Condición</th>
                          <th>Estatus</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cameras.map((camera) => {
                          const imageUrl = getImageUrl(camera.image_path)
                          const nextStatus = camera.status === 'sold' ? 'available' : 'sold'
                          return (
                            <tr key={camera.id}>
                              <td>{imageUrl ? <img className="admin-thumb" src={imageUrl} alt={camera.title} /> : null}</td>
                              <td>
                                <div className="admin-name">
                                  <strong>{camera.title}</strong>
                                  <span>{camera.brand}</span>
                                </div>
                              </td>
                              <td>{formatMoney(camera.price, camera.currency)}</td>
                              <td>{camera.condition}</td>
                              <td className={`status-chip status-${camera.status}`}>{camera.status}</td>
                              <td>
                                <div className="icon-actions">
                                  <button
                                    type="button"
                                    className="icon-btn"
                                    title={camera.status === 'sold' ? 'Marcar disponible' : 'Marcar vendida'}
                                    onClick={() => handleCameraStatus(camera.id, { status: nextStatus })}
                                  >
                                    {camera.status === 'sold' ? '🔄' : '✅'}
                                  </button>
                                  <button
                                    type="button"
                                    className="icon-btn"
                                    title="Editar"
                                    onClick={() => startEditingCamera(camera)}
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    type="button"
                                    className="icon-btn danger"
                                    title="Borrar"
                                    onClick={() => handleCameraDelete(camera.id)}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="admin-section">
                <div className="admin-section__heading">
                  <div>
                    <p className="eyebrow">Ofertas</p>
                    <h3>Cámaras ofertadas</h3>
                  </div>
              </div>
              <div className="admin-table-wrapper">
                {adminOffers.length === 0 ? (
                  <p className="helper">Aún no se registran ofertas.</p>
                ) : (
                  <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Foto</th>
                          <th>Nombre</th>
                          <th>Marca</th>
                          <th>Condición</th>
                          <th>Precio recomendado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminOffers.map((offer) => {
                          const firstImage = offer.image_gallery?.[0]
                          const thumb = firstImage ? getImageUrl(firstImage) : null
                          return (
                            <tr key={offer.id}>
                              <td>{thumb ? <img className="admin-thumb" src={thumb} alt={offer.camera_title} /> : null}</td>
                              <td>{offer.camera_title}</td>
                              <td>{offer.brand}</td>
                              <td>{offer.condition}</td>
                              <td>{formatMoney(offer.asking_price_cents / 100, 'GTQ')}</td>
                              <td>
                                <div className="admin-offer-actions">
                                  <button className="btn primary" onClick={() => handleOfferDecision(offer.id, 'accepted')}>
                                    Aceptar
                                  </button>
                                  <button
                                    className="btn alt"
                                    onClick={() => {
                                      const counter = window.prompt('Monto contrapropuesta (GTQ)', '0')
                                      if (counter) {
                                        handleOfferDecision(offer.id, 'countered', Number(counter))
                                      }
                                    }}
                                  >
                                    Ofertar nuevamente
                                  </button>
                                  <button className="btn danger" onClick={() => handleOfferDecision(offer.id, 'declined')}>
                                    Denegar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="admin-locked">
              <p>Necesitas permisos de administrador para ver este tablero.</p>
              <button className="btn secondary" type="button" onClick={goToLoginView}>
                Iniciar sesión
              </button>
            </div>
          )}
        </section>
      )}

      {activeCamera ? (
        <div className="modal-backdrop" onClick={() => setActiveCamera(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <header className="modal-header">
              <div>
                <p className="eyebrow">{activeCamera.brand}</p>
                <h3>{activeCamera.title}</h3>
              </div>
              <button className="btn ghost" type="button" onClick={() => setActiveCamera(null)}>
                Cerrar
              </button>
            </header>
            <div className="modal-body">
              <div className="modal-media">
                {(() => {
                  const images = getCameraImages(activeCamera)
                  const total = images.length || (activeCamera.image_path ? 1 : 0)
                  const idx = galleryIndex[activeCamera.id] ?? 0
                  const currentPath =
                    total > 0
                      ? images[((idx % total) + total) % total] || activeCamera.image_path
                      : activeCamera.image_path
                  const url = getImageUrl(currentPath)
                  return (
                    <>
                      {url ? <img src={url} alt={activeCamera.title} /> : <span>Sin imagen</span>}
                      {total > 1 ? (
                        <div className="media-nav">
                          <button
                            type="button"
                            className="media-nav__btn"
                            onClick={() => changeGalleryIndex(activeCamera.id, total, -1)}
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            className="media-nav__btn"
                            onClick={() => changeGalleryIndex(activeCamera.id, total, 1)}
                          >
                            ›
                          </button>
                        </div>
                      ) : null}
                    </>
                  )
                })()}
              </div>
                  <div className="modal-info">
                    <p className="camera-card__condition">Estado: {activeCamera.condition}</p>
                    <p className="camera-card__description">{activeCamera.description}</p>
                    {renderPrice(activeCamera)}
                    {activeCamera.status === 'sold' ? <small className="badge badge-sold">Vendida</small> : null}
                    <div className="modal-actions">
                      <button
                        className="btn secondary"
                        onClick={() => {
                          handleAddToCart(activeCamera.id)
                          setActiveCamera(null)
                        }}
                        disabled={activeCamera.status !== 'available'}
                      >
                        {activeCamera.status === 'available' ? 'Agregar al carrito' : 'No disponible'}
                      </button>
                      <button
                        className="btn primary"
                        onClick={() => handleBuyNow(activeCamera.id)}
                        disabled={activeCamera.status === 'sold'}
                      >
                        Comprar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
        </div>
      ) : null}

      <footer className="footer">
        <p>{COMPANY_NAME}</p>
      </footer>
    </div>
  )
}

export default App
