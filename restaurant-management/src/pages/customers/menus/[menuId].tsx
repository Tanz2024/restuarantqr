import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { validate as uuidValidate } from 'uuid';
import styles from '../../dashboard/dashboard-menu.module.css';

const MenuPage = () => {
  const router = useRouter();
  const restaurantIdRaw = router.query.menuId;
  const restaurantId = Array.isArray(restaurantIdRaw)
    ? restaurantIdRaw[0]
    : restaurantIdRaw;

  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || !restaurantId) return;

    if (!uuidValidate(restaurantId)) {
      setError('Invalid restaurant ID');
      setLoading(false);
      return;
    }

    const fetchMenus = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/menus/${restaurantId}`
        );
        if (res.data && Array.isArray(res.data.menus)) {
          setMenus(res.data.menus);
        } else {
          setError('No menus found for this restaurant');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to fetch menu items');
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, [router.isReady, restaurantId]);

  if (loading) return <div className={styles.loading}>Loading menu...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Menu</h1>
      {menus.length === 0 ? (
        <div className={styles.emptyState}>No menu items available.</div>
      ) : (
        <div className={styles.cardGrid}>
          {menus.map((item) => (
            <div key={item.id} className={styles.dishCard}>
              {item.image_url ? (
                <img
                  src={`/uploads${item.image_url.replace('/uploads', '')}`}
                  alt={item.name}
                  className={styles.thumbnail}
                />
              ) : (
                <div className={styles.thumbnail}>No image</div>
              )}
              <div className={styles.cardContent}>
                <h4 className={styles.dishName}>{item.name}</h4>
                <p className={styles.price}>
                  {item.currency || 'MYR'}
                  {Number(item.price).toFixed(2)}
                </p>
                <p className={styles.category}>Category: {item.category}</p>
                <p className={styles.schedule}>
                  {item.is_available ? 'Available' : 'Not Available'}
                </p>
                {item.description && (
                  <p className={styles.description}>{item.description}</p>
                )}
                {item.dishTags?.length > 0 && (
                  <div className={styles.tagContainer}>
                    {item.dishTags.map((tag: string, i: number) => (
                      <span key={i} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MenuPage;
