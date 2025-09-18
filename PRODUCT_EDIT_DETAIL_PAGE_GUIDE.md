# Product Edit Detail Page - Backend API Guide

## Overview
This guide provides all the backend APIs and data structures needed to build a comprehensive product edit detail page. While I can't create the frontend UI, I can provide the complete backend support and examples for implementation.

## Available APIs for Product Edit Page

### 1. Get Product Data for Editing
```http
GET /api/products/admin/:id
```
**Purpose**: Load product data into the edit form
**Response**: Complete product information including vendor, categories, images, specs

### 2. Update Product Details
```http
PUT /api/products/:id
```
**Content-Type**: `multipart/form-data`
**Purpose**: Update product text fields, category, stock, etc.
**Note**: This is for vendor owners updating their own products

### 3. Update Product Images (Keep Images System)
```http
PUT /api/products/admin/:id/images
```
**Content-Type**: `multipart/form-data`
**Purpose**: Manage product images with selective deletion

### 4. Delete Individual Image
```http
DELETE /api/products/admin/:id/images/:imageId
```
**Purpose**: Remove specific images

### 5. Get Categories & Subcategories
```http
GET /api/categories
GET /api/categories/:id/subcategories
```
**Purpose**: Populate category/subcategory dropdowns

## Product Edit Page Data Flow

### Initial Page Load
```javascript
// 1. Get product data
const productResponse = await fetch(`/api/products/admin/${productId}`);
const { product } = await productResponse.json();

// 2. Populate form fields
form.name.value = product.name;
form.description.value = product.description;
form.stock.value = product.stock;
form.has_discount.checked = product.has_discount;
form.sold_in_bulk.checked = product.sold_in_bulk;

// 3. Set category/subcategory
form.category_id.value = product.category.id;
// Load subcategories for this category
const subcategoriesResponse = await fetch(`/api/categories/${product.category.id}/subcategories`);
const { subcategories } = await subcategoriesResponse.json();
populateSubcategoryDropdown(subcategories);
form.subcategory_id.value = product.subcategory.id;

// 4. Display current images
displayCurrentImages(product.media.images);

// 5. Load specifications
displaySpecifications(product.specifications);
```

### Form Submission Flow
```javascript
async function saveProduct() {
  const formData = new FormData();
  
  // Add text fields
  formData.append('name', form.name.value);
  formData.append('description', form.description.value);
  formData.append('stock', form.stock.value);
  formData.append('category_id', form.category_id.value);
  formData.append('subcategory_id', form.subcategory_id.value);
  formData.append('has_discount', form.has_discount.checked);
  formData.append('sold_in_bulk', form.sold_in_bulk.checked);
  
  // Add specs as JSON
  const specs = collectSpecificationsFromForm();
  formData.append('specs', JSON.stringify(specs));
  
  // Add new images if any
  const newImages = form.newImages.files;
  for (let i = 0; i < newImages.length; i++) {
    formData.append('images', newImages[i]);
  }
  
  const response = await fetch(`/api/products/${productId}`, {
    method: 'PUT',
    body: formData
  });
  
  if (response.ok) {
    showSuccessMessage('Product updated successfully');
    // Refresh page or redirect
  }
}
```

### Image Management Flow
```javascript
// When user wants to update images
async function updateImages() {
  const formData = new FormData();
  
  // Specify which images to keep (by ID)
  const keepImageIds = getSelectedImageIds(); // e.g., [1, 3, 5]
  formData.append('keepImages', JSON.stringify(keepImageIds));
  
  // Add new images
  const newImages = form.newImageUploads.files;
  for (let i = 0; i < newImages.length; i++) {
    formData.append('images', newImages[i]);
  }
  
  const response = await fetch(`/api/products/admin/${productId}/images`, {
    method: 'PUT',
    body: formData
  });
  
  if (response.ok) {
    const { images } = await response.json();
    updateImageDisplay(images);
  }
}

// Delete individual image
async function deleteImage(imageId) {
  const response = await fetch(`/api/products/admin/${productId}/images/${imageId}`, {
    method: 'DELETE'
  });
  
  if (response.ok) {
    removeImageFromDisplay(imageId);
  }
}
```

## Form Structure for Edit Page

### Basic Information Section
```html
<div class="form-section">
  <h3>Basic Information</h3>
  <div class="form-group">
    <label>Product Name *</label>
    <input type="text" name="name" required maxlength="255">
  </div>
  
  <div class="form-group">
    <label>Description</label>
    <textarea name="description" rows="4"></textarea>
  </div>
  
  <div class="form-group">
    <label>Stock *</label>
    <input type="number" name="stock" required min="0">
  </div>
</div>
```

### Category Section
```html
<div class="form-section">
  <h3>Category & Classification</h3>
  <div class="form-group">
    <label>Category *</label>
    <select name="category_id" required onchange="loadSubcategories(this.value)">
      <!-- Load from GET /api/categories -->
    </select>
  </div>
  
  <div class="form-group">
    <label>Subcategory *</label>
    <select name="subcategory_id" required>
      <!-- Load dynamically based on category -->
    </select>
  </div>
</div>
```

### Product Options
```html
<div class="form-section">
  <h3>Product Options</h3>
  <div class="checkbox-group">
    <label>
      <input type="checkbox" name="has_discount">
      Has Discount Available
    </label>
  </div>
  
  <div class="checkbox-group">
    <label>
      <input type="checkbox" name="sold_in_bulk">
      Sold in Bulk
    </label>
  </div>
</div>
```

### Specifications Section
```html
<div class="form-section">
  <h3>Specifications</h3>
  <div id="specifications-container">
    <!-- Dynamic spec rows -->
  </div>
  <button type="button" onclick="addSpecification()">Add Specification</button>
</div>

<script>
function addSpecification(key = '', value = '') {
  const container = document.getElementById('specifications-container');
  const row = document.createElement('div');
  row.className = 'spec-row';
  row.innerHTML = `
    <input type="text" placeholder="Key (e.g., Color)" value="${key}" required>
    <input type="text" placeholder="Value (e.g., Red)" value="${value}" required>
    <button type="button" onclick="removeSpecification(this)">Remove</button>
  `;
  container.appendChild(row);
}
</script>
```

### Image Management Section
```html
<div class="form-section">
  <h3>Product Images</h3>
  
  <!-- Current Images -->
  <div id="current-images">
    <!-- Display existing images with delete buttons -->
  </div>
  
  <!-- Upload New Images -->
  <div class="form-group">
    <label>Add New Images</label>
    <input type="file" name="images" multiple accept="image/*">
    <small>Supported formats: JPEG, PNG, GIF, WebP (Max 10MB each)</small>
  </div>
</div>

<script>
function displayCurrentImages(images) {
  const container = document.getElementById('current-images');
  container.innerHTML = '';
  
  images.forEach(image => {
    const imgDiv = document.createElement('div');
    imgDiv.className = 'image-item';
    imgDiv.innerHTML = `
      <img src="${image.image_url}" alt="Product image" width="100">
      <button type="button" onclick="deleteImage(${image.id})">Delete</button>
    `;
    container.appendChild(imgDiv);
  });
}
</script>
```

## Complete Page Structure

### Layout Recommendation
```html
<div class="product-edit-page">
  <div class="page-header">
    <h1>Edit Product</h1>
    <div class="actions">
      <button onclick="saveProduct()">Save Changes</button>
      <button onclick="cancelEdit()">Cancel</button>
    </div>
  </div>
  
  <form id="product-form" enctype="multipart/form-data">
    <!-- Basic Information Section -->
    <!-- Category Section -->
    <!-- Product Options Section -->
    <!-- Specifications Section -->
    <!-- Image Management Section -->
  </form>
</div>
```

### CSS Suggestions
```css
.product-edit-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.form-section {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spec-row {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.spec-row input {
  flex: 1;
}

.image-item {
  display: inline-block;
  margin: 10px;
  text-align: center;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.actions {
  display: flex;
  gap: 10px;
}
```

## Error Handling

### API Error Responses
```javascript
// Handle API errors consistently
async function handleApiResponse(response) {
  if (!response.ok) {
    const error = await response.json();
    showErrorMessage(error.error || 'An error occurred');
    return null;
  }
  return await response.json();
}

// Usage
const result = await handleApiResponse(response);
if (result) {
  // Success handling
}
```

### Form Validation
```javascript
function validateForm() {
  const errors = [];
  
  if (!form.name.value.trim()) {
    errors.push('Product name is required');
  }
  
  if (!form.stock.value || form.stock.value < 0) {
    errors.push('Valid stock quantity is required');
  }
  
  if (!form.category_id.value) {
    errors.push('Category selection is required');
  }
  
  if (errors.length > 0) {
    showErrorMessage(errors.join('<br>'));
    return false;
  }
  
  return true;
}
```

## Data Persistence

### Auto-save Draft (Optional)
```javascript
// Save draft every 30 seconds
setInterval(() => {
  const formData = collectFormData();
  localStorage.setItem(`product_draft_${productId}`, JSON.stringify(formData));
}, 30000);

// Restore draft on page load
function restoreDraft() {
  const draft = localStorage.getItem(`product_draft_${productId}`);
  if (draft) {
    const data = JSON.parse(draft);
    populateForm(data);
  }
}
```

## Performance Considerations

1. **Lazy Load Images**: Only load visible images initially
2. **Debounced Saving**: Don't save on every keystroke
3. **Optimistic Updates**: Update UI immediately, then sync with server
4. **Progress Indicators**: Show upload progress for images

## Security Notes

- All admin routes require `authorizeAdmin` middleware
- File uploads are validated for type and size
- Image URLs are filtered to prevent XSS
- All user inputs are validated server-side

---

This provides the complete backend API support and frontend structure guidance for building a comprehensive product edit detail page. The page should integrate seamlessly with the existing admin dashboard and provide a smooth editing experience.
