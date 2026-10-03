/**
 * Arabic Normalization & Language Utilities for HR Smart Assistant
 * Normalizes Arabic letters, removes diacritics, maps Egyptian/Arabic phrasing,
 * handles common department synonyms, and supports name transliterations.
 */

// Diacritics regex (Fatha, Damma, Kasra, Sukun, Tanween, Shadda, etc.)
const TASHKEEL_REGEX = /[\u064B-\u065F\u0670]/g;

// Tatweel / Kashida
const TATWEEL_REGEX = /\u0640/g;

// Arabic & Persian digits
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

// Common Egyptian & Arab name mappings (Normalized Arabic -> English DB equivalent)
const NAME_TRANSLITERATIONS = {
  'احمد': 'Ahmed',
  'محمد': 'Mohamed',
  'علي': 'Ali',
  'ساره': 'Sara',
  'سارة': 'Sara',
  'محمود': 'Mahmoud',
  'عمر': 'Omar',
  'مني': 'Mona',
  'منى': 'Mona',
  'خالد': 'Khaled',
  'مصطفي': 'Mostafa',
  'مصطفى': 'Mostafa',
  'طارق': 'Tarek',
  'ياسمين': 'Yasmine',
  'كريم': 'Karim',
  'نور': 'Nour',
  'حسين': 'Hussein',
  'حسن': 'Hassan',
  'ابراهيم': 'Ibrahim',
  'هاني': 'Hany',
  'مريم': 'Maryam',
  'فاطمه': 'Fatma',
  'سلمي': 'Salma',
  'يوسف': 'Youssef'
};

/**
 * Checks if a string contains any Arabic Unicode characters.
 * @param {string} text
 * @returns {boolean}
 */
function isArabic(text) {
  if (!text) return false;
  return /[\u0600-\u06FF]/.test(text);
}

/**
 * Normalizes Arabic text for deterministic pattern matching.
 * - Strips diacritics and tatweel
 * - Normalizes Alefs: [إأآٱ] -> ا
 * - Normalizes Teh Marbuta: ة -> ه
 * - Normalizes Alef Maqsura: ى -> ي
 * - Converts Arabic digits to standard ASCII 0-9
 * - Normalizes punctuation
 * @param {string} text
 * @returns {string}
 */
function normalizeArabic(text) {
  if (!text || typeof text !== 'string') return '';

  let res = text.trim();

  // Strip tashkeel & tatweel
  res = res.replace(TASHKEEL_REGEX, '');
  res = res.replace(TATWEEL_REGEX, '');

  // Normalize Alefs
  res = res.replace(/[إأآٱ]/g, 'ا');

  // Normalize Teh Marbuta to Heh
  res = res.replace(/ة/g, 'ه');

  // Normalize Alef Maqsura to Yaa
  res = res.replace(/ى/g, 'ي');

  // Convert Arabic & Persian numerals to ASCII
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(ARABIC_DIGITS[i], i.toString());
    res = res.replaceAll(PERSIAN_DIGITS[i], i.toString());
  }

  // Normalize Arabic question mark and comma
  res = res.replace(/؟/g, '?');
  res = res.replace(/،/g, ',');

  // Collapse multiple whitespaces
  res = res.replace(/\s+/g, ' ');

  return res.toLowerCase();
}

/**
 * Maps Arabic department mentions to canonical English department names.
 * @param {string} text
 * @returns {string|null}
 */
function mapArabicDepartment(text) {
  if (!text) return null;
  const normalized = normalizeArabic(text);

  if (/هندس|engineering/i.test(normalized)) return 'Engineering';
  if (/مبيع|sales/i.test(normalized)) return 'Sales';
  if (/موارد\s*بشري|اتش\s*ار|شؤون\s*الموظفين|شئون\s*الموظفين|\bhr\b/i.test(normalized)) return 'HR';
  if (/تسويق|marketing/i.test(normalized)) return 'Marketing';
  if (/مالي|حسابات|finance/i.test(normalized)) return 'Finance';
  if (/عمليات|operations/i.test(normalized)) return 'Operations';

  return null;
}

/**
 * Maps Arabic date expressions to canonical date phrase keywords.
 * @param {string} text
 * @returns {string|null}
 */
function mapArabicDatePhrase(text) {
  if (!text) return null;
  const n = normalizeArabic(text);

  if (n.includes('النهارده') || n.includes('اليوم')) return 'today';
  if (n.includes('امبارح') || n.includes('امس')) return 'yesterday';
  if (n.includes('الاسبوع ده') || n.includes('هذا الاسبوع') || n.includes('الاسبوع الحالي')) return 'this week';
  if (n.includes('الاسبوع اللي فات') || n.includes('الاسبوع الماضي') || n.includes('الاسبوع السابق')) return 'last week';
  if (n.includes('الشهر ده') || n.includes('هذا الشهر') || n.includes('الشهر الحالي') || n.includes('الشهردة')) return 'this month';
  if (n.includes('الشهر اللي فات') || n.includes('الشهر الماضي') || n.includes('الشهر السابق')) return 'last month';
  if (n.includes('الربع الحالي') || n.includes('هذا الربع') || n.includes('الربع ده')) return 'this quarter';
  if (n.includes('السنه دي') || n.includes('هذه السنه') || n.includes('السنه الحاليه')) return 'this year';

  return null;
}

/**
 * Returns transliterated English equivalent for Arabic employee names.
 * Supports single names and space-separated compound names (e.g. "أحمد محمد" -> "Ahmed Mohamed")
 * @param {string} arabicName
 * @returns {string|null}
 */
function transliterateArabicName(arabicName) {
  if (!arabicName) return null;
  const norm = normalizeArabic(arabicName).trim();
  if (NAME_TRANSLITERATIONS[norm]) return NAME_TRANSLITERATIONS[norm];

  const parts = norm.split(/\s+/);
  if (parts.length > 1) {
    let hasMatch = false;
    const transliteratedParts = parts.map((p) => {
      if (NAME_TRANSLITERATIONS[p]) {
        hasMatch = true;
        return NAME_TRANSLITERATIONS[p];
      }
      return p;
    });
    if (hasMatch) return transliteratedParts.join(' ');
  }

  return null;
}

module.exports = {
  isArabic,
  normalizeArabic,
  mapArabicDepartment,
  mapArabicDatePhrase,
  transliterateArabicName
};
