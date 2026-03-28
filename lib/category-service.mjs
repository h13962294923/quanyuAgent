import {
  createCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  renameCategory,
  saveCategorySettings,
} from './content-monitor-db.mjs';
import { getDefaultSettings } from './default-settings.mjs';

export function listStoredCategories(db) {
  return listCategories(db);
}

export function createCategoryWithDefaults(db, { name }) {
  const category = createCategory(db, { name });
  const defaults = getDefaultSettings(category.id);

  saveCategorySettings(db, {
    categoryId: category.id,
    platforms: defaults.platforms,
    keywords: defaults.keywords,
    bloggers: defaults.bloggers,
  });

  return category;
}

export function renameStoredCategory(db, { categoryId, name }) {
  return renameCategory(db, { categoryId, name });
}

export function deleteCategoryAndResolveFallback(db, categoryId) {
  const category = getCategoryById(db, categoryId);

  if (!category) {
    throw new Error('分类不存在');
  }

  deleteCategory(db, categoryId);

  let categories = listCategories(db);

  if (!categories.length) {
    createCategoryWithDefaults(db, { name: '默认分类' });
    categories = listCategories(db);
  }

  return {
    deletedCategoryId: categoryId,
    nextCategoryId: categories[0]?.id ?? null,
    categories,
  };
}
