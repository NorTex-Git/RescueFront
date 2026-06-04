/**
 * ===== EMPRESAS MODALS FUNCTIONALITY =====
 * 
 * Este archivo contiene la funcionalidad para todos los modales de empresas:
 * - Modal de crear empresa
 * - Modal de editar empresa
 * - Modal de ver detalles
 * - Modal de confirmar toggle status
 * - Modal de confirmaciones y success
 */

const buildApiUrl = window.__buildApiUrl || function(path = '') {
  const base = window.__APP_CONFIG && window.__APP_CONFIG.apiUrl;
  if (!base) {
    throw new Error('API URL no configurada');
  }
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  if (!path) {
    return normalizedBase;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

// ============================================================================
// 1. EMPRESAS MODAL SCROLL MANAGER - OPTIMIZADO PARA EMPRESAS
// ============================================================================
class EmpresasModalScrollManager {
  constructor() {
    this.openModals = new Set();
    this.scrollPosition = 0;
    this.isLocked = false;
    this.init();
  }

  init() {
    this.injectCSS();
    window.addEventListener('orientationchange', () => setTimeout(() => this.refreshLock(), 100));
    window.addEventListener('resize', () => this.hasOpenModals() && this.refreshLock());
  }

  injectCSS() {
    if (document.getElementById('empresas-modal-scroll-css')) return;
    
    const style = document.createElement('style');
    style.id = 'empresas-modal-scroll-css';
    style.textContent = `
      .empresas-modal-scroll-locked { overflow: hidden !important; }
      .empresas-modal-scrollable { overflow-y: auto; -webkit-overflow-scrolling: touch; }
    `;
    document.head.appendChild(style);
  }

  openModal(modalId, options = {}) {
    //consoleç.log(`🔒 Opening empresas modal: ${modalId}`);
    
    if (this.openModals.size === 0) {
      this.scrollPosition = window.pageYOffset;
      this.lockScroll();
    }
    
    this.openModals.add(modalId);
    
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
    }
    
    options.focusTrap && this.setupFocusTrap(modalId);
  }

  closeModal(modalId) {
    //consoleç.log(`🔓 Closing empresas modal: ${modalId}`);
    
    this.openModals.delete(modalId);
    
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
    
    if (this.openModals.size === 0) {
      this.unlockScroll();
    }
  }

  lockScroll() {
    if (this.isLocked) return;
    
    //consoleç.log('🔒 Using CSS-only scroll lock to prevent white borders');
    
    const body = document.body;
    
    // USAR SOLO CLASE CSS CON OVERSCROLL-BEHAVIOR PARA EVITAR BORDES BLANCOS
    body.classList.add('empresas-modal-open');
    
    this.isLocked = true;
    //consoleç.log('✅ CSS-only scroll lock applied');
  }

  unlockScroll() {
    if (!this.isLocked) return;
    
    //consoleç.log('🔓 Using CSS-only scroll unlock to prevent white borders');
    
    const body = document.body;
    
    // USAR SOLO CLASE CSS - NO MANIPULAR ESTILOS DIRECTAMENTE
    body.classList.remove('empresas-modal-open');
    
    this.isLocked = false;
    //consoleç.log('✅ CSS-only scroll unlock applied');
  }

  setupFocusTrap(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    
    const trapFocus = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };
    
    modal.addEventListener('keydown', trapFocus);
    first?.focus();
  }

  hasOpenModals() { return this.openModals.size > 0; }
  
  closeAllModals() {
    Array.from(this.openModals).forEach(id => this.closeModal(id));
  }
  
  refreshLock() {
    if (this.hasOpenModals()) {
      this.unlockScroll();
      setTimeout(() => this.lockScroll(), 50);
    }
  }
}

// ============================================================================
// 2. EMPRESAS MODALS CLASS - ACTUALIZADA CON MODALSCROLLMANAGER
// ============================================================================
class EmpresasModals {
  constructor() {
    this.currentEditingEmpresa = null;
    this.currentViewingEmpresa = null;
    this.currentToggleEmpresa = null;
    this.apiClient = null;
    this.sedes = [];
    this.roles = [];
    this.successModalId = 'empresasUpdateModal';
    
    // Inicializar ModalScrollManager
    this.modalManager = new EmpresasModalScrollManager();
    
    this.initializeModals();
  }

  /**
   * Initialize modal system
   */
  initializeModals() {
    try {
      // Setup API client
      this.setupApiClient();
      
      // Create modal HTML structures
      this.createModalStructures();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Load tipos de empresa
      this.loadTiposEmpresa();
      
      //consoleç.log('🏢 Modales de empresas inicializados correctamente');
      
    } catch (error) {
      //consoleç.error('💥 Error al inicializar modales de empresas:', error);
    }
  }

  /**
   * Setup API client
   */
  setupApiClient() {
    if (window.AdminSpaApi?.getClient) {
      const apiClient = window.AdminSpaApi.getClient();
      if (apiClient) {
        this.apiClient = apiClient;
        return;
      }
    }

    if (window.empresasMain && window.empresasMain.apiClient) {
      this.apiClient = window.empresasMain.apiClient;
    } else if (window.apiClient) {
      this.apiClient = window.apiClient;
    } else if (typeof EndpointTestClient !== 'undefined') {
      this.apiClient = new EndpointTestClient();
    } else {
      this.apiClient = this.createBasicApiClient();
    }
  }

  /**
   * Create basic API client fallback
   */
  createBasicApiClient() {
    return {
      get_empresas_dashboard: () => fetch(buildApiUrl('/api/empresas/dashboard/all')),
      get_empresas: () => fetch(buildApiUrl('/api/empresas')),
      get_empresa: (id) => fetch(buildApiUrl(`/api/empresas/${id}`)),
      toggle_empresa_status: (id, activa) => 
        fetch(buildApiUrl(`/api/empresas/${id}/toggle-status`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activa })
        }),
      create_empresa: (data) =>
        fetch(buildApiUrl('/api/empresas/'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }),
      update_empresa: (id, data) =>
        fetch(buildApiUrl(`/api/empresas/${id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }),
      delete_empresa: (id) =>
        fetch(buildApiUrl(`/api/empresas/${id}`), {
          method: 'DELETE'
        }),
      get_tipos_empresa: () => fetch(buildApiUrl('/api/tipos_empresa'))
    };
  }

  /**
   * Create modal HTML structures
   */
  createModalStructures() {
    this.createToggleModal();
    this.createCrudModal();
    this.createViewModal();
    this.createSuccessModal();
  }

  /**
   * Create toggle status modal - SAME STRUCTURE AS HARDWARE/COMPANY TYPES
   */
  createToggleModal() {
    // No crear el modal aquí porque ya existe en el HTML
    // Solo verificar que existe
    const existingModal = document.getElementById('toggleEmpresaModal');
    if (existingModal) {
      //consoleç.log('✅ Modal de toggle ya existe en el HTML');
      return;
    }
    
    // Si no existe, crear uno usando las clases exactas del hardware
    const modalHTML = `
      <!-- Enhanced Toggle Empresa Status Modal - EXACTO DEL HARDWARE -->
      <div id="toggleEmpresaModal" class="ios-modal-backdrop toggle-modal hidden">
        <div class="ios-blur-modal-container flex flex-col w-full max-w-md !max-h-[85vh] overflow-hidden mx-auto" id="toggleModalContainer">
          <div class="ios-blur-header text-center">
            <div class="toggle-modal-icon mx-auto mb-4" id="toggleModalIcon">
              <i class="fas fa-power-off text-4xl" id="toggleModalIconFa"></i>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2" id="toggleModalTitle">Activar Empresa</h3>
          </div>
          <div class="ios-blur-body flex-1 min-h-0 !max-h-none text-center">
            <p class="text-gray-700 dark:text-white/80 text-lg mb-6" id="toggleModalMessage">
              ¿Estás seguro de que quieres activar esta empresa?
            </p>
            <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button class="ios-blur-btn ios-blur-btn-secondary" onclick="empresasModals.closeToggleModal()">
                <i class="fas fa-times mr-2"></i>
                Cancelar
              </button>
              <button class="ios-blur-btn ios-blur-btn-primary" id="toggleConfirmBtn" onclick="empresasModals.confirmToggle()">
                <i class="fas fa-check mr-2" id="toggleConfirmIcon"></i>
                <span id="toggleConfirmText">Activar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  /**
   * Create CRUD modal (create/edit) - EXACT STYLE AS COMPANY TYPES
   */
  createCrudModal() {
    const modalHTML = `
      <!-- Create/Edit Empresa Modal - EXACT COMPANY TYPES STYLE -->
      <div id="empresaModal" class="ios-modal-backdrop ios-modal-compact hidden">
        <div class="ios-blur-modal-container flex flex-col w-full max-w-3xl sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl !max-h-[92vh] sm:!max-h-[90vh] overflow-hidden">
          <!-- Modal Header -->
          <div class="ios-blur-header">
            <div class="flex flex-col items-start gap-4 w-full sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <i class="fas fa-building text-gray-900 dark:text-white text-xl"></i>
                </div>
                <div>
                  <h3 class="text-2xl font-bold text-gray-900 dark:text-white" id="empresaModalTitle">Nueva Empresa</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-300">Complete los campos para registrar la empresa</p>
                </div>
              </div>
              <button type="button" class="ios-blur-btn ios-blur-btn-secondary shrink-0 !p-2 !min-w-0" onclick="empresasModals.closeCrudModal()" aria-label="Cerrar modal">
                <i class="fas fa-times text-lg"></i>
              </button>
            </div>
          </div>
          
          <!-- Modal Body -->
          <div class="ios-blur-body flex-1 min-h-0 !max-h-none">
            <form id="empresaForm">
              <div class="form-grid">
                <!-- Nombre -->
                <div class="form-group">
                  <label for="empresaNombre" class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    <i class="fas fa-building text-blue-400 mr-2"></i>Nombre de la Empresa *
                  </label>
                  <input type="text" id="empresaNombre" class="ios-blur-input" required
                         placeholder="Ej: Acme Corporation">
                </div>
                
                <!-- Username -->
                <div class="form-group">
                  <label for="empresaUsername" class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    <i class="fas fa-user text-purple-400 mr-2"></i>Nombre de Usuario *
                  </label>
                  <input type="text" id="empresaUsername" class="ios-blur-input" required
                         placeholder="Ej: acme_corp">
                </div>
                
                <!-- Email -->
                <div class="form-group">
                  <label for="empresaEmail" class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    <i class="fas fa-envelope text-cyan-400 mr-2"></i>Email *
                  </label>
                  <input type="email" id="empresaEmail" class="ios-blur-input" required
                         placeholder="contacto@empresa.com">
                </div>
                
                <!-- Ubicación -->
                <div class="form-group">
                  <label for="empresaUbicacion" class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    <i class="fas fa-map-marker-alt text-green-400 mr-2"></i>Ubicación *
                  </label>
                  <input type="text" id="empresaUbicacion" class="ios-blur-input" required
                         placeholder="Ciudad, País">
                </div>
                
                <!-- Tipo de Empresa -->
                <div class="form-group">
                  <label for="empresaTipo" class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    <i class="fas fa-tags text-pink-400 mr-2"></i>Tipo de Empresa *
                  </label>
                  <select id="empresaTipo" class="ios-blur-input" required>
                    <option value="">Seleccionar tipo...</option>
                    <!-- Options will be loaded dynamically from backend -->
                  </select>
                </div>
                
                <!-- Descripción -->
                <div class="form-group form-group-full">
                  <label for="empresaDescripcion" class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    <i class="fas fa-align-left text-orange-400 mr-2"></i>Descripción *
                  </label>
                  <textarea id="empresaDescripcion" class="ios-blur-input !min-h-[6rem] resize-y" rows="3" required
                            placeholder="Describe la empresa, sus actividades principales..."></textarea>
                </div>
                
                <!-- Contraseña -->
                <div class="form-group" id="passwordGroup">
                  <label for="empresaPassword" class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    <i class="fas fa-lock text-red-400 mr-2"></i>Contraseña *
                  </label>
                  <input type="password" id="empresaPassword" class="ios-blur-input" required
                         placeholder="Contraseña segura">
                </div>
                
                <!-- Sedes -->
                <div class="form-group form-group-full">
                  <label class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    <i class="fas fa-building text-yellow-400 mr-2"></i>Sedes
                  </label>
                  <div id="sedesContainer" class="empresa-sedes-container">
                    <div class="flex space-x-2 mb-3">
                      <button type="button" class="ios-blur-btn ios-blur-btn-primary !p-2 !min-w-0" onclick="empresasModals.addSede()">
                        <i class="fas fa-plus"></i>
                      </button>
                      <span class="text-white/90 text-sm self-center">Agregar sede</span>
                    </div>
                    <div id="sedesList" class="space-y-2">
                      <!-- Sedes will be displayed here -->
                    </div>
                  </div>
                </div>
                
                <!-- Roles -->
                <div class="form-group form-group-full">
                  <label class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    <i class="fas fa-user-tag text-purple-400 mr-2"></i>Roles
                  </label>
                  <div id="rolesContainer" class="empresa-roles-container">
                    <div class="flex space-x-2 mb-3">
                      <button type="button" class="ios-blur-btn ios-blur-btn-primary !p-2 !min-w-0" onclick="empresasModals.addRol()">
                        <i class="fas fa-plus"></i>
                      </button>
                      <span class="text-white/90 text-sm self-center">Agregar rol</span>
                    </div>
                    <div id="rolesList" class="space-y-2">
                      <!-- Roles will be displayed here -->
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
          
          <!-- Modal Footer -->
          <div class="ios-blur-footer flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button type="button" class="ios-blur-btn ios-blur-btn-secondary" onclick="empresasModals.closeCrudModal()">
              <i class="fas fa-times mr-2"></i>
              <span class="text-sm font-medium">Cancelar</span>
            </button>
            <button type="submit" form="empresaForm" class="ios-blur-btn ios-blur-btn-primary" id="empresaSubmitBtn">
              <i class="fas fa-plus mr-2" id="empresaSubmitIcon"></i>
              <span class="text-sm font-medium" id="empresaSubmitText">Crear Empresa</span>
            </button>
          </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  /**
   * Create view modal - EXACT STYLE AS COMPANY TYPES
   */
  createViewModal() {
    const modalHTML = `
      <!-- View Details Modal - EXACT COMPANY TYPES STYLE -->
      <div id="viewEmpresaModal" class="ios-modal-backdrop hidden">
        <div class="ios-blur-modal-container flex flex-col w-full max-w-2xl !max-h-[92vh] sm:!max-h-[90vh] overflow-hidden">
          <!-- Modal Header -->
          <div class="ios-blur-header">
            <div class="flex flex-col items-start gap-4 w-full sm:flex-row sm:items-center sm:justify-between relative">
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <i class="fas fa-eye text-white text-xl"></i>
                </div>
                <div>
                  <h3 class="text-2xl font-bold text-white dark:text-white" id="viewEmpresaTitle">Detalles de la Empresa</h3>
                  <p class="text-sm text-white/70 dark:text-gray-300">Información completa de la empresa seleccionada</p>
                </div>
              </div>
              <button type="button" class="ios-blur-btn ios-blur-btn-secondary shrink-0 !p-2 !min-w-0" onclick="empresasModals.closeViewModal()" aria-label="Cerrar modal">
                <i class="fas fa-times text-lg"></i>
              </button>
            </div>
          </div>
          
          <!-- Modal Body -->
          <div class="ios-blur-body flex-1 min-h-0 !max-h-none">
            <div id="viewEmpresaContent">
              <!-- Details will be loaded here -->
            </div>
          </div>
          
          <!-- Modal Footer -->
          <div class="ios-blur-footer flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button type="button" class="ios-blur-btn ios-blur-btn-secondary" onclick="empresasModals.closeViewModal()">
              <i class="fas fa-times mr-2"></i>
              <span class="text-sm font-medium">Cerrar</span>
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  /**
   * Create success modal - EXACT STYLE AS COMPANY TYPES
   */
  createSuccessModal() {
    if (document.getElementById(this.successModalId)) {
      return;
    }
    const modalHTML = `
      <!-- Client Update Success Modal - EXACT COPY FROM COMPANY TYPES -->
      <div id="${this.successModalId}" class="ios-modal-backdrop modal-centered hidden">
        <div class="ios-blur-modal-container flex flex-col w-full max-w-md !max-h-[85vh] overflow-hidden mx-auto" id="updateModalContainer">
          <div class="ios-blur-header text-center">
            <div class="client-update-icon mx-auto mb-4" id="updateModalIcon">
              <i class="fas fa-sync-alt text-4xl text-emerald-400" id="updateModalIconFa"></i>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2" id="empresasUpdateModalTitle">Empresa Actualizada</h3>
          </div>
          <div class="ios-blur-body flex-1 min-h-0 !max-h-none text-center">
            <p class="text-gray-700 dark:text-white/80 text-lg mb-6" id="empresasUpdateModalMessage">
              La empresa se ha actualizado exitosamente.
            </p>
            <button class="ios-blur-btn ios-blur-btn-primary mx-auto" onclick="empresasModals.closeSuccessModal()">
              <i class="fas fa-check mr-2"></i>
              <span class="text-sm font-medium">Aceptar</span>
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Form submission
    const form = document.getElementById('empresaForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    // Toggle modal buttons
    const confirmBtn = document.getElementById('toggleEmpresaConfirm');
    const cancelBtn = document.getElementById('toggleEmpresaCancel');
    
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => this.confirmToggleStatus());
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeToggleModal());
    }

    // Keyboard events
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeActiveModal();
      }
    });

    // Click outside to close
    this.setupOutsideClickClose();
  }

  /**
   * Setup outside click to close modals
   */
  setupOutsideClickClose() {
    const modals = ['toggleEmpresaModal', 'empresaModal', 'viewEmpresaModal'];
    
    modals.forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            this.closeModalById(modalId);
          }
        });
      }
    });
  }

  /**
   * Show toggle status modal
   */
  showToggleModal(empresaId, newStatus) {
    try {
      this.currentToggleEmpresa = { id: empresaId, newStatus };
      
      const modal = document.getElementById('toggleEmpresaModal');
      const icon = document.getElementById('toggleEmpresaIcon');
      const title = document.getElementById('toggleEmpresaTitle');
      const message = document.getElementById('toggleEmpresaMessage');
      
      if (newStatus) {
        // Activating
        icon.className = 'toggle-empresa-icon activate';
        icon.innerHTML = '<i class="fas fa-check-circle"></i>';
        title.textContent = 'Activar Empresa';
        message.textContent = '¿Estás seguro de que quieres activar esta empresa? Podrá acceder al sistema nuevamente.';
      } else {
        // Deactivating
        icon.className = 'toggle-empresa-icon deactivate';
        icon.innerHTML = '<i class="fas fa-times-circle"></i>';
        title.textContent = 'Desactivar Empresa';
        message.textContent = '¿Estás seguro de que quieres desactivar esta empresa? No podrá acceder al sistema.';
      }
      
      this.openModal('toggleEmpresaModal');
      
    } catch (error) {
      //consoleç.error('💥 Error al mostrar modal de toggle:', error);
      this.showNotification('Error al abrir el modal', 'error');
    }
  }

  /**
   * Confirm toggle status
   */
  async confirmToggleStatus() {
    try {
      if (!this.currentToggleEmpresa) return;
      
      const { id, newStatus } = this.currentToggleEmpresa;
      
      //consoleç.log(`🔄 Cambiando estado de empresa ${id} a ${newStatus ? 'activa' : 'inactiva'}`);
      
      const response = await this.apiClient.toggle_empresa_status(id, newStatus);
      const data = await response.json();
      
      if (data.success) {
        this.closeToggleModal();
        this.showSuccessModal(data.message || `Empresa ${newStatus ? 'activada' : 'desactivada'} exitosamente`);
        
        // Reload empresas list
        if (window.empresasMain) {
          setTimeout(() => window.empresasMain.loadEmpresas(), 1000);
        }
      } else {
        this.showNotification('Error: ' + (data.errors?.[0] || 'Error desconocido'), 'error');
      }
      
    } catch (error) {
      //consoleç.error('💥 Error al cambiar estado de empresa:', error);
      this.showNotification('Error de conexión', 'error');
    }
  }

  /**
   * Open create modal
   */
  openCreateModal() {
    try {
      this.currentEditingEmpresa = null;
      
      // Set modal title and button text
      const title = document.getElementById('empresaModalTitle');
      if (title) {
        title.textContent = 'Nueva Empresa';
      }
      const submitText = document.getElementById('empresaSubmitText');
      if (submitText) {
        submitText.textContent = 'Crear Empresa';
      }
      const submitIcon = document.getElementById('empresaSubmitIcon');
      if (submitIcon) {
        submitIcon.className = 'fas fa-plus mr-2';
      }
      
      // Reset form
      this.resetForm();
      
      // Show password field for create
      document.getElementById('passwordGroup').style.display = 'block';
      document.getElementById('empresaPassword').required = true;
      
      // Reload tipos de empresa to ensure they're up to date
      this.loadTiposEmpresa();
      
      // Open modal
      this.openModal('empresaModal');
      
    } catch (error) {
      //consoleç.error('💥 Error al abrir modal de creación:', error);
      this.showNotification('Error al abrir el modal', 'error');
    }
  }

  /**
   * Open edit modal
   */
  async openEditModal(empresaId) {
    try {
      this.currentEditingEmpresa = empresaId;
      
      // Set modal title and button text
      const title = document.getElementById('empresaModalTitle');
      if (title) {
        title.textContent = 'Editar Empresa';
      }
      const submitText = document.getElementById('empresaSubmitText');
      if (submitText) {
        submitText.textContent = 'Actualizar Empresa';
      }
      const submitIcon = document.getElementById('empresaSubmitIcon');
      if (submitIcon) {
        submitIcon.className = 'fas fa-save mr-2';
      }
      
      // Hide password field for edit
      document.getElementById('passwordGroup').style.display = 'none';
      document.getElementById('empresaPassword').required = false;
      
      // Reload tipos de empresa to ensure they're up to date
      await this.loadTiposEmpresa();
      
      // Load empresa data AFTER tipos are loaded
      await this.loadEmpresaDataForEdit(empresaId);
      
      // Open modal
      this.openModal('empresaModal');
      
    } catch (error) {
      //consoleç.error('💥 Error al abrir modal de edición:', error);
      this.showNotification('Error al cargar los datos de la empresa', 'error');
    }
  }

  /**
   * Load empresa data for editing
   */
  async loadEmpresaDataForEdit(empresaId) {
    try {
      //consoleç.log('🔄 Cargando datos de empresa para edición:', empresaId);
      const response = await this.apiClient.get_empresa(empresaId);
      
      //consoleç.log('📡 Respuesta del backend:', {
      //   status: response.status,
      //   statusText: response.statusText,
      //   ok: response.ok
      // });
      
      const data = await response.json();
      //consoleç.log('📦 Datos recibidos del backend:', data);
      
      if (data.success && data.data) {
        //console.log('✅ Datos de empresa válidos, populando formulario...');
        this.populateFormWithEmpresaData(data.data);
      } else {
        //console.error('❌ Respuesta del backend no válida:', data);
        throw new Error(data.errors?.[0] || 'Error al cargar datos');
      }
      
    } catch (error) {
      //console.error('💥 Error al cargar datos de empresa:', error);
      this.showNotification('Error al cargar los datos de la empresa desde el servidor', 'error');
      this.loadDummyDataIntoForm();
    }
  }

  /**
   * Populate form with empresa data
   */
  populateFormWithEmpresaData(empresa) {
    //console.log('📝 Populando formulario con datos de empresa:', empresa);
    
    document.getElementById('empresaNombre').value = empresa.nombre || '';
    document.getElementById('empresaUsername').value = empresa.username || '';
    document.getElementById('empresaEmail').value = empresa.email || '';
    document.getElementById('empresaUbicacion').value = empresa.ubicacion || '';
    document.getElementById('empresaDescripcion').value = empresa.descripcion || '';
    
    // Load tipo de empresa with better handling
    const tipoSelect = document.getElementById('empresaTipo');
    if (tipoSelect) {
      // Check what tipo values are available in the empresa object
      // Backend returns 'tipo_empresa_id' as the ObjectId string
      const empresaTipoId = empresa.tipo_empresa_id || empresa.tipo || empresa.tipo_empresa || empresa.tipo_id;
      //console.log('🏷️ Tipo de empresa ID encontrado:', empresaTipoId);
      //console.log('🔍 Opciones disponibles en select:', Array.from(tipoSelect.options).map(opt => ({ value: opt.value, text: opt.text })));
      
      if (empresaTipoId) {
        // First try to set the value directly (this should match the option value which is the tipo ID)
        tipoSelect.value = empresaTipoId;
        
        // Check if the option exists
        const optionExists = Array.from(tipoSelect.options).some(option => option.value === empresaTipoId);
        //console.log('✅ Opción existe en select:', optionExists);
        
        if (!optionExists) {
          // If no option exists, this means we need to reload tipos de empresa
          //console.log('⚠️ El tipo de empresa no existe en las opciones disponibles. Recargando tipos...');
          this.loadTiposEmpresa().then(() => {
            // After reloading, try to set the value again
            setTimeout(() => {
              const optionExistsAfterReload = Array.from(tipoSelect.options).some(option => option.value === empresaTipoId);
              if (optionExistsAfterReload) {
                tipoSelect.value = empresaTipoId;
                //console.log('✅ Tipo de empresa seleccionado después de recargar:', empresaTipoId);
              } else {
                //console.log('⚠️ El tipo de empresa sigue sin existir después de recargar. Puede estar inactivo.');
                // Create a placeholder option to show the current value
                const newOption = document.createElement('option');
                newOption.value = empresaTipoId;
                newOption.text = `Tipo no disponible (${empresaTipoId})`;
                newOption.style.color = '#999';
                tipoSelect.add(newOption);
                tipoSelect.value = empresaTipoId;
                //console.log('➕ Opción placeholder creada:', empresaTipoId);
              }
            }, 500);
          });
        } else {
          //console.log('✅ Tipo de empresa seleccionado:', empresaTipoId);
        }
      } else {
        //console.log('⚠️ No se encontró tipo de empresa en los datos');
      }
    } else {
      //console.error('❌ Select de tipo de empresa no encontrado');
    }
    
    // Load sedes
    this.sedes = empresa.sedes || ['Principal'];
    this.renderSedes();
    
    // Load roles with new structure support
    this.roles = this.normalizeRoles(empresa.roles);
    this.renderRoles();
  }

  /**
   * Load dummy data into form (fallback)
   */
  loadDummyDataIntoForm() {
    document.getElementById('empresaNombre').value = 'Empresa sin nombre';
    document.getElementById('empresaUsername').value = 'empresa_usuario';
    document.getElementById('empresaEmail').value = 'contacto@empresa.com';
    document.getElementById('empresaUbicacion').value = 'Ciudad, País';
    document.getElementById('empresaDescripcion').value = 'Descripción de la empresa';
    
    this.sedes = ['Principal'];
    this.renderSedes();
    
    this.roles = [{ nombre: 'Empleado', is_creator: false, is_alert_manager: false }];
    this.renderRoles();
  }

  /**
   * Open view modal
   */
  async openViewModal(empresaId) {
    try {
      this.currentViewingEmpresa = empresaId;
      
      // Load empresa data
      const response = await this.apiClient.get_empresa(empresaId);
      const data = await response.json();
      
      if (data.success && data.data) {
        this.populateViewModal(data.data);
        
        this.openModal('viewEmpresaModal');
      } else {
        throw new Error(data.errors?.[0] || 'Error al cargar datos');
      }
      
    } catch (error) {
      //console.error('💥 Error al cargar detalles de empresa:', error);
      this.showNotification('Error al cargar los detalles de la empresa', 'error');
    }
  }

  /**
   * Populate view modal with empresa data
   */
  populateViewModal(empresa) {
    const iniciales = this.getIniciales(empresa.nombre);
    
    // Find the tipo name from the tipo_empresa_id
    let tipoNombre = 'N/A';
    if (empresa.tipo_empresa_id && window.empresasMain && window.empresasMain.tiposEmpresa) {
      const tipoEncontrado = window.empresasMain.tiposEmpresa.find(tipo => tipo._id === empresa.tipo_empresa_id);
      if (tipoEncontrado) {
        tipoNombre = tipoEncontrado.nombre;
      }
    } else if (empresa.tipo || empresa.tipo_empresa) {
      // Fallback to direct tipo field if available
      tipoNombre = empresa.tipo || empresa.tipo_empresa;
    }
    
    const roles = this.normalizeRoles(empresa.roles);

    const content = `
      <div class="space-y-4">
        <div class="flex items-center space-x-3">
          <div class="flex-shrink-0">
            <i class="fas fa-building fa-2x text-purple-600"></i>
          </div>
          <div>
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white">${empresa.nombre || 'Sin nombre'}</h4>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Ubicación: ${empresa.ubicacion || 'Sin ubicación'}</p>
          </div>
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-300">
          <p class="mb-1">Usuario: ${empresa.username || 'N/A'}</p>
          <p class="mb-1">Email: ${empresa.email || 'N/A'}</p>
          <p class="mb-1">Tipo: ${tipoNombre}</p>
          <p class="mb-1">Estado: ${empresa.activa !== false ? 'Activa' : 'Inactiva'}</p>
          <p class="mb-1">Creada: ${this.formatDate(empresa.fecha_creacion)}</p>
          <p>Descripción: ${empresa.descripcion || 'Sin descripción'}</p>
        </div>
        <div class="text-sm">
          <h5 class="font-semibold text-gray-900 dark:text-white mb-1">Sedes</h5>
          <div class="flex flex-wrap gap-2">
            ${empresa.sedes && empresa.sedes.length > 0 ? 
              empresa.sedes.map(sede => 
                `<span class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">${sede}</span>`
              ).join('') : 
              '<span class="text-gray-500 dark:text-gray-400">Sin sedes</span>'
            }
          </div>
        </div>
        <div class="text-sm">
          <h5 class="font-semibold text-gray-900 dark:text-white mb-1">Roles</h5>
          <div class="flex flex-wrap gap-2">
            ${roles.length > 0 ? 
              roles.map(rol => 
                `<span class="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs font-medium">
                  ${rol.nombre || 'Sin nombre'}${rol.is_creator ? ' • Genera alertas' : ''}${rol.is_alert_manager ? ' • Manager alertas' : ''}
                </span>`
              ).join('') : 
              '<span class="text-gray-500 dark:text-gray-400">Sin roles definidos</span>'
            }
          </div>
        </div>
      </div>
    `;

    document.getElementById('viewEmpresaContent').innerHTML = content;
  }

  /**
   * Handle form submission
   */
  async handleFormSubmit(e) {
    e.preventDefault();
    
    try {
      const formData = this.buildFormData();

      // Validar campos obligatorios
      if (!formData.nombre) {
        this.showNotification('El nombre de la empresa es obligatorio', 'error');
        return;
      }

      if (!formData.username) {
        this.showNotification('El usuario de la empresa es obligatorio', 'error');
        return;
      }

      if (!formData.email) {
        this.showNotification('El correo de la empresa es obligatorio', 'error');
        return;
      }

      if (!formData.ubicacion) {
        this.showNotification('La ubicación de la empresa es obligatoria', 'error');
        return;
      }

      if (!formData.descripcion) {
        this.showNotification('La descripción de la empresa es obligatoria', 'error');
        return;
      }

      if (!formData.tipo_empresa_id) {
        this.showNotification('Debe seleccionar un tipo de empresa', 'error');
        return;
      }

      if (!this.currentEditingEmpresa && !formData.password) {
        this.showNotification('La contraseña es obligatoria', 'error');
        return;
      }

      // Validate that at least one sede and one role are provided
      if (!formData.sedes || formData.sedes.length === 0) {
        this.showNotification('Error: Debe agregar al menos una sede para la empresa', 'error');
        return;
      }
      
      if (!formData.roles || formData.roles.length === 0) {
        this.showNotification('Error: Debe agregar al menos un rol para la empresa', 'error');
        return;
      }
      
      // Validate that sedes are not empty
      const sedesVacias = formData.sedes.filter(sede => !sede || sede.trim() === '');
      if (sedesVacias.length > 0) {
        this.showNotification('Error: Las sedes no pueden estar vacías', 'error');
        return;
      }
      
      // Validate that roles are not empty
      // Validate for duplicate sedes
      const sedesUnicas = [...new Set(formData.sedes.map(sede => sede.trim().toLowerCase()))];
      if (sedesUnicas.length !== formData.sedes.length) {
        this.showNotification('Error: No puede haber sedes duplicadas', 'error');
        return;
      }
      
      // Validate for duplicate roles
      const rolesUnicos = [...new Set(formData.roles.map(rol => rol.nombre.toLowerCase()))];
      if (rolesUnicos.length !== formData.roles.length) {
        this.showNotification('Error: No puede haber roles duplicados', 'error');
        return;
      }
      
      if (this.currentEditingEmpresa) {
        await this.updateEmpresa(this.currentEditingEmpresa, formData);
      } else {
        await this.createEmpresa(formData);
      }
      
    } catch (error) {
      //console.error('💥 Error al procesar formulario:', error);
      this.showNotification('Error al procesar el formulario', 'error');
    }
  }

  /**
   * Build form data object
   */
  buildFormData() {
    const formData = {
      nombre: document.getElementById('empresaNombre').value.trim(),
      username: document.getElementById('empresaUsername').value.trim(),
      email: document.getElementById('empresaEmail').value.trim(),
      ubicacion: document.getElementById('empresaUbicacion').value.trim(),
      descripcion: document.getElementById('empresaDescripcion').value.trim(),
      tipo_empresa_id: document.getElementById('empresaTipo').value.trim(), // Correcting this field
      sedes: this.sedes.filter(sede => sede.trim() !== ''),
      roles: this.roles
        .filter(rol => rol && typeof rol.nombre === 'string')
        .map(rol => ({
          nombre: rol.nombre.trim(),
          is_creator: Boolean(rol.is_creator),
          is_alert_manager: Boolean(rol.is_alert_manager)
        }))
        .filter(rol => rol.nombre !== '')
    };
    
    // Add password for create
    if (!this.currentEditingEmpresa) {
      formData.password = document.getElementById('empresaPassword').value;
    }
    
    return formData;
  }

  /**
   * Create empresa
   */
  async createEmpresa(formData) {
    try {
      const response = await this.apiClient.create_empresa(formData);
      const data = await response.json();
      
      if (data.success) {
        this.closeCrudModal();
        this.showSuccessModal('Empresa creada exitosamente');
        
        // Reload empresas list
        if (window.empresasMain) {
          setTimeout(() => window.empresasMain.loadEmpresas(), 1000);
        }
      } else {
        this.showNotification('Error: ' + (data.errors?.[0] || 'Error desconocido'), 'error');
      }
      
    } catch (error) {
      //console.error('💥 Error al crear empresa:', error);
      this.showNotification('Error de conexión', 'error');
    }
  }

  /**
   * Update empresa
   */
  async updateEmpresa(empresaId, formData) {
    try {
      const response = await this.apiClient.update_empresa(empresaId, formData);
      const data = await response.json();
      
      if (data.success) {
        this.closeCrudModal();
        this.showSuccessModal('Empresa actualizada exitosamente');
        
        // Reload empresas list
        if (window.empresasMain) {
          setTimeout(() => window.empresasMain.loadEmpresas(), 1000);
        }
      } else {
        this.showNotification('Error: ' + (data.errors?.[0] || 'Error desconocido'), 'error');
      }
      
    } catch (error) {
      //console.error('💥 Error al actualizar empresa:', error);
      this.showNotification('Error de conexión', 'error');
    }
  }

  /**
   * Sede management
   */
  addSede() {
    this.sedes.push('');
    this.renderSedes();
    
    // Focus on the new input
    setTimeout(() => {
      const inputs = document.querySelectorAll('.empresa-sede-input');
      const lastInput = inputs[inputs.length - 1];
      if (lastInput) lastInput.focus();
    }, 100);
  }

  removeSede(index) {
    this.sedes.splice(index, 1);
    this.renderSedes();
  }

  updateSede(index, value) {
    this.sedes[index] = value;
  }

  renderSedes() {
    const container = document.getElementById('sedesList');
    container.innerHTML = '';
    
    this.sedes.forEach((sede, index) => {
      const sedeItem = document.createElement('div');
      sedeItem.className = 'empresa-sede-item';
      sedeItem.innerHTML = `
        <div class="flex items-center gap-2">
          <input type="text" class="ios-blur-input flex-1 min-w-0" value="${sede}" 
                 placeholder="Nombre de la sede" 
                 onchange="empresasModals.updateSede(${index}, this.value)">
          <button type="button" class="ios-blur-btn ios-blur-btn-secondary !p-2 !min-w-0 flex-shrink-0" onclick="empresasModals.removeSede(${index})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      container.appendChild(sedeItem);
    });
  }
  
  /**
   * Rol management
   */
  addRol() {
    this.roles.push({ nombre: '', is_creator: false, is_alert_manager: false });
    this.renderRoles();
    
    // Focus on the new input
    setTimeout(() => {
      const inputs = document.querySelectorAll('.empresa-rol-input');
      const lastInput = inputs[inputs.length - 1];
      if (lastInput) lastInput.focus();
    }, 100);
  }

  removeRol(index) {
    this.roles.splice(index, 1);
    this.renderRoles();
  }

  updateRolNombre(index, value) {
    if (!this.roles[index]) return;
    this.roles[index].nombre = value;
  }

  toggleRolCreator(index, isChecked) {
    if (!this.roles[index]) return;
    this.roles[index].is_creator = Boolean(isChecked);
  }

  toggleRolAlertManager(index, isChecked) {
    if (!this.roles[index]) return;
    this.roles[index].is_alert_manager = Boolean(isChecked);
  }

  renderRoles() {
    const container = document.getElementById('rolesList');
    container.innerHTML = '';

    if (!Array.isArray(this.roles)) {
      this.roles = [];
    }

    if (this.roles.length === 0) {
      this.roles.push({ nombre: '', is_creator: false, is_alert_manager: false });
    }

    this.roles.forEach((rol, index) => {
      const rolItem = document.createElement('div');
      rolItem.className = 'empresa-rol-item flex flex-col sm:flex-row sm:items-center gap-2';
      rolItem.innerHTML = `
        <div class="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
          <input type="text" class="ios-blur-input empresa-rol-input flex-1 min-w-0" value="${rol.nombre || ''}" 
                 placeholder="Nombre del rol" 
                 onchange="empresasModals.updateRolNombre(${index}, this.value)">
          <label class="inline-flex items-center gap-2 text-xs font-medium text-white/80 dark:text-gray-300">
            <input type="checkbox" class="empresa-rol-checkbox" ${rol.is_creator ? 'checked' : ''}
                   onchange="empresasModals.toggleRolCreator(${index}, this.checked)">
            Puede generar alertas
          </label>
          <label class="inline-flex items-center gap-2 text-xs font-medium text-white/80 dark:text-gray-300">
            <input type="checkbox" class="empresa-rol-checkbox" ${rol.is_alert_manager ? 'checked' : ''}
                   onchange="empresasModals.toggleRolAlertManager(${index}, this.checked)">
            Manager de alertas
          </label>
        </div>
        <button type="button" class="ios-blur-btn ios-blur-btn-secondary !p-2 !min-w-0 flex-shrink-0" onclick="empresasModals.removeRol(${index})">
          <i class="fas fa-trash"></i>
        </button>
      `;
      container.appendChild(rolItem);
    });
  }

  normalizeRoles(rawRoles) {
    if (!Array.isArray(rawRoles)) {
      return [];
    }

    return rawRoles
      .map((rol) => {
        if (typeof rol === 'string') {
          return {
            nombre: rol.trim(),
            is_creator: false,
            is_alert_manager: false
          };
        }

        if (rol && typeof rol === 'object') {
          const nombre = (rol.nombre || rol.name || '').toString().trim();
          const isCreator = rol.is_creator ?? rol.isCreator ?? rol.creates_alerts ?? rol.crea_alertas;
          const isAlertManager = rol.is_alert_manager ?? rol.isAlertManager ?? rol.alert_manager;
          return {
            nombre,
            is_creator: Boolean(isCreator),
            is_alert_manager: Boolean(isAlertManager)
          };
        }

        return { nombre: '', is_creator: false, is_alert_manager: false };
      })
      .filter((rol) => rol.nombre !== '' || rol.is_creator === true || rol.is_alert_manager === true);
  }

  // ===== GESTIÓN UNIFICADA DE MODALES CON MODALSCROLLMANAGER =====
  
  /**
   * Abrir modal - USANDO MODALSCROLLMANAGER
   */
  openModal(modalId) {
    //console.log('🟢 Abriendo modal empresa:', modalId);
    
    // Usar nuestro ModalScrollManager siempre
    this.modalManager.openModal(modalId, { focusTrap: true });
    
    // Focus en el primer input después de abrir
    setTimeout(() => {
      const modal = document.getElementById(modalId);
      if (modal) {
        const firstInput = modal.querySelector('input:not([type="hidden"]), textarea, select');
        if (firstInput && firstInput.focus) {
          firstInput.focus();
        }
      }
    }, 150);
    
    //console.log('✅ Modal empresa abierto con ModalScrollManager:', modalId);
  }

  /**
   * Cerrar modal - USANDO MODALSCROLLMANAGER
   */
  closeModal(modalId) {
    //console.log('🔴 Cerrando modal empresa:', modalId);
    
    // Usar nuestro ModalScrollManager siempre
    this.modalManager.closeModal(modalId);
    
    // Limpiar datos del modal
    this.resetModalData(modalId);
    
    //console.log('✅ Modal empresa cerrado con ModalScrollManager:', modalId);
  }

  /**
   * Resetear datos del modal
   */
  resetModalData(modalId) {
    switch(modalId) {
      case 'empresaModal':
        this.currentEditingEmpresa = null;
        this.resetForm();
        break;
      case 'viewEmpresaModal':
        this.currentViewingEmpresa = null;
        break;
      case 'toggleEmpresaModal':
        this.currentToggleEmpresa = null;
        break;
      case 'empresasUpdateModal':
        // No specific data to reset for success modal
        break;
    }
  }

  closeActiveModal() {
    if (this.modalManager.hasOpenModals()) {
      this.modalManager.closeAllModals();
    }
  }

  closeModalById(modalId) {
    this.closeModal(modalId);
  }

  closeCrudModal() {
    this.closeModal('empresaModal');
  }

  closeViewModal() {
    this.closeModal('viewEmpresaModal');
  }

  closeToggleModal() {
    this.closeModal('toggleEmpresaModal');
  }

  closeSuccessModal() {
    this.closeModal(this.successModalId);
  }

  /**
   * Show success modal
   */
  showSuccessModal(message) {
    // Set dynamic title based on message
    const modal = document.getElementById(this.successModalId);
    const title = modal ? modal.querySelector('#empresasUpdateModalTitle') : null;
    const messageEl = modal ? modal.querySelector('#empresasUpdateModalMessage') : null;
    
    if (title && message.includes('creada')) {
      title.textContent = '¡Empresa Creada!';
    } else if (title && message.includes('actualizada')) {
      title.textContent = '¡Empresa Actualizada!';
    } else if (title && message.includes('activada')) {
      title.textContent = '¡Empresa Activada!';
    } else if (title && message.includes('desactivada')) {
      title.textContent = '¡Empresa Desactivada!';
    } else if (title) {
      title.textContent = '¡Operación Exitosa!';
    }
    
    if (messageEl) {
      messageEl.textContent = message;
    }
    this.openModal(this.successModalId);
  }

  /**
   * Reset form
   */
  resetForm() {
    const form = document.getElementById('empresaForm');
    if (form) {
      form.reset();
    }
    
    this.sedes = ['Principal'];
    this.renderSedes();
    
    this.roles = [{ nombre: 'Empleado', is_creator: false, is_alert_manager: false }];
    this.renderRoles();
  }

  /**
   * Utility functions
   */
  getIniciales(nombre) {
    if (!nombre) return 'XX';
    const words = nombre.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    if (window.empresasMain && window.empresasMain.showEnhancedNotification) {
      window.empresasMain.showEnhancedNotification(message, type);
    } else {
      // Fallback notification with high z-index
      this.showFallbackNotification(message, type);
    }
  }

  /**
   * Fallback notification with high z-index
   */
  showFallbackNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.fallback-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = 'fallback-notification fixed top-4 right-4 max-w-sm w-full';
    notification.style.zIndex = '9999'; // Muy alto para estar siempre adelante
    
    let iconClass, bgClass;
    if (type === 'error') {
      iconClass = 'fas fa-exclamation-circle';
      bgClass = 'bg-red-500';
    } else {
      iconClass = 'fas fa-check-circle';
      bgClass = 'bg-green-500';
    }
    
    notification.innerHTML = `
      <div class="${bgClass} text-white p-4 rounded-lg shadow-xl">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <i class="${iconClass} text-xl"></i>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium">${message}</p>
          </div>
          <div class="ml-auto pl-3">
            <button onclick="this.closest('.fallback-notification').remove()" class="text-white hover:text-gray-200 transition-colors">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 4000);
  }

  /**
   * TOGGLE MODAL FUNCTIONS - SAME AS HARDWARE/COMPANY TYPES
   */
  
  /**
   * Show toggle modal - SAME STYLE AS HARDWARE/COMPANY TYPES
   */
  showToggleModal(empresaId, currentStatus, empresaName) {
    //console.log('🔄 Opening toggle modal for empresa:', empresaId, 'current status:', currentStatus);
    
    const newStatus = !currentStatus;
    const action = newStatus ? 'activar' : 'desactivar';
    
    // Store toggle data
    this.currentToggleEmpresa = {
      id: empresaId,
      newStatus: newStatus,
      name: empresaName
    };
    
    // Get modal elements
    const modal = document.getElementById('toggleEmpresaModal');
    const container = modal ? modal.querySelector('#toggleModalContainer') : null;
    const icon = modal ? modal.querySelector('#toggleModalIcon') : null;
    const iconFa = modal ? modal.querySelector('#toggleModalIconFa') : null;
    const title = modal ? modal.querySelector('#toggleModalTitle') : null;
    const message = modal ? modal.querySelector('#toggleModalMessage') : null;
    const confirmText = modal ? modal.querySelector('#toggleConfirmText') : null;
    const confirmIcon = modal ? modal.querySelector('#toggleConfirmIcon') : null;
    
    if (!modal || !container || !title || !message) {
      //console.error('❌ Toggle modal elements missing!');
      // Fallback to simple confirm
      if (confirm(`¿Estás seguro de que quieres ${action} esta empresa?`)) {
        this.confirmToggle();
      }
      return;
    }
    
    // Configure modal content
    if (newStatus) {
      icon.className = 'toggle-modal-icon activate mx-auto mb-4';
      if (iconFa) iconFa.className = 'fas fa-play-circle text-4xl';
      title.textContent = 'Activar Empresa';
      message.textContent = `¿Estás seguro de que quieres activar la empresa "${empresaName}"?`;
      confirmText.textContent = 'Activar';
      if (confirmIcon) confirmIcon.className = 'fas fa-play mr-2';
    } else {
      icon.className = 'toggle-modal-icon deactivate mx-auto mb-4';
      if (iconFa) iconFa.className = 'fas fa-pause-circle text-4xl';
      title.textContent = 'Desactivar Empresa';
      message.textContent = `¿Estás seguro de que quieres desactivar la empresa "${empresaName}"?`;
      confirmText.textContent = 'Desactivar';
      if (confirmIcon) confirmIcon.className = 'fas fa-pause mr-2';
    }
    
    // Show modal using modalManager
    if (window.modalManager) {
      window.modalManager.openModal('toggleEmpresaModal');
    } else {
      // Fallback
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
      document.body.classList.add('modal-open');
    }
    
    //console.log('✅ Toggle modal should now be visible');
    
    if (container) {
      container.style.transform = '';
      container.style.opacity = '';
    }
  }

  /**
   * Close toggle modal - SAME AS HARDWARE/COMPANY TYPES
   */
  closeToggleModal() {
    //console.log('🔄 Closing toggle modal');
  
    const modal = document.getElementById('toggleEmpresaModal');
    const container = modal ? modal.querySelector('#toggleModalContainer') : null;
    const confirmBtn = modal ? modal.querySelector('#toggleConfirmBtn') : null;
  
    if (!modal) {
      //console.error('❌ Modal not found when trying to close');
      return;
    }
  
    const resetAndHideToggleModal = () => {
      // Use modalManager for consistent closing
      if (window.modalManager) {
        window.modalManager.closeModal('toggleEmpresaModal');
      } else {
        // Fallback
        modal.classList.add('hidden');
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
      }
  
      // Reset button state
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="fas fa-check" id="toggleConfirmIcon"></i> <span id="toggleConfirmText">Confirmar</span>';
      }
  
      // Reset data
      this.currentToggleEmpresa = null;
  
      //console.log('✅ Toggle modal closed and fully reset');
    };
  
    resetAndHideToggleModal();
  }
  
  /**
   * Confirm toggle - SAME AS HARDWARE/COMPANY TYPES
   */
  async confirmToggle() {
    if (this.currentToggleEmpresa && this.currentToggleEmpresa.newStatus !== null) {
      // Show loading state
      const modal = document.getElementById('toggleEmpresaModal');
      const confirmBtn = modal ? modal.querySelector('#toggleConfirmBtn') : null;
      const originalContent = confirmBtn ? confirmBtn.innerHTML : '';
  
      if (confirmBtn) {
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        confirmBtn.disabled = true;
      }
  
      try {
        const { id, newStatus } = this.currentToggleEmpresa;
  
        //console.log(`🔄 Executing toggle for empresa ${id} to ${newStatus ? 'active' : 'inactive'}`);
  
        const response = await this.apiClient.toggle_empresa_status(id, newStatus);
        const data = await response.json();
  
        if (data.success) {
          this.closeToggleModal();
          this.showSuccessModal(data.message || `Empresa ${newStatus ? 'activada' : 'desactivada'} exitosamente`);
  
          // Reload empresas list
          if (window.empresasMain) {
            setTimeout(() => window.empresasMain.loadEmpresas(), 1000);
          }
        } else {
          if (confirmBtn) {
            confirmBtn.innerHTML = originalContent;
            confirmBtn.disabled = false;
          }
          this.showNotification('Error: ' + (data.errors?.[0] || 'Error desconocido'), 'error');
        }
  
      } catch (error) {
        //console.error('💥 Error al ejecutar toggle:', error);
        if (confirmBtn) {
          confirmBtn.innerHTML = originalContent;
          confirmBtn.disabled = false;
        }
        this.showNotification('Error de conexión', 'error');
      }
    }
  }

  /**
   * Load tipos de empresa
   */
  async loadTiposEmpresa() {
    try {
      //console.log('🔄 Cargando tipos de empresa...');
      const response = await this.apiClient.get_tipos_empresa_activos();
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      //console.log('📊 Respuesta tipos de empresa:', data);

      if (data.success && data.data && Array.isArray(data.data)) {
        const tipoSelect = document.getElementById('empresaTipo');
        if (!tipoSelect) {
          //console.error('❌ Select de tipos de empresa no encontrado');
          return;
        }
        
        // Save current selection if any
        const currentValue = tipoSelect.value;
        
        // Clear the select and add placeholder
        tipoSelect.innerHTML = '<option value="">Seleccionar tipo...</option>';
        
        // Store tipos globally for reference in other functions
        if (!window.empresasMain) {
          window.empresasMain = {};
        }
        window.empresasMain.tiposEmpresa = data.data;
        
        // Populate select with ID as value and nombre as display text
        data.data.forEach(tipo => {
          const option = document.createElement('option');
          option.value = tipo._id;  // Use ID as value for backend
          option.text = tipo.nombre;  // Show name to user
          tipoSelect.add(option);
        });
        
        // Restore selection if it was valid
        if (currentValue) {
          const foundTipo = data.data.find(t => t._id === currentValue);
          if (foundTipo) {
            tipoSelect.value = currentValue;
          }
        }
        
        //console.log(`✅ ${data.data.length} tipos de empresa cargados`);
        //console.log('📋 Tipos cargados:', data.data.map(t => `${t.nombre} (${t._id})`));
      } else {
        throw new Error(data.message || data.error || 'Respuesta inválida del servidor o datos vacíos');
      }
    } catch (error) {
      //console.error('💥 Error al cargar tipos de empresa:', error);
      
      // Provide fallback options with fake IDs
      const tipoSelect = document.getElementById('empresaTipo');
      if (tipoSelect) {
        tipoSelect.innerHTML = `
          <option value="">Seleccionar tipo...</option>
          <option value="fallback-corp">Corporación</option>
          <option value="fallback-pyme">PYME</option>
          <option value="fallback-startup">Startup</option>
          <option value="fallback-ong">ONG</option>
          <option value="fallback-gov">Gubernamental</option>
        `;
        
        // Store fallback data globally
        if (!window.empresasMain) {
          window.empresasMain = {};
        }
        window.empresasMain.tiposEmpresa = [
          { _id: 'fallback-corp', nombre: 'Corporación' },
          { _id: 'fallback-pyme', nombre: 'PYME' },
          { _id: 'fallback-startup', nombre: 'Startup' },
          { _id: 'fallback-ong', nombre: 'ONG' },
          { _id: 'fallback-gov', nombre: 'Gubernamental' }
        ];
      }
      
      this.showNotification('Error al cargar tipos de empresa. Se han cargado opciones predeterminadas.', 'warning');
    }
  }
}

const initEmpresasModals = () => {
  if (window.empresasModals) {
    return window.empresasModals;
  }
  window.empresasModals = new EmpresasModals();
  return window.empresasModals;
};

window.initEmpresasModals = initEmpresasModals;

// Backward compatibility functions
window.openCreateEmpresaModal = () => window.empresasModals?.openCreateModal();
window.openEditEmpresaModal = (id) => window.empresasModals?.openEditModal(id);
window.openViewEmpresaModal = (id) => window.empresasModals?.openViewModal(id);
window.toggleEmpresaStatus = (id, activa) => window.empresasModals?.showToggleModal(id, activa);

if (!window.ADMIN_SPA_MANUAL_INIT) {
  initEmpresasModals();
}

//console.log('🏢 Empresas modals module loaded');
