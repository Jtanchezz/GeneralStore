import { useEffect, useMemo, useRef, useState } from 'react'

const productCategories = [
  { id: 'all', label: 'Todos' },
  { id: 'tecnologia', label: 'Tecnología' },
  { id: 'moda', label: 'Moda' },
  { id: 'coleccionables', label: 'Coleccionables' },
]

const products = [
  {
    id: 'air-jordan-1-retro',
    title: 'Air Jordan 1 Retro',
    category: 'moda',
    description: 'Estado 9/10 con caja original, perfectas para coleccionistas.',
    image:
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=640&q=80',
    alt: 'Zapatillas Air Jordan 1 Retro',
  },
]

const workflowSteps = [
  {
    title: 'Publicación guiada del vendedor',
    description:
      'Completa marca, modelo, precio objetivo y fotos. Recomendamos mejoras para posicionar mejor tu producto.',
  },
  {
    title: 'Evaluación desde el panel administrativo',
    description:
      'FastAPI analiza historial y demanda. En segundos decides si comprar, negociar o destacar la publicación.',
  },
  {
    title: 'Pago y logística integrados',
    description:
      'Ofertas, pagos y envíos quedan registrados. Se libera el pago automáticamente cuando ambas partes confirman la entrega.',
  },
]

const techHighlights = [
  {
    title: 'Frontend React',
    description:
      'Componentes reutilizables, formularios dinámicos y navegación responsive estilo marketplace global.',
  },
  {
    title: 'API FastAPI',
    description:
      'Endpoints, validación automática y escalamiento sencillo para picos de tráfico.',
  },
  {
    title: 'PostgreSQL',
    description: 'Persistencia relacional para usuarios, productos, ofertas y auditoría financiera.',
  },
  {
    title: 'DynamoDB',
    description:
      'Cachea sesiones, listados más vistos y notificaciones para que la app se sienta instantánea.',
  },
]

const contactStats = [
  {
    highlight: '48h',
    description: 'tiempo promedio para responder propuestas.',
  },
  {
    highlight: '+50',
    description: 'integraciones con ERPs y pasarelas.',
  },
  {
    highlight: '99.9%',
    description: 'disponibilidad garantizada.',
  },
]

const getGreeting = () => {
  const now = new Date()
  const hour = now.getHours()
  if (hour >= 5 && hour < 12) return 'Buenos días'
  if (hour >= 12 && hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [offerSubmitted, setOfferSubmitted] = useState(false)
  const offerFormRef = useRef(null)
  const offerModalRef = useRef(null)

  const greeting = useMemo(() => getGreeting(), [])

  useEffect(() => {
    document.body.classList.add('bg-body-tertiary')
    return () => document.body.classList.remove('bg-body-tertiary')
  }, [])

  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode)
  }, [isDarkMode])

  useEffect(() => {
    const modalElement = offerModalRef.current
    if (!modalElement) return

    const handleHidden = () => setOfferSubmitted(false)
    modalElement.addEventListener('hidden.bs.modal', handleHidden)
    return () => {
      modalElement.removeEventListener('hidden.bs.modal', handleHidden)
    }
  }, [])

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return products.filter((product) => {
      const matchesCategory = activeCategory === 'all' || product.category === activeCategory
      const matchesSearch = product.title.toLowerCase().includes(normalizedSearch)
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchTerm])

  const handleThemeToggle = () => {
    setIsDarkMode((prev) => !prev)
  }

  const handleOfferSubmit = () => {
    setOfferSubmitted(true)
    offerFormRef.current?.reset()
  }

  const handleOpenOfferModal = () => {
    setOfferSubmitted(false)
  }

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
        <div className="container">
          <a className="navbar-brand fw-bold" href="#inicio">
            GeneralStore
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNav"
            aria-controls="mainNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="mainNav">
            <form
              className="d-flex ms-lg-4 my-3 my-lg-0"
              role="search"
              onSubmit={(event) => event.preventDefault()}
            >
              <input
                className="form-control me-2"
                type="search"
                placeholder="Buscar productos"
                aria-label="Buscar"
              />
              <button className="btn btn-outline-light" type="submit">
                Buscar
              </button>
            </form>
            <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-3">
              <li className="nav-item">
                <a className="nav-link active" href="#mercado">
                  Marketplace
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#flujo">
                  Cómo funciona
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#tecnologia">
                  Tecnología
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#contacto">
                  Contacto
                </a>
              </li>
            </ul>
            <button
              id="themeToggle"
              type="button"
              className="btn btn-outline-light ms-lg-3"
              onClick={handleThemeToggle}
            >
              {isDarkMode ? 'Desactivar modo oscuro' : 'Activar modo oscuro'}
            </button>
          </div>
        </div>
      </nav>

      <div className="bg-primary-subtle border-bottom">
        <div className="container">
          <ul className="nav nav-pills small overflow-auto flex-nowrap py-2 category-nav">
            <li className="nav-item">
              <a className="nav-link active" href="#mercado">
                Destacados
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#tecnologia">
                Stack
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#flujo">
                Proceso
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#contacto">
                Demo
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#offerModal" data-bs-toggle="modal">
                Vende con nosotros
              </a>
            </li>
          </ul>
        </div>
      </div>

      <header id="inicio" className="hero text-white">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span className="badge text-bg-light text-primary greeting-badge mb-3">
                {greeting}
              </span>
              <h1 className="display-5 fw-bold mb-3">
                El marketplace para comprar y revender productos únicos
              </h1>
              <p className="lead mb-4">
                Sube tu inventario en minutos, recibe contraofertas desde un panel administrativo ágil y conecta con compradores listos para cerrar trato.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <a href="#mercado" className="btn btn-light text-primary-emphasis btn-lg">
                  Ver productos
                </a>
                <button
                  type="button"
                  className="btn btn-outline-light btn-lg"
                  data-bs-toggle="modal"
                  data-bs-target="#offerModal"
                  onClick={handleOpenOfferModal}
                >
                  Vender ahora
                </button>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card hero-card border-0 shadow-lg">
                <div className="card-body p-4 p-lg-5">
                  <h2 className="h4 text-primary fw-semibold mb-4">Panel administrativo moderno</h2>
                  <div className="row g-3">
                    <div className="col-6">
                      <div className="mini-card">
                        <p className="mini-card__title">Revisión inteligente</p>
                        <p className="mini-card__text">
                          FastAPI ordena propuestas y sugiere ofertas personalizadas.
                        </p>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="mini-card">
                        <p className="mini-card__title">Alertas al instante</p>
                        <p className="mini-card__text">
                          Notifica a compradores cuando aparece su producto favorito.
                        </p>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="mini-card">
                        <p className="mini-card__title">Pagos confiables</p>
                        <p className="mini-card__text">
                          Integraciones seguras con seguimiento y liberación automática.
                        </p>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="mini-card">
                        <p className="mini-card__title">Analítica clara</p>
                        <p className="mini-card__text">
                          Dashboard con métricas clave y rendimiento de campañas.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section id="mercado" className="py-5">
          <div className="container">
            <div className="row align-items-center g-4 mb-4">
              <div className="col-lg-6">
                <h2 className="section-title">Productos listos para destacar</h2>
                <p className="section-subtitle">
                  Filtra por categoría, descubre artículos con potencial de reventa y replica publicaciones que han conquistado a los coleccionistas.
                </p>
              </div>
              <div className="col-lg-6">
                <div className="input-group mb-2">
                  <span className="input-group-text bg-primary text-white">Buscar</span>
                  <input
                    id="productSearch"
                    type="search"
                    className="form-control"
                    placeholder="Zapatillas, consolas, coleccionables..."
                    aria-label="Buscar producto"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {productCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className={`btn btn-outline-primary filter-btn${
                        activeCategory === category.id ? ' active' : ''
                      }`}
                      data-category={category.id}
                      onClick={() => setActiveCategory(category.id)}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="row row-cols-1 row-cols-md-3 g-4" id="productGrid">
              {filteredProducts.length === 0 ? (
                <div className="col">
                  <div className="alert alert-light border mb-0" role="alert">
                    No encontramos resultados para tu búsqueda. Intenta con otra combinación.
                  </div>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <div
                    className="col product-card"
                    key={product.id}
                    data-category={product.category}
                    data-title={product.title}
                  >
                    <div className="card h-100 shadow-sm">
                      <img src={product.image} className="card-img-top" alt={product.alt} />
                      <div className="card-body d-flex flex-column">
                        <h3 className="h5 card-title">{product.title}</h3>
                        <p className="card-text flex-grow-1">{product.description}</p>
                        <button
                          type="button"
                          className="btn btn-primary mt-3"
                          data-bs-toggle="modal"
                          data-bs-target="#offerModal"
                          onClick={handleOpenOfferModal}
                        >
                          Quiero vender algo similar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section id="flujo" className="py-5 bg-white border-top">
          <div className="container">
            <div className="row g-4 align-items-start">
              <div className="col-lg-5">
                <h2 className="section-title">Como lo vamos a vender</h2>
                <p className="section-subtitle">
                  La idea es lanzar una página tipo marketplace donde cualquier persona pueda vender o comprar productos que todavía tienen valor pero ya no usa. Buscaremos atraer a vendedores que quieran darle una segunda vida a sus artículos y a compradores interesados en encontrar buenos precios o piezas únicas. La página funcionará como un punto de encuentro: los usuarios podrán subir fotos, descripción y precio de lo que venden, y nosotros revisaremos las publicaciones para asegurar calidad y confianza. También podremos hacer ofertas directas a los vendedores para adquirir los productos y revenderlos dentro del mismo sitio. Queremos crear una comunidad de compra y reventa moderna, fácil de usar y confiable, donde los usuarios puedan moverse con seguridad y encontrar todo tipo de productos en un solo lugar.
                </p>
              </div>
              <div className="col-lg-7">
                <div className="accordion" id="workflowAccordion">
                  {workflowSteps.map((step, index) => {
                    const collapseId = `collapse-${index}`
                    const headingId = `heading-${index}`
                    const isFirst = index === 0
                    return (
                      <div className="accordion-item" key={step.title}>
                        <h2 className="accordion-header" id={headingId}>
                          <button
                            className={`accordion-button${isFirst ? '' : ' collapsed'}`}
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target={`#${collapseId}`}
                            aria-expanded={isFirst}
                            aria-controls={collapseId}
                          >
                            {step.title}
                          </button>
                        </h2>
                        <div
                          id={collapseId}
                          className={`accordion-collapse collapse${isFirst ? ' show' : ''}`}
                          aria-labelledby={headingId}
                          data-bs-parent="#workflowAccordion"
                        >
                          <div className="accordion-body">{step.description}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="tecnologia" className="py-5">
          <div className="container">
            <div className="row g-4">
              <div className="col-lg-4">
                <h2 className="section-title">Tecnología lista para escalar</h2>
                <p className="section-subtitle">
                  React para la experiencia de usuario, FastAPI para la lógica, PostgreSQL para datos críticos y DynamoDB para respuestas en tiempo real.
                </p>
              </div>
              <div className="col-lg-8">
                <div className="row row-cols-1 row-cols-sm-2 g-4">
                  {techHighlights.map((tech) => (
                    <div className="col" key={tech.title}>
                      <div className="card tech-card h-100 shadow-sm">
                        <div className="card-body">
                          <h3 className="h5">{tech.title}</h3>
                          <p className="mb-0">{tech.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <section className="py-5">
        <div className="container">
          <div className="cta-card text-center text-white shadow-lg">
            <h2 className="fw-bold mb-3">Estamos listos para impulsar tu marketplace</h2>
            <p className="mb-4">
              Agenda una demo personalizada, conecta tus bases de datos y lanza la experiencia de compra que tus usuarios merecen.
            </p>
            <a href="#contacto" className="btn btn-light btn-lg text-primary-emphasis px-4">
              Solicitar demo
            </a>
          </div>
        </div>
      </section>

      <section id="contacto" className="py-5 bg-white border-top">
        <div className="container">
          <div className="row g-4 align-items-start">
            <div className="col-lg-5">
              <h2 className="section-title">Conversemos sobre tu inventario</h2>
              <p className="section-subtitle">
                Dinos qué categorías manejas y te acompañamos con integraciones y automatizaciones para vender más rápido.
              </p>
              <ul className="list-group list-group-flush">
                {contactStats.map((stat) => (
                  <li className="list-group-item bg-transparent px-0" key={stat.highlight}>
                    <strong>{stat.highlight}</strong> {stat.description}
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-lg-7">
              <form className="card shadow-sm border-0 p-4" onSubmit={(event) => event.preventDefault()}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="name" className="form-label">
                      Nombre
                    </label>
                    <input type="text" id="name" className="form-control" placeholder="María López" />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="email" className="form-label">
                      Correo
                    </label>
                    <input type="email" id="email" className="form-control" placeholder="maria@empresa.com" />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="role" className="form-label">
                      Rol
                    </label>
                    <select id="role" className="form-select" defaultValue="comprador">
                      <option value="comprador">Comprador</option>
                      <option value="vendedor">Vendedor</option>
                      <option value="ambos">Ambos</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="inventory" className="form-label">
                      Inventario principal
                    </label>
                    <input
                      type="text"
                      id="inventory"
                      className="form-control"
                      placeholder="Sneakers, consolas..."
                    />
                  </div>
                  <div className="col-12">
                    <label htmlFor="message" className="form-label">
                      Mensaje
                    </label>
                    <textarea
                      id="message"
                      rows="3"
                      className="form-control"
                      placeholder="Cuéntanos qué experiencia quieres crear"
                    ></textarea>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary mt-4">
                  Enviar propuesta
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-dark text-white py-4">
        <div className="container d-flex flex-column flex-lg-row justify-content-between align-items-center gap-3">
          <div>
            <span className="fw-semibold">GeneralStore</span> © 2024. Impulsamos la reventa moderna.
          </div>
          <div className="d-flex gap-3">
            <a href="#mercado" className="text-white text-decoration-none">
              Marketplace
            </a>
            <a href="#tecnologia" className="text-white text-decoration-none">
              Tecnología
            </a>
            <a href="#contacto" className="text-white text-decoration-none">
              Contacto
            </a>
          </div>
        </div>
      </footer>

      <div
        className="modal fade"
        id="offerModal"
        tabIndex="-1"
        aria-labelledby="offerModalLabel"
        aria-hidden="true"
        ref={offerModalRef}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5" id="offerModalLabel">
                Publicar un producto
              </h2>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div className="modal-body">
              <form id="offerForm" ref={offerFormRef}>
                <div className="mb-3">
                  <label htmlFor="productName" className="form-label">
                    Nombre del producto
                  </label>
                  <input
                    type="text"
                    id="productName"
                    className="form-control"
                    placeholder="Ej: Nintendo Switch OLED"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="productCategory" className="form-label">
                    Categoría
                  </label>
                  <select id="productCategory" className="form-select" defaultValue="tecnologia">
                    <option value="tecnologia">Tecnología</option>
                    <option value="moda">Moda</option>
                    <option value="coleccionables">Coleccionables</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="desiredPrice" className="form-label">
                    Precio deseado
                  </label>
                  <input type="number" id="desiredPrice" className="form-control" placeholder="250.00" />
                </div>
                <div className="mb-3">
                  <label htmlFor="productDetails" className="form-label">
                    Detalles
                  </label>
                  <textarea
                    id="productDetails"
                    className="form-control"
                    rows="3"
                    placeholder="Describe el estado, accesorios incluidos, etc."
                  ></textarea>
                </div>
              </form>
              {offerSubmitted && (
                <div className="alert alert-info mt-3 mb-0" role="status">
                  ¡Gracias! Nuestro equipo revisará tu propuesta y te responderá muy pronto.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Cerrar
              </button>
              <button type="button" id="submitOffer" className="btn btn-primary" onClick={handleOfferSubmit}>
                Enviar propuesta
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
