// Posts management functionality
function renderPostsList(data) {
    const content = `
        <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2"><i class="bi bi-file-text me-2"></i>Post</h1>
            <div class="btn-toolbar mb-2 mb-md-0">
                <div class="btn-group me-2">
                    <button type="button" class="btn btn-sm btn-outline-secondary" onclick="loadPosts()">
                        <i class="bi bi-arrow-clockwise me-1"></i>Aggiorna
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="exportPosts()">
                        <i class="bi bi-download me-1"></i>Esporta
                    </button>
                </div>
                <button type="button" class="btn btn-primary btn-sm" onclick="createPost()">
                    <i class="bi bi-plus me-1"></i>Nuovo Post
                </button>
            </div>
        </div>

        <!-- Filters -->
        <div class="card mb-4">
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-3">
                        <label class="form-label">Stato</label>
                        <select class="form-select" id="statusFilter" onchange="filterPosts()">
                            <option value="">Tutti gli stati</option>
                            <option value="published">Pubblicato</option>
                            <option value="draft">Bozza</option>
                            <option value="scheduled">Programmato</option>
                            <option value="archived">Archiviato</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Servizio</label>
                        <select class="form-select" id="serviceFilter" onchange="filterPosts()">
                            <option value="">Tutti i servizi</option>
                            <option value="assistenza-it">Assistenza IT</option>
                            <option value="sicurezza-informatica">Sicurezza Informatica</option>
                            <option value="cloud-storage">Cloud Storage</option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Cerca</label>
                        <input type="text" class="form-control" id="searchInput" placeholder="Cerca nei titoli..." oninput="filterPosts()">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">&nbsp;</label>
                        <div class="d-grid">
                            <button class="btn btn-outline-secondary" onclick="clearFilters()">
                                <i class="bi bi-x-circle me-1"></i>Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Bulk Actions -->
        <div class="card mb-4" id="bulkActionsCard" style="display: none;">
            <div class="card-body bg-light">
                <div class="d-flex align-items-center">
                    <span class="me-3">
                        <span id="selectedCount">0</span> post selezionati
                    </span>
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-sm btn-success" onclick="bulkAction('publish')">
                            <i class="bi bi-check-circle me-1"></i>Pubblica
                        </button>
                        <button type="button" class="btn btn-sm btn-warning" onclick="bulkAction('draft')">
                            <i class="bi bi-file-text me-1"></i>Bozza
                        </button>
                        <button type="button" class="btn btn-sm btn-secondary" onclick="bulkAction('archive')">
                            <i class="bi bi-archive me-1"></i>Archivia
                        </button>
                        ${authManager.user.role === 'admin' ? `
                        <button type="button" class="btn btn-sm btn-danger" onclick="bulkAction('delete')">
                            <i class="bi bi-trash me-1"></i>Elimina
                        </button>
                        ` : ''}
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-secondary ms-auto" onclick="clearSelection()">
                        <i class="bi bi-x-circle me-1"></i>Deseleziona
                    </button>
                </div>
            </div>
        </div>

        <!-- Posts Table -->
        <div class="card">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th width="30">
                                    <input type="checkbox" class="form-check-input" id="selectAll" onchange="toggleSelectAll()">
                                </th>
                                <th>Titolo</th>
                                <th width="100">Stato</th>
                                <th width="120">Servizio</th>
                                <th width="100">Autore</th>
                                <th width="80">Views</th>
                                <th width="120">Data</th>
                                <th width="100">Azioni</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${renderPostsTableRows(data.posts)}
                        </tbody>
                    </table>
                </div>

                ${data.pagination ? renderPagination(data.pagination, 'loadPosts') : ''}
            </div>
        </div>
    `;

    document.getElementById('mainContent').innerHTML = content;
    
    // Setup search debounce
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.oninput = debounce(filterPosts, 300);
    }
}

function renderPostsTableRows(posts) {
    if (posts.length === 0) {
        return '<tr><td colspan="8" class="text-center py-4 text-muted">Nessun post trovato</td></tr>';
    }

    return posts.map(post => `
        <tr>
            <td>
                <input type="checkbox" class="form-check-input post-checkbox" value="${post.id}" onchange="updateSelection()">
            </td>
            <td>
                <div>
                    <a href="#" onclick="editPost(${post.id})" class="text-decoration-none fw-medium">
                        ${post.title}
                    </a>
                    ${post.is_featured ? '<i class="bi bi-star-fill text-warning ms-2" title="In evidenza"></i>' : ''}
                    ${post.excerpt ? `<br><small class="text-muted">${post.excerpt.substring(0, 80)}...</small>` : ''}
                </div>
            </td>
            <td>${getStatusBadge(post.status)}</td>
            <td>${post.service_category ? getServiceBadge(post.service_category) : '-'}</td>
            <td>
                <small>${post.author_name || '-'}</small>
            </td>
            <td>
                <span class="badge bg-light text-dark">${formatNumber(post.view_count)}</span>
            </td>
            <td>
                <small>${formatDate(post.published_at || post.created_at)}</small>
                ${post.scheduled_for ? `<br><small class="text-warning">Programmato: ${formatDate(post.scheduled_for, true)}</small>` : ''}
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary" onclick="editPost(${post.id})" title="Modifica">
                        <i class="bi bi-pencil"></i>
                    </button>
                    ${post.status === 'draft' || post.status === 'scheduled' ? `
                    <button class="btn btn-sm btn-outline-success" onclick="publishPost(${post.id})" title="Pubblica">
                        <i class="bi bi-check-circle"></i>
                    </button>
                    ` : ''}
                    ${post.status === 'published' && ['admin', 'editor'].includes(authManager.user.role) ? `
                    <button class="btn btn-sm btn-outline-warning" onclick="unpublishPost(${post.id})" title="Rimuovi pubblicazione">
                        <i class="bi bi-eye-slash"></i>
                    </button>
                    ` : ''}
                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" title="Altro">
                        <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="#" onclick="duplicatePost(${post.id})">
                            <i class="bi bi-files me-2"></i>Duplica
                        </a></li>
                        <li><a class="dropdown-item" href="#" onclick="viewPostAnalytics(${post.id})">
                            <i class="bi bi-graph-up me-2"></i>Analytics
                        </a></li>
                        <li><a class="dropdown-item" href="/public/posts/${post.slug}" target="_blank">
                            <i class="bi bi-eye me-2"></i>Anteprima
                        </a></li>
                        <li><hr class="dropdown-divider"></li>
                        ${['admin', 'editor'].includes(authManager.user.role) ? `
                        <li><a class="dropdown-item text-danger" href="#" onclick="deletePost(${post.id})">
                            <i class="bi bi-trash me-2"></i>Elimina
                        </a></li>
                        ` : ''}
                    </ul>
                </div>
            </td>
        </tr>
    `).join('');
}

function createPost() {
    showPostEditor();
}

function editPost(postId) {
    showPostEditor(postId);
}

async function showPostEditor(postId = null) {
    const isEdit = postId !== null;
    let post = null;
    
    if (isEdit) {
        try {
            showLoading();
            const response = await apiManager.getPost(postId);
            post = response.data.post;
        } catch (error) {
            handleAPIError(error, 'Errore caricamento post');
            return;
        } finally {
            hideLoading();
        }
    }

    // Load categories and tags for the editor
    const [categoriesData, tagsData] = await Promise.all([
        apiManager.getCategories({ include_inactive: false }),
        apiManager.getTags()
    ]);

    const categories = categoriesData.data.categories;
    const tags = tagsData.data.tags;

    const modalBody = `
        <form id="postForm" class="needs-validation" novalidate>
            <div class="row">
                <div class="col-lg-8">
                    <!-- Basic Information -->
                    <div class="mb-3">
                        <label for="postTitle" class="form-label">Titolo *</label>
                        <input type="text" class="form-control" id="postTitle" required 
                               value="${post ? post.title : ''}" 
                               placeholder="Inserisci il titolo del post">
                        <div class="invalid-feedback">Titolo richiesto</div>
                    </div>

                    <div class="mb-3">
                        <label for="postSlug" class="form-label">Slug</label>
                        <input type="text" class="form-control" id="postSlug" 
                               value="${post ? post.slug : ''}" 
                               placeholder="Generato automaticamente dal titolo">
                    </div>

                    <div class="mb-3">
                        <label for="postExcerpt" class="form-label">Estratto</label>
                        <textarea class="form-control" id="postExcerpt" rows="3" 
                                  placeholder="Breve descrizione del post (max 500 caratteri)">${post ? post.excerpt || '' : ''}</textarea>
                    </div>

                    <!-- Content Editor -->
                    <div class="mb-3">
                        <label for="postContent" class="form-label">Contenuto *</label>
                        <div id="postContent">${post ? post.content : ''}</div>
                        <div class="invalid-feedback">Contenuto richiesto</div>
                    </div>
                </div>

                <div class="col-lg-4">
                    <!-- Publication Settings -->
                    <div class="card mb-3">
                        <div class="card-header">
                            <h6 class="card-title mb-0">Pubblicazione</h6>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label for="postStatus" class="form-label">Stato</label>
                                <select class="form-select" id="postStatus">
                                    <option value="draft" ${post?.status === 'draft' ? 'selected' : ''}>Bozza</option>
                                    <option value="published" ${post?.status === 'published' ? 'selected' : ''}>Pubblicato</option>
                                    <option value="scheduled" ${post?.status === 'scheduled' ? 'selected' : ''}>Programmato</option>
                                    <option value="archived" ${post?.status === 'archived' ? 'selected' : ''}>Archiviato</option>
                                </select>
                            </div>

                            <div class="mb-3" id="scheduledForContainer" style="display: none;">
                                <label for="scheduledFor" class="form-label">Data programmazione</label>
                                <input type="datetime-local" class="form-control" id="scheduledFor" 
                                       value="${post?.scheduled_for ? new Date(post.scheduled_for).toISOString().slice(0, -1) : ''}">
                            </div>

                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" id="isFeatured" 
                                       ${post?.is_featured ? 'checked' : ''}>
                                <label class="form-check-label" for="isFeatured">In evidenza</label>
                            </div>

                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="allowComments" 
                                       ${post?.allow_comments !== false ? 'checked' : ''}>
                                <label class="form-check-label" for="allowComments">Consenti commenti</label>
                            </div>
                        </div>
                    </div>

                    <!-- Service & Categories -->
                    <div class="card mb-3">
                        <div class="card-header">
                            <h6 class="card-title mb-0">Classificazione</h6>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label for="serviceCategory" class="form-label">Servizio IT-ERA</label>
                                <select class="form-select" id="serviceCategory">
                                    <option value="">Nessun servizio specifico</option>
                                    <option value="assistenza-it" ${post?.service_category === 'assistenza-it' ? 'selected' : ''}>Assistenza IT</option>
                                    <option value="sicurezza-informatica" ${post?.service_category === 'sicurezza-informatica' ? 'selected' : ''}>Sicurezza Informatica</option>
                                    <option value="cloud-storage" ${post?.service_category === 'cloud-storage' ? 'selected' : ''}>Cloud Storage</option>
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Categorie</label>
                                ${categories.map(cat => `
                                    <div class="form-check">
                                        <input class="form-check-input category-checkbox" type="checkbox" 
                                               value="${cat.id}" id="cat_${cat.id}"
                                               ${post?.categories?.some(c => c.id === cat.id) ? 'checked' : ''}>
                                        <label class="form-check-label" for="cat_${cat.id}">
                                            ${cat.name}
                                        </label>
                                    </div>
                                `).join('')}
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Tag</label>
                                <div class="tags-input" id="tagsInput">
                                    ${post?.tags?.map(tag => `
                                        <span class="tag-item">
                                            ${tag.name}
                                            <button type="button" onclick="removeTag('${tag.name}')">&times;</button>
                                        </span>
                                    `).join('') || ''}
                                    <input type="text" class="tag-input" placeholder="Aggiungi tag..." 
                                           onkeydown="handleTagInput(event)" list="tagSuggestions">
                                </div>
                                <datalist id="tagSuggestions">
                                    ${tags.map(tag => `<option value="${tag.name}">`).join('')}
                                </datalist>
                            </div>

                            <div class="mb-3">
                                <label for="targetCities" class="form-label">Città target</label>
                                <input type="text" class="form-control" id="targetCities" 
                                       placeholder="Milano, Monza, Bergamo..." 
                                       value="${post?.target_cities?.join(', ') || ''}">
                                <div class="form-text">Città separate da virgola</div>
                            </div>
                        </div>
                    </div>

                    <!-- Featured Image -->
                    <div class="card mb-3">
                        <div class="card-header">
                            <h6 class="card-title mb-0">Immagine in evidenza</h6>
                        </div>
                        <div class="card-body">
                            <div id="featuredImageContainer">
                                ${post?.featured_image ? `
                                    <div class="text-center mb-2">
                                        <img src="${post.featured_image}" class="img-thumbnail" style="max-height: 150px;">
                                        <br>
                                        <button type="button" class="btn btn-sm btn-outline-danger mt-2" onclick="removeFeaturedImage()">
                                            Rimuovi
                                        </button>
                                    </div>
                                ` : ''}
                            </div>
                            <input type="hidden" id="featuredImagePath" value="${post?.featured_image || ''}">
                            <button type="button" class="btn btn-outline-primary btn-sm w-100" onclick="selectFeaturedImage()">
                                <i class="bi bi-image me-1"></i>Seleziona immagine
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SEO Settings (Collapsible) -->
            <div class="accordion mt-4" id="seoAccordion">
                <div class="accordion-item">
                    <h2 class="accordion-header">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" 
                                data-bs-target="#seoCollapse">
                            <i class="bi bi-search me-2"></i>Impostazioni SEO
                        </button>
                    </h2>
                    <div id="seoCollapse" class="accordion-collapse collapse">
                        <div class="accordion-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="metaTitle" class="form-label">Meta Title</label>
                                        <input type="text" class="form-control" id="metaTitle" 
                                               maxlength="200" value="${post?.meta_title || ''}">
                                        <div class="form-text">Consigliato: 50-60 caratteri</div>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="metaDescription" class="form-label">Meta Description</label>
                                        <textarea class="form-control" id="metaDescription" rows="3" 
                                                  maxlength="300">${post?.meta_description || ''}</textarea>
                                        <div class="form-text">Consigliato: 150-160 caratteri</div>
                                    </div>

                                    <div class="mb-3">
                                        <label for="metaKeywords" class="form-label">Meta Keywords</label>
                                        <input type="text" class="form-control" id="metaKeywords" 
                                               value="${post?.meta_keywords || ''}">
                                        <div class="form-text">Keywords separate da virgola</div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="ogTitle" class="form-label">Open Graph Title</label>
                                        <input type="text" class="form-control" id="ogTitle" 
                                               value="${post?.og_title || ''}">
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="ogDescription" class="form-label">Open Graph Description</label>
                                        <textarea class="form-control" id="ogDescription" rows="3">${post?.og_description || ''}</textarea>
                                    </div>

                                    <div class="mb-3">
                                        <label for="ogImage" class="form-label">Open Graph Image</label>
                                        <input type="text" class="form-control" id="ogImage" 
                                               value="${post?.og_image || ''}">
                                        <div class="form-text">URL immagine per social media</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    `;

    const modal = showModal(
        isEdit ? 'Modifica Post' : 'Nuovo Post',
        modalBody,
        [
            {
                text: 'Salva',
                class: 'btn-primary',
                onclick: `savePost(${postId})`
            },
            {
                text: 'Salva e Pubblica',
                class: 'btn-success',
                onclick: `saveAndPublishPost(${postId})`
            }
        ]
    );

    // Initialize editor after modal is shown
    modal._element.addEventListener('shown.bs.modal', () => {
        initializeEditor('postContent', post?.content || '');
        
        // Setup status change handler
        document.getElementById('postStatus').onchange = function() {
            const scheduledContainer = document.getElementById('scheduledForContainer');
            if (this.value === 'scheduled') {
                scheduledContainer.style.display = 'block';
            } else {
                scheduledContainer.style.display = 'none';
            }
        };

        // Auto-generate slug from title
        document.getElementById('postTitle').oninput = function() {
            if (!isEdit || !document.getElementById('postSlug').value) {
                const slug = this.value
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .trim();
                document.getElementById('postSlug').value = slug;
            }
        };

        // Trigger status change if scheduled
        if (post?.status === 'scheduled') {
            document.getElementById('postStatus').dispatchEvent(new Event('change'));
        }
    });
}

// Tag management
function handleTagInput(event) {
    if (event.key === 'Enter' || event.key === ',') {
        event.preventDefault();
        const tagName = event.target.value.trim();
        if (tagName) {
            addTag(tagName);
            event.target.value = '';
        }
    }
}

function addTag(tagName) {
    const tagsInput = document.getElementById('tagsInput');
    const existingTags = Array.from(tagsInput.querySelectorAll('.tag-item')).map(t => t.textContent.replace('×', '').trim());
    
    if (!existingTags.includes(tagName)) {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag-item';
        tagElement.innerHTML = `${tagName} <button type="button" onclick="removeTag('${tagName}')">&times;</button>`;
        
        const input = tagsInput.querySelector('.tag-input');
        tagsInput.insertBefore(tagElement, input);
    }
}

function removeTag(tagName) {
    const tagsInput = document.getElementById('tagsInput');
    const tagElements = tagsInput.querySelectorAll('.tag-item');
    tagElements.forEach(tag => {
        if (tag.textContent.replace('×', '').trim() === tagName) {
            tag.remove();
        }
    });
}

// Continue with more post functions...
async function savePost(postId = null) {
    const form = document.getElementById('postForm');
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const postData = {
        title: document.getElementById('postTitle').value,
        slug: document.getElementById('postSlug').value,
        excerpt: document.getElementById('postExcerpt').value,
        content: getEditorContent(),
        status: document.getElementById('postStatus').value,
        service_category: document.getElementById('serviceCategory').value || null,
        is_featured: document.getElementById('isFeatured').checked,
        allow_comments: document.getElementById('allowComments').checked,
        featured_image: document.getElementById('featuredImagePath').value || null,
        
        // Categories
        categories: Array.from(document.querySelectorAll('.category-checkbox:checked')).map(cb => parseInt(cb.value)),
        
        // Tags
        tags: Array.from(document.getElementById('tagsInput').querySelectorAll('.tag-item'))
            .map(tag => tag.textContent.replace('×', '').trim()),
            
        // Target cities
        target_cities: document.getElementById('targetCities').value
            .split(',')
            .map(city => city.trim())
            .filter(city => city.length > 0),

        // SEO fields
        meta_title: document.getElementById('metaTitle').value || null,
        meta_description: document.getElementById('metaDescription').value || null,
        meta_keywords: document.getElementById('metaKeywords').value || null,
        og_title: document.getElementById('ogTitle').value || null,
        og_description: document.getElementById('ogDescription').value || null,
        og_image: document.getElementById('ogImage').value || null
    };

    // Scheduled date
    if (postData.status === 'scheduled') {
        const scheduledFor = document.getElementById('scheduledFor').value;
        if (scheduledFor) {
            postData.scheduled_for = new Date(scheduledFor).toISOString();
        }
    }

    try {
        showLoading();
        
        if (postId) {
            await apiManager.updatePost(postId, postData);
            showNotification('Post aggiornato con successo', 'success');
        } else {
            await apiManager.createPost(postData);
            showNotification('Post creato con successo', 'success');
        }
        
        hideModal();
        loadPosts(); // Refresh the posts list
        
    } catch (error) {
        handleAPIError(error, 'Errore salvando il post');
    } finally {
        hideLoading();
    }
}

async function saveAndPublishPost(postId = null) {
    // Set status to published before saving
    document.getElementById('postStatus').value = 'published';
    await savePost(postId);
}