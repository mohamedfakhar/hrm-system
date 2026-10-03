const { mapArabicDatePhrase } = require('./arabicNormalizer');

/**
 * Date Parser Utility for HR Smart Assistant
 * Converts natural-language date phrases (English and Arabic) into exact start and end dates.
 */

function parseDateRange(phrase, now = new Date()) {
  const raw = (phrase || '').toLowerCase().trim();
  const arabicMapped = mapArabicDatePhrase(raw);
  const clean = arabicMapped || raw;

  const startOfDay = (d) => {
    const res = new Date(d);
    res.setHours(0, 0, 0, 0);
    return res;
  };

  const endOfDay = (d) => {
    const res = new Date(d);
    res.setHours(23, 59, 59, 999);
    return res;
  };

  // 1. Today / النهارده / اليوم
  if (clean.includes('today')) {
    return {
      startDate: startOfDay(now),
      endDate: endOfDay(now),
      label: 'Today',
      labelAr: 'اليوم'
    };
  }

  // 2. Yesterday / امبارح / أمس
  if (clean.includes('yesterday')) {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return {
      startDate: startOfDay(y),
      endDate: endOfDay(y),
      label: 'Yesterday',
      labelAr: 'أمس'
    };
  }

  // 3. This Week (Monday to Sunday) / هذا الأسبوع / الأسبوع ده
  if (clean.includes('this week') || clean.includes('current week')) {
    const current = new Date(now);
    const day = current.getDay(); // 0 is Sunday
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);

    return {
      startDate: startOfDay(monday),
      endDate: endOfDay(sunday),
      label: 'This Week',
      labelAr: 'هذا الأسبوع'
    };
  }

  // 4. Last Week / الأسبوع الماضي / الأسبوع اللي فات
  if (clean.includes('last week') || clean.includes('previous week')) {
    const current = new Date(now);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1) - 7;
    const monday = new Date(current.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);

    return {
      startDate: startOfDay(monday),
      endDate: endOfDay(sunday),
      label: 'Last Week',
      labelAr: 'الأسبوع الماضي'
    };
  }

  // 5. This Month / هذا الشهر / الشهر ده
  if (clean.includes('this month') || clean.includes('current month')) {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDate: startOfDay(firstDay),
      endDate: endOfDay(lastDay),
      label: 'This Month',
      labelAr: 'هذا الشهر'
    };
  }

  // 6. Last Month / الشهر الماضي / الشهر اللي فات
  if (clean.includes('last month') || clean.includes('previous month')) {
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      startDate: startOfDay(firstDay),
      endDate: endOfDay(lastDay),
      label: 'Last Month',
      labelAr: 'الشهر الماضي'
    };
  }

  // 7. This Quarter / هذا الربع / الربع الحالي
  if (clean.includes('this quarter') || clean.includes('current quarter')) {
    const quarter = Math.floor(now.getMonth() / 3);
    const firstDay = new Date(now.getFullYear(), quarter * 3, 1);
    const lastDay = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
    return {
      startDate: startOfDay(firstDay),
      endDate: endOfDay(lastDay),
      label: `Q${quarter + 1} ${now.getFullYear()}`,
      labelAr: `الربع ${quarter + 1} ${now.getFullYear()}`
    };
  }

  // 8. This Year / هذه السنة / السنة دي
  if (clean.includes('this year') || clean.includes('current year')) {
    const firstDay = new Date(now.getFullYear(), 0, 1);
    const lastDay = new Date(now.getFullYear(), 11, 31);
    return {
      startDate: startOfDay(firstDay),
      endDate: endOfDay(lastDay),
      label: `${now.getFullYear()}`,
      labelAr: `${now.getFullYear()}`
    };
  }

  // Default: Default to this month
  const defaultFirst = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultLast = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDate: startOfDay(defaultFirst),
    endDate: endOfDay(defaultLast),
    label: 'Current Month',
    labelAr: 'الشهر الحالي'
  };
}

module.exports = {
  parseDateRange
};
