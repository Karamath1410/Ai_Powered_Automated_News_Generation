document.addEventListener('DOMContentLoaded', function() {
    const languageSelect = document.getElementById('languageSelect');
    const categoryCheckboxes = document.querySelectorAll('.category-checkbox');
    const saveButton = document.getElementById('savePreferences');

    function getSelectedCategories() {
        const selected = [];
        categoryCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                selected.push(checkbox.value);
            }
        });
        return selected;
    }

    async function savePreferences() {
        const categories = getSelectedCategories();
        const language = languageSelect.value;

        if (categories.length === 0) {
            alert('Please select at least one category');
            return;
        }

        try {
            const response = await fetch('/api/update_preferences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    categories: categories,
                    language: language
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                // Show success message using Bootstrap toast
                const toast = document.createElement('div');
                toast.className = 'toast position-fixed bottom-0 end-0 m-3';
                toast.setAttribute('role', 'alert');
                toast.innerHTML = `
                    <div class="toast-header">
                        <strong class="me-auto">Success</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                    </div>
                    <div class="toast-body">
                        Preferences saved successfully!
                    </div>
                `;
                document.body.appendChild(toast);
                new bootstrap.Toast(toast).show();

                // Redirect to home page after short delay
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                throw new Error(data.error || 'Failed to save preferences');
            }
        } catch (error) {
            alert('Error saving preferences: ' + error.message);
        }
    }

    saveButton.addEventListener('click', savePreferences);
});
