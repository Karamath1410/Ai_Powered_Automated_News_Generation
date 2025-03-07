document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements
    const categoryContainer = document.querySelector('.categories-container');
    const categoryCheckboxes = document.querySelectorAll('.category-checkbox');
    const categoryTags = document.querySelectorAll('.category-tag');
    
    // Initialize Bootstrap tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Track category changes
    let selectedCategories = new Set();
    categoryCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedCategories.add(checkbox.value);
        }
    });

    // Update categories in real-time
    function updateCategoryDisplay() {
        if (categoryContainer) {
            categoryContainer.innerHTML = '';
            if (selectedCategories.size > 0) {
                selectedCategories.forEach(category => {
                    const categoryTag = document.createElement('div');
                    categoryTag.className = 'category-tag';
                    categoryTag.textContent = category.charAt(0).toUpperCase() + category.slice(1);
                    categoryContainer.appendChild(categoryTag);
                });
            } else {
                const noCategories = document.createElement('div');
                noCategories.className = 'category-tag';
                noCategories.textContent = 'No categories selected';
                categoryContainer.appendChild(noCategories);
            }
        }
    }

    // Handle category checkbox changes
    categoryCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', async function(e) {
            if (checkbox.checked) {
                selectedCategories.add(checkbox.value);
            } else {
                selectedCategories.delete(checkbox.value);
            }

            // Update visual display
            updateCategoryDisplay();

            // Validate at least one category is selected
            if (selectedCategories.size === 0) {
                showError('Please select at least one category');
                checkbox.checked = true;
                selectedCategories.add(checkbox.value);
                updateCategoryDisplay();
                return;
            }

            try {
                const response = await fetch('/api/update_preferences', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        categories: Array.from(selectedCategories)
                    })
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to update categories');
                }

                // Show success notification
                showNotification('Categories updated successfully');
                
                // Refresh news feed if we're on the main page
                if (window.location.pathname === '/') {
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }
            } catch (error) {
                showError(`Error updating categories: ${error.message}`);
                // Revert the checkbox state
                checkbox.checked = !checkbox.checked;
                if (checkbox.checked) {
                    selectedCategories.add(checkbox.value);
                } else {
                    selectedCategories.delete(checkbox.value);
                }
                updateCategoryDisplay();
            }
        });
    });

    // Utility function to show error messages
    function showError(message) {
        const errorToast = document.createElement('div');
        errorToast.className = 'toast position-fixed bottom-0 end-0 m-3 bg-danger text-white';
        errorToast.setAttribute('role', 'alert');
        errorToast.innerHTML = `
            <div class="toast-header bg-danger text-white">
                <strong class="me-auto">Error</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;
        document.body.appendChild(errorToast);
        new bootstrap.Toast(errorToast).show();
    }

    // Utility function to show success notifications
    function showNotification(message) {
        const successToast = document.createElement('div');
        successToast.className = 'toast position-fixed bottom-0 end-0 m-3 bg-success text-white';
        successToast.setAttribute('role', 'alert');
        successToast.innerHTML = `
            <div class="toast-header bg-success text-white">
                <strong class="me-auto">Success</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;
        document.body.appendChild(successToast);
        new bootstrap.Toast(successToast).show();
    }

    // Handle drag and drop reordering of categories
    if (categoryContainer) {
        let draggedElement = null;

        categoryTags.forEach(tag => {
            tag.setAttribute('draggable', true);
            
            tag.addEventListener('dragstart', (e) => {
                draggedElement = e.target;
                e.target.classList.add('dragging');
            });

            tag.addEventListener('dragend', (e) => {
                e.target.classList.remove('dragging');
            });

            tag.addEventListener('dragover', (e) => {
                e.preventDefault();
                const afterElement = getDragAfterElement(categoryContainer, e.clientY);
                const draggable = document.querySelector('.dragging');
                if (afterElement == null) {
                    categoryContainer.appendChild(draggable);
                } else {
                    categoryContainer.insertBefore(draggable, afterElement);
                }
            });
        });
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.category-tag:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
});
