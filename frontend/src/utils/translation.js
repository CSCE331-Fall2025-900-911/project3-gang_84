/**
 * Translation Utility
 * Provides efficient translation with localStorage caching and batch support
 */

const CACHE_KEY = 'translation_cache';
const CACHE_EXPIRY_KEY = 'translation_cache_expiry';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Get translation cache from localStorage
 */
const getCache = () => {
  try {
    const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
    if (expiry && Date.now() > parseInt(expiry)) {
      // Cache expired, clear it
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_EXPIRY_KEY);
      return {};
    }
    
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (err) {
    console.error('Error reading translation cache:', err);
    return {};
  }
};

/**
 * Save translation cache to localStorage
 */
const saveCache = (cache) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
  } catch (err) {
    console.error('Error saving translation cache:', err);
  }
};

/**
 * Generate cache key for text and language
 */
const getCacheKey = (text, targetLang) => {
  return `${text}|${targetLang}`;
};

/**
 * Translate a single text
 */
export const translateText = async (text, targetLang, apiEndpoint = '/api/translate') => {
  if (targetLang === 'en' || !text || !targetLang) return text;

  // Check cache first
  const cache = getCache();
  const cacheKey = getCacheKey(text, targetLang);
  
  if (cache[cacheKey]) {
    console.log('Using cached translation for:', text);
    return cache[cacheKey];
  }

  console.log('Translating:', text, 'to', targetLang);

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang })
    });

    if (response.ok) {
      const data = await response.json();
      const translated = data.translatedText || text;
      
      console.log('Translation result:', text, '→', translated);
      
      // Save to cache
      cache[cacheKey] = translated;
      saveCache(cache);
      
      return translated;
    } else {
      console.error('Translation API error:', response.status);
    }
  } catch (err) {
    console.error('Translation error:', err);
  }
  
  return text; // Return original on error
};

/**
 * Translate multiple texts in batch (more efficient)
 * Falls back to individual translation if batch not supported
 */
export const translateBatch = async (texts, targetLang, apiEndpoint = '/api/translate') => {
  if (targetLang === 'en' || !texts || texts.length === 0) {
    return texts;
  }

  console.log(`📦 Batch translating ${texts.length} texts to ${targetLang}`);

  const cache = getCache();
  const results = [];
  const textsToTranslate = [];
  const indicesMap = [];

  // Separate cached and non-cached texts
  texts.forEach((text, index) => {
    const cacheKey = getCacheKey(text, targetLang);
    if (cache[cacheKey]) {
      results[index] = cache[cacheKey];
      console.log(`✓ Using cached: ${text} → ${cache[cacheKey]}`);
    } else {
      textsToTranslate.push(text);
      indicesMap.push(index);
    }
  });

  // If all texts are cached, return immediately
  if (textsToTranslate.length === 0) {
    console.log('✓ All translations from cache!');
    return results;
  }

  console.log(`🌐 Translating ${textsToTranslate.length} uncached texts...`);

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: textsToTranslate, targetLang })
    });

    if (response.ok) {
      const data = await response.json();
      
      // Handle batch response (translatedTexts array) or single response (translatedText string)
      const translatedTexts = data.translatedTexts || (data.translatedText ? [data.translatedText] : textsToTranslate);

      console.log(`✅ Received ${translatedTexts.length} translations from API`);

      // Merge translated texts with cached results
      translatedTexts.forEach((translated, i) => {
        const originalIndex = indicesMap[i];
        results[originalIndex] = translated;
        
        // Save to cache
        const cacheKey = getCacheKey(textsToTranslate[i], targetLang);
        cache[cacheKey] = translated;
      });

      saveCache(cache);
      return results;
    } else {
      console.warn(`⚠️ Batch translation failed (${response.status}), falling back to individual translations...`);
      
      // Fallback: translate individually
      for (let i = 0; i < textsToTranslate.length; i++) {
        const text = textsToTranslate[i];
        const originalIndex = indicesMap[i];
        const translated = await translateText(text, targetLang, apiEndpoint);
        results[originalIndex] = translated;
      }
      
      return results;
    }
  } catch (err) {
    console.error('❌ Batch translation error:', err);
    console.log('⚠️ Falling back to individual translations...');
    
    // Fallback: translate individually
    for (let i = 0; i < textsToTranslate.length; i++) {
      const text = textsToTranslate[i];
      const originalIndex = indicesMap[i];
      try {
        const translated = await translateText(text, targetLang, apiEndpoint);
        results[originalIndex] = translated;
      } catch (e) {
        console.error(`Error translating "${text}":`, e);
        results[originalIndex] = text; // Use original on error
      }
    }
    
    return results;
  }
};

/**
 * Clear translation cache (useful for debugging or forcing refresh)
 */
export const clearTranslationCache = () => {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_EXPIRY_KEY);
};

/**
 * Get translation cache statistics
 */
export const getCacheStats = () => {
  const cache = getCache();
  const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
  
  return {
    size: Object.keys(cache).length,
    expiresAt: expiry ? new Date(parseInt(expiry)) : null,
    languages: [...new Set(Object.keys(cache).map(k => k.split('|')[1]))]
  };
};
