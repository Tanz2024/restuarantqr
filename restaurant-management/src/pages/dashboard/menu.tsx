import React, {
  useEffect,
  useState,
  ChangeEvent,
  FormEvent,
  MouseEvent,
} from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/dashboardLayout';
import { useAuth } from '@/components/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import styles from './dashboard-menu.module.css';

interface AvailabilitySchedule {
  days: string; // e.g., "Mon-Fri"
  timeRange: string; // e.g., "11:00-14:00"
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency?: string;
  image_url?: string;
  video_url?: string;
  is_available: boolean;
  dishTags?: string[];
  popularity?: string; // "Low", "Medium", or "High"
  rating?: number; // 1 to 5
  availabilitySchedule?: AvailabilitySchedule;
  updated_at?: string;
  created_at?: string;
}

interface SingleDishFormData {
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  file: File | null;
  videoFile: File | null;
  is_available: boolean;
  dishTags: string;
  popularity: string; // "Low", "Medium", "High"
  rating: number; // 1 to 5
  availabilitySchedule: string; // e.g., "Mon-Fri, 11:00-14:00"
}

const CURRENCY_OPTIONS = [
  'USD',
  'EUR',
  'GBP',
  'AUD',
  'CAD',
  'JPY',
  'CNY',
  'INR',
  'SGD',
  'MYR',
];

const POPULARITY_OPTIONS = ['Low', 'Medium', 'High'];

/**
 * A simple star rating component.
 * It displays 5 clickable stars.
 */
interface StarRatingProps {
  value: number;
  onChange: (newValue: number) => void;
}
const StarRating: React.FC<StarRatingProps> = ({ value, onChange }) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className={styles.starRating}>
      {stars.map((star) => (
        <span
          key={star}
          className={star <= value ? styles.filledStar : styles.emptyStar}
          onClick={() => onChange(star)}
          style={{ cursor: 'pointer', fontSize: '1.5rem' }}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default function DashboardMenu() {
  const { user, loading } = useAuth();

  // ==========================
  // State
  // ==========================
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('recent');

  const [filter, setFilter] = useState({
    name: '',
    category: '',
    availability: '',
    dishTag: '',
    minPrice: '',
    maxPrice: '',
  });

  // Collapsible Filter
  const [showFilterPanel, setShowFilterPanel] = useState<boolean>(true);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [currentItem, setCurrentItem] = useState<MenuItem | null>(null);
  const [editFormData, setEditFormData] = useState<SingleDishFormData>({
    name: '',
    description: '',
    category: '',
    price: 0,
    currency: 'MYR',
    file: null,
    videoFile: null,
    is_available: true,
    dishTags: '',
    popularity: 'Medium',
    rating: 0,
    availabilitySchedule: '',
  });

  // Add modal state (for adding multiple dishes)
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [multipleDishes, setMultipleDishes] = useState<SingleDishFormData[]>([
    blankDishForm(),
  ]);

  const [isFetching, setIsFetching] = useState<boolean>(false);

  // Default currency symbol for display if not provided
  const defaultCurrencySymbol =
    process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'MYR';

  // Determine restaurant ID
  const restaurantId =
    user?.restaurant_id || process.env.NEXT_PUBLIC_DEFAULT_RESTAURANT_ID;

  // ==========================
  // Lifecycle: Fetch Menu
  // ==========================
  useEffect(() => {
    if (restaurantId) {
      fetchMenuItems();
    }
  }, [restaurantId, sortOption, filter]);

  // ==========================
  // Helpers
  // ==========================
  function blankDishForm(): SingleDishFormData {
    return {
      name: '',
      description: '',
      category: '',
      price: 0,
      currency: 'MYR',
      file: null,
      videoFile: null,
      is_available: true,
      dishTags: '',
      popularity: 'Medium',
      rating: 0,
      availabilitySchedule: '',
    };
  }

  function limitDescription(str: string, maxWords = 50) {
    const words = str.split(' ');
    if (words.length <= maxWords) return str;
    return words.slice(0, maxWords).join(' ');
  }

  // ==========================
  // Fetch Menu Items
  // ==========================
  async function fetchMenuItems() {
    if (!restaurantId) return;
    setIsFetching(true);
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/menus/${restaurantId}`,
        {
          params: {
            sort: sortOption,
            ...filter,
          },
        }
      );
      setMenuItems(res.data.menus || []);
      toast.success('Menu items loaded');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch menu items.');
      toast.error('Failed to fetch menu items.');
    } finally {
      setIsFetching(false);
    }
  }

  // ==========================
  // Delete Dish
  // ==========================
  async function handleDelete(menuId: string) {
    if (!confirm('Are you sure you want to delete this dish?')) return;
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/menus/${menuId}`,
        { withCredentials: true }
      );
      toast.success('Dish deleted');
      fetchMenuItems();
    } catch (err: any) {
      console.error(err);
      setError('Failed to delete dish.');
      toast.error('Failed to delete dish');
    }
  }

  // ==========================
  // Edit Dish
  // ==========================
  function openEditModal(item: MenuItem) {
    setCurrentItem(item);
    setEditFormData({
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price,
      currency: item.currency || defaultCurrencySymbol,
      file: null,
      videoFile: null,
      is_available: item.is_available,
      dishTags: item.dishTags ? item.dishTags.join(', ') : '',
      popularity: item.popularity || 'Medium',
      rating: item.rating || 0,
      availabilitySchedule: item.availabilitySchedule
        ? `${item.availabilitySchedule.days}, ${item.availabilitySchedule.timeRange}`
        : '',
    });
    setShowEditModal(true);
  }

  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault();
    if (!currentItem) return;

    const updateData = new FormData();
    updateData.append('name', editFormData.name);
    updateData.append('description', editFormData.description);
    updateData.append('category', editFormData.category);
    updateData.append('price', editFormData.price.toString());
    updateData.append('currency', editFormData.currency);
    updateData.append(
      'is_available',
      editFormData.is_available ? 'true' : 'false'
    );
    updateData.append('dishTags', editFormData.dishTags);
    updateData.append('popularity', editFormData.popularity);
    updateData.append('rating', editFormData.rating.toString());
    updateData.append(
      'availabilitySchedule',
      editFormData.availabilitySchedule
    );

    if (editFormData.file) {
      updateData.append('image', editFormData.file);
    }
    if (editFormData.videoFile) {
      updateData.append('video', editFormData.videoFile);
    }

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/menus/${currentItem.id}`,
        updateData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        }
      );
      toast.success('Dish updated');
      setShowEditModal(false);
      setCurrentItem(null);
      fetchMenuItems();
    } catch (err: any) {
      console.error(err);
      setError('Failed to update dish.');
      toast.error('Failed to update dish');
    }
  }

  // ==========================
  // Add Multiple Dishes
  // ==========================
  function openAddModal() {
    setMultipleDishes([blankDishForm()]);
    setShowAddModal(true);
  }

  function addAnotherDish() {
    setMultipleDishes((prev) => [...prev, blankDishForm()]);
  }

  function removeDishRow(index: number) {
    setMultipleDishes((prev) => prev.filter((_, i) => i !== index));
  }

  function updateDishRow(
    index: number,
    field: keyof SingleDishFormData,
    value: any
  ) {
    setMultipleDishes((prev) => {
      const updated = [...prev];
      if (field === 'description') {
        updated[index].description = limitDescription(value, 50);
      } else {
        (updated[index] as any)[field] = value;
      }
      return updated;
    });
  }

  async function handleMultipleAddSubmit(e: FormEvent) {
    e.preventDefault();
    if (!restaurantId) return;

    try {
      await Promise.all(
        multipleDishes.map(async (dish) => {
          const form = new FormData();
          form.append('restaurant_id', restaurantId);
          form.append('name', dish.name);
          form.append('description', dish.description);
          form.append('category', dish.category);
          form.append('price', dish.price.toString());
          form.append('currency', dish.currency);
          form.append('dishTags', dish.dishTags);
          form.append('popularity', dish.popularity);
          form.append('rating', dish.rating.toString());
          form.append(
            'availabilitySchedule',
            dish.availabilitySchedule
          );
          if (dish.file) form.append('image', dish.file);
          if (dish.videoFile) form.append('video', dish.videoFile);
          form.append('is_available', dish.is_available ? 'true' : 'false');

          await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/menus`,
            form,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
              withCredentials: true,
            }
          );
        })
      );

      toast.success('All dishes have been added successfully!');
      setShowAddModal(false);
      fetchMenuItems();
    } catch (err: any) {
      console.error(err);
      setError('Failed to create new dish(es).');
      toast.error('Failed to create new dish(es).');
    }
  }

  // ==========================
  // Filtering & Sorting
  // ==========================
  function handleFilterChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  }

  function handleSortChange(e: ChangeEvent<HTMLSelectElement>) {
    setSortOption(e.target.value);
  }

  const filteredItems = menuItems
  .filter((item) => {
    let matches = true;

    // Name filter (added)
    if (filter.name) {
      matches =
        matches &&
        item.name.toLowerCase().includes(filter.name.toLowerCase());
    }

    // Category
    if (filter.category) {
      matches =
        matches &&
        item.category.toLowerCase().includes(filter.category.toLowerCase());
    }

    // Availability
    if (filter.availability) {
      matches =
        matches &&
        (filter.availability === 'available'
          ? item.is_available
          : !item.is_available);
    }

    // DishTag
    if (filter.dishTag && item.dishTags) {
      matches =
        matches &&
        item.dishTags.some((tag) =>
          tag.toLowerCase().includes(filter.dishTag.toLowerCase())
        );
    }

    // Price range
    if (filter.minPrice) {
      matches = matches && item.price >= parseFloat(filter.minPrice);
    }
    if (filter.maxPrice) {
      matches = matches && item.price <= parseFloat(filter.maxPrice);
    }

    return matches;
  })
  .sort((a, b) => {
    // Step 1: Sort by availability first (available = true comes first)
    if (a.is_available !== b.is_available) {
      return a.is_available ? -1 : 1;
    }

    // Step 2: Apply selected sort
    switch (sortOption) {
      case 'price_low':
        return a.price - b.price;

      case 'price_high':
        return b.price - a.price;

      case 'most_popular': {
        const valA = a.popularity === 'High' ? 3 : a.popularity === 'Medium' ? 2 : 1;
        const valB = b.popularity === 'High' ? 3 : b.popularity === 'Medium' ? 2 : 1;
        return valB - valA;
      }

      case 'highest_rated':
        return (b.rating || 0) - (a.rating || 0);

      case 'recent':
      default: {
        const dateA = new Date(a.updated_at || a.created_at || '1970-01-01').getTime();
        const dateB = new Date(b.updated_at || b.created_at || '1970-01-01').getTime();
        return dateB - dateA; // most recent first
      }
    }
  });

  


  // ==========================
  // Modal Click Outside
  // ==========================
  function handleOverlayClick(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      setShowAddModal(false);
      setShowEditModal(false);
      setCurrentItem(null);
    }
  }

  // ==========================
  // Render
  // ==========================
  if (loading) {
    return (
      <DashboardLayout>
        <div className={styles.loading}>
          <p>Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!restaurantId) {
    console.error('Restaurant ID is not set.');
    return (
      <DashboardLayout>
        <p>Error: Restaurant ID is missing. Please register as a restaurant owner.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Toaster position="top-right" />
      <div className={styles.container}>
        <h1 className={styles.title}>Menu Management</h1>
        {error && <p className={styles.error}>{error}</p>}

        {/* Collapsible Filter Panel */}
        <button
          onClick={() => setShowFilterPanel((prev) => !prev)}
          className={styles.toggleFilterButton}
        >
          {showFilterPanel ? 'Hide Filters' : 'Show Filters'}
        </button>

        {showFilterPanel && (
          <div className={styles.filterContainer}>
            <aside className={styles.filterSidebar}>
              <h3>Filters & Sort</h3>
              <div className={styles.filterGroup}>
  <label htmlFor="nameFilter">Dish Name</label>
  <input
    id="nameFilter"
    type="text"
    name="name"
    placeholder="Search by name..."
    value={filter.name}
    onChange={handleFilterChange}
  />
</div>

              <div className={styles.filterGroup}>
                <label htmlFor="categoryFilter">Category</label>
                <input
                  id="categoryFilter"
                  type="text"
                  name="category"
                  placeholder="e.g. Appetizers"
                  value={filter.category}
                  onChange={handleFilterChange}
                />
              </div>

              <div className={styles.filterGroup}>
                <label htmlFor="availabilityFilter">Availability</label>
                <select
                  id="availabilityFilter"
                  name="availability"
                  value={filter.availability}
                  onChange={handleFilterChange}
                >
                  <option value="">All</option>
                  <option value="available">Available</option>
                  <option value="not_available">Not Available</option>
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label htmlFor="dishTagFilter">Dish Tag (e.g., Spicy, Vegan)</label>
                <input
                  id="dishTagFilter"
                  type="text"
                  name="dishTag"
                  placeholder="Search by tag..."
                  value={filter.dishTag}
                  onChange={handleFilterChange}
                />
              </div>

              <div className={styles.filterGroup}>
                <label htmlFor="minPrice">Min Price</label>
                <input
                  id="minPrice"
                  type="number"
                  name="minPrice"
                  placeholder="0"
                  min={0}
                  step={0.01}
                  className={styles.noSpin}
                  value={filter.minPrice}
                  onChange={handleFilterChange}
                />
              </div>

              <div className={styles.filterGroup}>
                <label htmlFor="maxPrice">Max Price</label>
                <input
                  id="maxPrice"
                  type="number"
                  name="maxPrice"
                  placeholder="100"
                  min={0}
                  step={0.01}
                  className={styles.noSpin}
                  value={filter.maxPrice}
                  onChange={handleFilterChange}
                />
              </div>

              {/* Sort By inside filter panel */}
              <div className={styles.filterGroup}>
                <label htmlFor="sortSelect">Sort By</label>
                <select
                  id="sortSelect"
                  value={sortOption}
                  onChange={handleSortChange}
                >
                  <option value="recent">Most Recent</option>
                  <option value="price_low">Lowest Price</option>
                  <option value="price_high">Highest Price</option>
                  <option value="most_popular">Most Popular</option>
                  <option value="highest_rated">Highest Rated</option>
                </select>
              </div>
            </aside>
          </div>
        )}

        {/* Menu Items */}
        {isFetching ? (
          <div className={styles.skeletonLoader}>Loading dishes...</div>
        ) : filteredItems.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No dishes found. Please add a new dish.</p>
          </div>
        ) : (
          <div className={styles.cardGrid}>
            {filteredItems.map((item) => (
              <div key={item.id} className={styles.dishCard}>
             

{item.image_url && (
  <img
  src={`/uploads${item.image_url.replace('/uploads', '')}`} // Make sure this resolves to a valid URL
  alt={item.name}
  className={styles.thumbnail}
/>



)}

                <div className={styles.cardContent}>
                  <h4 className={styles.dishName}>{item.name}</h4>
                  <p className={styles.price}>
                    {item.currency ? item.currency : defaultCurrencySymbol}
                    {Number(item.price).toFixed(2)}
                  </p>
                  <p className={styles.category}>{item.category}</p>

                  {item.dishTags && (
                    <div className={styles.tagContainer}>
                      {item.dishTags.map((tag, index) => (
                        <span key={index} className={styles.tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {item.availabilitySchedule && (
                    <p className={styles.schedule}>
                      Available: {item.availabilitySchedule.days} (
                      {item.availabilitySchedule.timeRange})
                    </p>
                  )}

                  {/* Availability dropdown */}
                  <div className={styles.availability}>
                    <label className={styles.selectRow}>
                      <select
                        value={item.is_available ? 'available' : 'not_available'}
                        onChange={async () => {
                          try {
                            await axios.put(
                              `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/menus/${item.id}/availability`,
                              { is_available: !item.is_available },
                              { withCredentials: true }
                            );
                            toast.success('Availability updated');
                            fetchMenuItems();
                          } catch (err: any) {
                            console.error(err);
                            toast.error('Failed to update availability');
                          }
                        }}
                        
                      >
                        <option value="available">Available</option>
                        <option value="not_available">Not Available</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <button
                    onClick={() => openEditModal(item)}
                    className={styles.button}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className={styles.button}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={openAddModal} className={styles.createButton}>
          Add New Dish(es)
        </button>

        {/* EDIT DISH MODAL (single dish) */}
        {showEditModal && currentItem && (
          <div className={styles.modalOverlay} onClick={handleOverlayClick}>
            <div className={styles.modalContent}>
              <h2>Edit Dish</h2>
              <form onSubmit={handleEditSubmit} className={styles.form}>
                <label>Dish Name (required)</label>
                <input
                  type="text"
                  placeholder="e.g., Margherita Pizza"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  required
                />

                <label>Description (max 50 words, required)</label>
                <textarea
                  placeholder="Short description of the dish..."
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      description: limitDescription(e.target.value, 50),
                    })
                  }
                  draggable={false}
                  required
                />

                <label>Category (required)</label>
                <input
                  type="text"
                  placeholder="e.g., Appetizer, Main Course..."
                  value={editFormData.category}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      category: e.target.value,
                    })
                  }
                  required
                />

                <label>Price (required, cannot be negative)</label>
                <input
                  type="number"
                  placeholder="e.g., 12"
                  min={0}
                  step={0.01}
                  className={styles.noSpin}
                  value={editFormData.price}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      price: Math.max(0, parseFloat(e.target.value)),
                    })
                  }
                  required
                />

                <label>Currency</label>
                <select
                  value={editFormData.currency}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      currency: e.target.value,
                    })
                  }
                >
                  {CURRENCY_OPTIONS.map((cur) => (
                    <option key={cur} value={cur}>
                      {cur}
                    </option>
                  ))}
                </select>

                <label>Dish Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g., Spicy, Vegan..."
                  value={editFormData.dishTags}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      dishTags: e.target.value,
                    })
                  }
                />

                <label>Popularity</label>
                <select
                  value={editFormData.popularity}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      popularity: e.target.value,
                    })
                  }
                >
                  {POPULARITY_OPTIONS.map((pop) => (
                    <option key={pop} value={pop}>
                      {pop}
                    </option>
                  ))}
                </select>

                <label>Rating</label>
                <StarRating
                  value={editFormData.rating}
                  onChange={(newVal) =>
                    setEditFormData({ ...editFormData, rating: newVal })
                  }
                />

                <label>Availability Schedule</label>
                <input
                  type="text"
                  placeholder="e.g., Mon-Fri, 11:00-14:00"
                  value={editFormData.availabilitySchedule}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      availabilitySchedule: e.target.value,
                    })
                  }
                />

                <label>Upload Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      file: e.target.files ? e.target.files[0] : null,
                    })
                  }
                />

                <label>Upload Video</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      videoFile: e.target.files ? e.target.files[0] : null,
                    })
                  }
                />

                {/* Availability dropdown */}
                <label className={styles.selectRow}>
                  <select
                    value={editFormData.is_available ? 'available' : 'not_available'}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        is_available: e.target.value === 'available',
                      })
                    }
                  >
                    <option value="available">Available</option>
                    <option value="not_available">Not Available</option>
                  </select>
                </label>

                <div className={styles.modalActions}>
                  <button type="submit" className={styles.button}>
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setCurrentItem(null);
                    }}
                    className={styles.button}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD MULTIPLE DISHES MODAL */}
        {showAddModal && (
          <div className={styles.modalOverlay} onClick={handleOverlayClick}>
            <div className={styles.modalContent}>
              <h2>Add New Dish(es)</h2>
              <form onSubmit={handleMultipleAddSubmit} className={styles.form}>
                {multipleDishes.map((dish, idx) => (
                  <div key={idx} className={styles.multiDishBlock}>
                    <h3>Dish #{idx + 1}</h3>

                    <label>Dish Name (required)</label>
                    <input
                      type="text"
                      placeholder="e.g., Margherita Pizza"
                      value={dish.name}
                      onChange={(e) => updateDishRow(idx, 'name', e.target.value)}
                      required
                    />

                    <label>Description (max 50 words, required)</label>
                    <textarea
                      placeholder="Short description..."
                      value={dish.description}
                      onChange={(e) =>
                        updateDishRow(idx, 'description', e.target.value)
                      }
                      draggable={false}
                      required
                    />

                    <label>Category (required)</label>
                    <input
                      type="text"
                      placeholder="e.g., Appetizer, Main Course..."
                      value={dish.category}
                      onChange={(e) => updateDishRow(idx, 'category', e.target.value)}
                      required
                    />

                    <label>Price (required, cannot be negative)</label>
                    <input
                      type="number"
                      placeholder="e.g., 12"
                      min={0}
                      step={0.01}
                      className={styles.noSpin}
                      value={dish.price}
                      onChange={(e) =>
                        updateDishRow(
                          idx,
                          'price',
                          Math.max(0, parseFloat(e.target.value))
                        )
                      }
                      required
                    />

                    <label>Currency</label>
                    <select
                      value={dish.currency}
                      onChange={(e) => updateDishRow(idx, 'currency', e.target.value)}
                    >
                      {CURRENCY_OPTIONS.map((cur) => (
                        <option key={cur} value={cur}>
                          {cur}
                        </option>
                      ))}
                    </select>

                    <label>Dish Tags (comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g., Spicy, Vegan..."
                      value={dish.dishTags}
                      onChange={(e) =>
                        updateDishRow(idx, 'dishTags', e.target.value)
                      }
                    />

                    <label>Popularity</label>
                    <select
                      value={dish.popularity}
                      onChange={(e) =>
                        updateDishRow(idx, 'popularity', e.target.value)
                      }
                    >
                      {POPULARITY_OPTIONS.map((pop) => (
                        <option key={pop} value={pop}>
                          {pop}
                        </option>
                      ))}
                    </select>

                    <label>Rating</label>
                    <StarRating
                      value={dish.rating}
                      onChange={(newVal) => updateDishRow(idx, 'rating', newVal)}
                    />

                    <label>Availability Schedule</label>
                    <input
                      type="text"
                      placeholder="e.g., Mon-Fri, 11:00-14:00"
                      value={dish.availabilitySchedule}
                      onChange={(e) =>
                        updateDishRow(idx, 'availabilitySchedule', e.target.value)
                      }
                    />

                    <label>Upload Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        updateDishRow(
                          idx,
                          'file',
                          e.target.files ? e.target.files[0] : null
                        )
                      }
                    />

                    <label>Upload Video</label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) =>
                        updateDishRow(
                          idx,
                          'videoFile',
                          e.target.files ? e.target.files[0] : null
                        )
                      }
                    />

                    {/* Availability dropdown */}
                    <label className={styles.selectRow}>
                      <select
                        className={styles.availabilityDropdown}
                        value={dish.is_available ? 'available' : 'not_available'}
                        onChange={(e) =>
                          updateDishRow(
                            idx,
                            'is_available',
                            e.target.value === 'available'
                          )
                        }
                      >
                        <option value="available">Available</option>
                        <option value="not_available">Not Available</option>
                      </select>
                    </label>

                    {multipleDishes.length > 1 && (
                      <button
                        type="button"
                        className={styles.removeDishButton}
                        onClick={() => removeDishRow(idx)}
                      >
                        Remove This Dish
                      </button>
                    )}

                    <hr />
                  </div>
                ))}

                <button
                  type="button"
                  className={styles.button}
                  onClick={addAnotherDish}
                >
                  + Add Another Dish
                </button>

                <div className={styles.modalActions}>
                  <button type="submit" className={styles.button}>
                    Create All Dishes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className={styles.button}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
